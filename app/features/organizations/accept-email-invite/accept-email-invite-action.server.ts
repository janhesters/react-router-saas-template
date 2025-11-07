import { href } from "react-router";
import { z } from "zod";

import {
  retrieveActiveEmailInviteLinkFromDatabaseByToken,
  updateEmailInviteLinkInDatabaseById,
} from "../organizations-email-invite-link-model.server";
import { acceptEmailInvite } from "../organizations-helpers.server";
import { ACCEPT_EMAIL_INVITE_INTENT } from "./accept-email-invite-constants";
import { getEmailInviteToken } from "./accept-email-invite-helpers.server";
import { createEmailInviteInfoHeaders } from "./accept-email-invite-session.server";
import type { Route } from ".react-router/types/app/routes/organizations_+/+types/email-invite";
import { getInstance } from "~/features/localization/i18n-middleware.server";
import { requireSupabaseUserExists } from "~/features/user-accounts/user-accounts-helpers.server";
import { createSupabaseServerClient } from "~/features/user-authentication/supabase.server";
import { combineHeaders } from "~/utils/combine-headers.server";
import { getErrorMessage } from "~/utils/get-error-message";
import { getIsDataWithResponseInit } from "~/utils/get-is-data-with-response-init.server";
import { badRequest } from "~/utils/http-responses.server";
import { createToastHeaders, redirectWithToast } from "~/utils/toast.server";
import { validateFormData } from "~/utils/validate-form-data.server";

const acceptEmailInviteSchema = z.object({
  intent: z.literal(ACCEPT_EMAIL_INVITE_INTENT),
});

export async function acceptEmailInviteAction({
  request,
  context,
}: Route.ActionArgs) {
  try {
    const i18n = getInstance(context);
    const result = await validateFormData(request, acceptEmailInviteSchema);
    if (!result.success) return result.response;

    const data = result.data;

    switch (data.intent) {
      case ACCEPT_EMAIL_INVITE_INTENT: {
        const { supabase, headers } = createSupabaseServerClient({ request });
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const token = getEmailInviteToken(request);

        if (!token) {
          const toastHeaders = await createToastHeaders({
            description: i18n.t(
              "organizations:accept-email-invite.invite-email-invalid-toast-description",
            ),
            title: i18n.t(
              "organizations:accept-email-invite.invite-email-invalid-toast-title",
            ),
            type: "error",
          });

          return badRequest(
            { error: "Invalid token" },
            { headers: combineHeaders(headers, toastHeaders) },
          );
        }

        const link =
          await retrieveActiveEmailInviteLinkFromDatabaseByToken(token);

        if (!link) {
          const toastHeaders = await createToastHeaders({
            description: i18n.t(
              "organizations:accept-email-invite.invite-email-invalid-toast-description",
            ),
            title: i18n.t(
              "organizations:accept-email-invite.invite-email-invalid-toast-title",
            ),
            type: "error",
          });

          return badRequest(
            { error: "Invalid token" },
            { headers: combineHeaders(headers, toastHeaders) },
          );
        }

        if (user) {
          const userAccount = await requireSupabaseUserExists(request, user.id);

          try {
            await acceptEmailInvite({
              emailInviteId: link.id,
              emailInviteToken: link.token,
              i18n,
              organizationId: link.organization.id,
              request,
              role: link.role,
              userAccountId: userAccount.id,
            });

            return redirectWithToast(
              href("/organizations/:organizationSlug/dashboard", {
                organizationSlug: link.organization.slug,
              }),
              {
                description: i18n.t(
                  "organizations:accept-email-invite.join-success-toast-description",
                  {
                    organizationName: link.organization.name,
                  },
                ),
                title: i18n.t(
                  "organizations:accept-email-invite.join-success-toast-title",
                ),
                type: "success",
              },
              { headers },
            );
          } catch (error) {
            const message = getErrorMessage(error);

            if (
              message.includes(
                "Unique constraint failed on the fields: (`memberId`,`organizationId`)",
              ) ||
              message.includes(
                "Unique constraint failed on the fields: (`userId`,`organizationId`)",
              )
            ) {
              await updateEmailInviteLinkInDatabaseById({
                emailInviteLink: { deactivatedAt: new Date() },
                id: link.id,
              });
              return await redirectWithToast(
                href("/organizations/:organizationSlug/dashboard", {
                  organizationSlug: link.organization.slug,
                }),
                {
                  description: i18n.t(
                    "organizations:accept-email-invite.already-member-toast-description",
                    {
                      organizationName: link.organization.name,
                    },
                  ),
                  title: i18n.t(
                    "organizations:accept-email-invite.already-member-toast-title",
                  ),
                  type: "info",
                },
                { headers },
              );
            }

            throw error;
          }
        }

        const emailInviteInfo = await createEmailInviteInfoHeaders({
          emailInviteToken: link.token,
          expiresAt: link.expiresAt,
        });

        return redirectWithToast(
          href("/register"),
          {
            description: i18n.t(
              "organizations:accept-email-invite.invite-email-valid-toast-description",
            ),
            title: i18n.t(
              "organizations:accept-email-invite.invite-email-valid-toast-title",
            ),
            type: "info",
          },
          { headers: combineHeaders(headers, emailInviteInfo) },
        );
      }
    }
  } catch (error) {
    if (getIsDataWithResponseInit(error)) {
      return error;
    }

    throw error;
  }
}
