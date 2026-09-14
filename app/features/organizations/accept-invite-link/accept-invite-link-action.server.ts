import { href } from "react-router";
import { z } from "zod";

import { acceptInviteLink } from "../organizations-helpers.server";
import { retrieveActiveInviteLinkFromDatabaseByToken } from "../organizations-invite-link-model.server";
import { ACCEPT_INVITE_LINK_INTENT } from "./accept-invite-link-constants";
import { getInviteLinkToken } from "./accept-invite-link-helpers.server";
import { createInviteLinkInfoHeaders } from "./accept-invite-link-session.server";
import type { Route } from ".react-router/types/app/routes/organizations_+/+types/invite-link";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { requireSupabaseUserExists } from "~/features/user-accounts/user-accounts-helpers.server";
import { createSupabaseServerClient } from "~/features/user-authentication/supabase.server";
import { combineHeaders } from "~/utils/combine-headers.server";
import { getIsDataWithResponseInit } from "~/utils/get-is-data-with-response-init.server";
import { badRequest } from "~/utils/http-responses.server";
import { createToastHeaders, redirectWithToast } from "~/utils/toast.server";
import { validateFormData } from "~/utils/validate-form-data.server";

const acceptInviteLinkSchema = z.object({
  intent: z.literal(ACCEPT_INVITE_LINK_INTENT),
});

export async function acceptInviteLinkAction({
  context,
  request,
}: Route.ActionArgs) {
  try {
    const i18n = getInstance(context);
    const result = await validateFormData(request, acceptInviteLinkSchema);
    if (!result.success) return result.response;

    const data = result.data;

    switch (data.intent) {
      case ACCEPT_INVITE_LINK_INTENT: {
        const { headers, supabase } = createSupabaseServerClient({ request });
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const token = getInviteLinkToken(request);
        const link = await retrieveActiveInviteLinkFromDatabaseByToken(token);

        if (!link) {
          const toastHeaders = await createToastHeaders({
            description: i18n.t(
              "organizations:acceptInviteLink.inviteLinkInvalidToastDescription",
            ),
            title: i18n.t(
              "organizations:acceptInviteLink.inviteLinkInvalidToastTitle",
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

          const acceptance = await acceptInviteLink({
            i18n,
            inviteLinkId: link.id,
            inviteLinkToken: link.token,
            organizationId: link.organization.id,
            request,
            userAccountId: userAccount.id,
          });
          const alreadyMember = acceptance.outcome === "alreadyMember";

          return redirectWithToast(
            href("/organizations/:organizationSlug/dashboard", {
              organizationSlug: link.organization.slug,
            }),
            {
              description: i18n.t(
                alreadyMember
                  ? "organizations:acceptInviteLink.alreadyMemberToastDescription"
                  : "organizations:acceptInviteLink.joinSuccessToastDescription",
                { organizationName: link.organization.name },
              ),
              title: i18n.t(
                alreadyMember
                  ? "organizations:acceptInviteLink.alreadyMemberToastTitle"
                  : "organizations:acceptInviteLink.joinSuccessToastTitle",
              ),
              type: alreadyMember ? "info" : "success",
            },
            { headers },
          );
        }

        const inviteLinkInfo = await createInviteLinkInfoHeaders({
          expiresAt: link.expiresAt,
          inviteLinkToken: link.token,
        });
        return redirectWithToast(
          href("/register"),
          {
            description: i18n.t(
              "organizations:acceptInviteLink.inviteLinkValidToastDescription",
            ),
            title: i18n.t(
              "organizations:acceptInviteLink.inviteLinkValidToastTitle",
            ),
            type: "info",
          },
          { headers: combineHeaders(headers, inviteLinkInfo) },
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
