import { report } from "@conform-to/react/future";
import { coerceFormValue } from "@conform-to/zod/v4/future";
import { data } from "react-router";
import { z } from "zod";

import {
  DELETE_USER_ACCOUNT_INTENT,
  UPDATE_USER_ACCOUNT_INTENT,
} from "./account-settings-constants";
import { uploadUserAvatar } from "./account-settings-helpers.server";
import {
  deleteUserAccountFormSchema,
  updateUserAccountFormSchema,
} from "./account-settings-schemas";
import type { Route } from ".react-router/types/app/routes/_authenticated-routes+/settings+/+types/account";
import { adjustSeats } from "~/features/billing/stripe-helpers.server";
import { getInstance } from "~/features/localization/i18n-middleware.server";
import { deleteOrganization } from "~/features/organizations/organizations-helpers.server";
import { requireAuthenticatedUserWithMembershipsAndSubscriptionsExists } from "~/features/user-accounts/user-accounts-helpers.server";
import {
  deleteUserAccountFromDatabaseById,
  updateUserAccountInDatabaseById,
} from "~/features/user-accounts/user-accounts-model.server";
import { supabaseAdminClient } from "~/features/user-authentication/supabase.server";
import { combineHeaders } from "~/utils/combine-headers.server";
import { badRequest } from "~/utils/http-responses.server";
import { removeImageFromStorage } from "~/utils/storage-helpers.server";
import { createToastHeaders, redirectWithToast } from "~/utils/toast.server";
import { validateFormData } from "~/utils/validate-form-data.server";

const accountSettingsActionSchema = coerceFormValue(
  z.discriminatedUnion("intent", [
    deleteUserAccountFormSchema,
    updateUserAccountFormSchema,
  ]),
);

export async function accountSettingsAction({
  context,
  request,
}: Route.ActionArgs) {
  const { user, headers, supabase } =
    await requireAuthenticatedUserWithMembershipsAndSubscriptionsExists({
      context,
      request,
    });
  const i18n = getInstance(context);

  const result = await validateFormData(request, accountSettingsActionSchema, {
    maxFileSize: 1_000_000, // 1MB
  });

  if (!result.success) {
    return result.response;
  }

  switch (result.data.intent) {
    case UPDATE_USER_ACCOUNT_INTENT: {
      const updates: { name?: string; imageUrl?: string } = {};

      if (result.data.name && result.data.name !== user.name) {
        updates.name = result.data.name;
      }

      if (result.data.avatar) {
        await removeImageFromStorage(user.imageUrl);

        const publicUrl = await uploadUserAvatar({
          file: result.data.avatar,
          supabase,
          userId: user.id,
        });
        updates.imageUrl = publicUrl;
      }

      if (Object.keys(updates).length > 0) {
        await updateUserAccountInDatabaseById({
          id: user.id,
          user: updates,
        });
      }

      const toastHeaders = await createToastHeaders({
        title: i18n.t("settings:user-account.toast.user-account-updated"),
        type: "success",
      });
      return data(
        { result: undefined },
        { headers: combineHeaders(headers, toastHeaders) },
      );
    }

    case DELETE_USER_ACCOUNT_INTENT: {
      // Check if user is an owner of any organizations with other members
      const orgsBlockingDeletion = user.memberships.filter(
        (membership) =>
          membership.role === "owner" &&
          membership.organization._count.memberships > 1,
      );

      if (orgsBlockingDeletion.length > 0) {
        return badRequest({
          result: report(result.submission, {
            error: {
              fieldErrors: {},
              formErrors: [
                "Cannot delete account while owner of organizations with other members",
              ],
            },
          }),
        });
      }

      // Find organizations where user is the sole owner (only member)
      const soleOwnerOrgs = user.memberships.filter(
        (membership) =>
          membership.role === "owner" &&
          membership.organization._count.memberships === 1,
      );

      // Delete the organizations
      await Promise.all(
        soleOwnerOrgs.map(({ organization }) =>
          deleteOrganization(organization.id),
        ),
      );

      // Delete the user's profile picture
      await removeImageFromStorage(user.imageUrl);

      // Adjust the seats for the other user's memberships
      await Promise.all(
        user.memberships
          .filter(
            (membership) =>
              !soleOwnerOrgs
                .map(({ organization }) => organization.id)
                .includes(membership.organization.id),
          )
          .filter(
            (membership) => membership.organization.stripeSubscriptions[0],
          )
          .map((membership) => {
            const subscription =
              // biome-ignore lint/style/noNonNullAssertion: the subscription is guaranteed to exist
              membership.organization.stripeSubscriptions[0]!;
            return adjustSeats({
              newQuantity: membership.organization._count.memberships - 1,
              subscriptionId: subscription.stripeId,
              // biome-ignore lint/style/noNonNullAssertion: the subscription item is guaranteed to exist
              subscriptionItemId: subscription.items[0]!.price.stripeId,
            });
          }),
      );

      // Sign out the user before deleting their account
      await supabase.auth.signOut();

      // Delete the user account (this will cascade delete their memberships)
      await deleteUserAccountFromDatabaseById(user.id);
      await supabaseAdminClient.auth.admin.deleteUser(user.supabaseUserId);

      return redirectWithToast(
        "/",
        {
          title: i18n.t("settings:user-account.toast.user-account-deleted"),
          type: "success",
        },
        { headers },
      );
    }
  }
}
