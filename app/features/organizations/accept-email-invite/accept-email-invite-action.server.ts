import { href } from "react-router";
import { z } from "zod";

import { retrieveActiveEmailInviteLinkFromDatabaseByToken } from "../organizations-email-invite-link-model.server";
import { acceptEmailInvite } from "../organizations-helpers.server";
import { ACCEPT_EMAIL_INVITE_INTENT } from "./accept-email-invite-constants";
import { getEmailInviteToken } from "./accept-email-invite-helpers.server";
import {
  createEmailInviteInfoHeaders,
  destroyEmailInviteInfoSession,
} from "./accept-email-invite-session.server";
import type { Route } from ".react-router/types/app/routes/organizations_+/+types/email-invite";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { requireSupabaseUserExists } from "~/features/user-accounts/user-accounts-helpers.server";
import { createSupabaseServerClient } from "~/features/user-authentication/supabase.server";
import { getVerifiedUserEmail } from "~/features/user-authentication/verified-email-helpers";
import { combineHeaders } from "~/utils/combine-headers.server";
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

        const respondWithGenericInvalidInvite = async () => {
          const toastHeaders = await createToastHeaders({
            description: i18n.t(
              "organizations:acceptEmailInvite.inviteEmailInvalidToastDescription",
            ),
            title: i18n.t(
              "organizations:acceptEmailInvite.inviteEmailInvalidToastTitle",
            ),
            type: "error",
          });

          return badRequest(
            { error: "Invalid token" },
            {
              headers: combineHeaders(
                headers,
                toastHeaders,
                await destroyEmailInviteInfoSession(request),
              ),
            },
          );
        };

        const token = getEmailInviteToken(request);

        if (!token) {
          return await respondWithGenericInvalidInvite();
        }

        const link =
          await retrieveActiveEmailInviteLinkFromDatabaseByToken(token);

        if (!link) {
          return await respondWithGenericInvalidInvite();
        }

        if (user) {
          const userAccount = await requireSupabaseUserExists(request, user.id);

          const acceptance = await acceptEmailInvite({
            emailInviteToken: token,
            i18n,
            request,
            userAccountId: userAccount.id,
            verifiedUserEmail: getVerifiedUserEmail(user),
          });

          if (acceptance.outcome === "rejected") {
            return await respondWithGenericInvalidInvite();
          }

          const alreadyMember = acceptance.outcome === "alreadyMember";

          return redirectWithToast(
            href("/organizations/:organizationSlug/dashboard", {
              organizationSlug: acceptance.organization.slug,
            }),
            {
              description: i18n.t(
                alreadyMember
                  ? "organizations:acceptEmailInvite.alreadyMemberToastDescription"
                  : "organizations:acceptEmailInvite.joinSuccessToastDescription",
                { organizationName: acceptance.organization.name },
              ),
              title: i18n.t(
                alreadyMember
                  ? "organizations:acceptEmailInvite.alreadyMemberToastTitle"
                  : "organizations:acceptEmailInvite.joinSuccessToastTitle",
              ),
              type: alreadyMember ? "info" : "success",
            },
            {
              headers: combineHeaders(
                headers,
                await destroyEmailInviteInfoSession(request),
              ),
            },
          );
        }

        const emailInviteInfo = await createEmailInviteInfoHeaders({
          emailInviteToken: link.token,
          expiresAt: link.expiresAt,
        });

        return redirectWithToast(
          href("/register"),
          {
            description: i18n.t(
              "organizations:acceptEmailInvite.inviteEmailValidToastDescription",
            ),
            title: i18n.t(
              "organizations:acceptEmailInvite.inviteEmailValidToastTitle",
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
