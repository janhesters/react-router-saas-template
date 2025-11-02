import { data } from "react-router";
import { z } from "zod";

import type { UpdateUserAccountFormErrors } from "./account-settings";
import {
  DELETE_USER_ACCOUNT_INTENT,
  UPDATE_USER_ACCOUNT_INTENT,
} from "./account-settings-constants";
import { uploadUserAvatar } from "./account-settings-helpers.server";
import { updateUserAccountFormSchema } from "./account-settings-schemas";
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
import { getIsDataWithResponseInit } from "~/utils/get-is-data-with-response-init.server";
import { badRequest } from "~/utils/http-responses.server";
import { removeImageFromStorage } from "~/utils/storage-helpers.server";
import { createToastHeaders, redirectWithToast } from "~/utils/toast.server";
import { validateFormData } from "~/utils/validate-form-data.server";

const schema = z.discriminatedUnion("intent", [
  updateUserAccountFormSchema,
  z.object({ intent: z.literal(DELETE_USER_ACCOUNT_INTENT) }),
]);

export async function accountSettingsAction({
  context,
  request,
}: Route.ActionArgs) {
  try {
    const { user, headers, supabase } =
      await requireAuthenticatedUserWithMembershipsAndSubscriptionsExists({
        context,
        request,
      });
    const body = await validateFormData(request, schema, {
      maxFileSize: 1024 * 1024 * 1, // 1MB
    });
    const i18n = getInstance(context);

    switch (body.intent) {
      case UPDATE_USER_ACCOUNT_INTENT: {
        const updates: { name?: string; imageUrl?: string } = {};

        if (body.name && body.name !== user.name) {
          updates.name = body.name;
        }

        if (body.avatar) {
          await removeImageFromStorage(user.imageUrl);

          const publicUrl = await uploadUserAvatar({
            file: body.avatar,
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
          { success: new Date().toISOString() },
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
            error:
              "Cannot delete account while owner of organizations with other members",
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
  } catch (error) {
    if (
      getIsDataWithResponseInit<{ errors: UpdateUserAccountFormErrors }>(error)
    ) {
      return error;
    }

    throw error;
  }
}
