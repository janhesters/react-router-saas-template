import { report } from "@conform-to/react/future";
import { coerceFormValue } from "@conform-to/zod/v4/future";
import { data, redirect } from "react-router";
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
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { withAccountMutationLock } from "~/features/organizations/deletion/organization-mutation-lock.server";
import { serializeAccountDeletionRecovery } from "~/features/user-accounts/deletion/account-deletion-recovery.server";
import {
  AccountDeletionError,
  requestAccountDeletion,
} from "~/features/user-accounts/deletion/account-deletion.server";
import { requireAuthenticatedUserWithMembershipsAndSubscriptionsExists } from "~/features/user-accounts/user-accounts-helpers.server";
import {
  retrieveUserAccountFromDatabaseById,
  updateUserAccountInDatabaseById,
} from "~/features/user-accounts/user-accounts-model.server";
import { badRequest, notFound } from "~/utils/http-responses.server";
import { replaceStoredImage } from "~/utils/image-replacement.server";
import { createToastHeaders } from "~/utils/toast.server";
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
  const { supabase, user } =
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
      const input = result.data;
      return withAccountMutationLock(
        user.supabaseUserId,
        async () => {
          const currentUser = await retrieveUserAccountFromDatabaseById(
            user.id,
          );
          if (!currentUser) throw notFound();
          const updates: { name?: string } = {};

          if (input.name && input.name !== currentUser.name) {
            updates.name = input.name;
          }

          if (input.avatar) {
            const file = input.avatar;
            const replacement = await replaceStoredImage({
              kind: "avatar",
              ownerId: user.id,
              previousImageUrl: currentUser.imageUrl,
              publish: (imageUrl) =>
                updateUserAccountInDatabaseById({
                  expectedImageUrl: currentUser.imageUrl,
                  id: user.id,
                  user: { ...updates, imageUrl },
                }),
              upload: () =>
                uploadUserAvatar({ file, supabase, userId: user.id }),
            });
            if (!replacement.success) {
              return data(
                {
                  result: report(result.submission, {
                    error: {
                      fieldErrors: {
                        avatar: [
                          i18n.t(
                            `settings:userAccount.errors.${replacement.reason}`,
                          ),
                        ],
                      },
                      formErrors: [],
                    },
                  }),
                },
                { status: replacement.status },
              );
            }
          } else if (Object.keys(updates).length > 0) {
            await updateUserAccountInDatabaseById({
              id: user.id,
              user: updates,
            });
          }

          const toastHeaders = await createToastHeaders({
            title: i18n.t("settings:userAccount.toast.userAccountUpdated"),
            type: "success",
          });
          return data({ result: undefined }, { headers: toastHeaders });
        },
        { shared: true },
      );
    }

    case DELETE_USER_ACCOUNT_INTENT: {
      let admission: Awaited<ReturnType<typeof requestAccountDeletion>>;
      try {
        admission = await requestAccountDeletion({
          confirmation: result.data.confirmation,
          userId: user.id,
        });
      } catch (error) {
        if (!(error instanceof AccountDeletionError)) throw error;
        return badRequest({
          result: report(result.submission, {
            error: {
              fieldErrors:
                error.code === "confirmationMismatch"
                  ? {
                      confirmation: [
                        i18n.t(
                          "settings:userAccount.dangerZone.errors.confirmationMismatch",
                        ),
                      ],
                    }
                  : {},
              formErrors:
                error.code === "ownershipRequired"
                  ? [
                      i18n.t(
                        "settings:userAccount.dangerZone.blockingOrganizationsHelp",
                      ),
                    ]
                  : [],
            },
          }),
        });
      }
      // Admission is already committed. Sign-out failure cannot undo deletion;
      // the removed local account and Auth tombstone deny further account access.
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch (error) {
        console.error("Account deletion sign-out failed", error);
      }
      return redirect(`/account-deletions/${admission.deletion.id}`, {
        headers: {
          "Set-Cookie": await serializeAccountDeletionRecovery({
            deletionId: admission.deletion.id,
            recoveryToken: admission.recoveryToken,
          }),
        },
      });
    }
  }
}
