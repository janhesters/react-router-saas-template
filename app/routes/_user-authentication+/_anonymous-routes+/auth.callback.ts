import { href, redirect } from "react-router";

import type { Route } from "./+types/auth.callback";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { getValidEmailInviteInfo } from "~/features/organizations/accept-email-invite/accept-email-invite-helpers.server";
import { destroyEmailInviteInfoSession } from "~/features/organizations/accept-email-invite/accept-email-invite-session.server";
import { getValidInviteLinkInfo } from "~/features/organizations/accept-invite-link/accept-invite-link-helpers.server";
import { destroyInviteLinkInfoSession } from "~/features/organizations/accept-invite-link/accept-invite-link-session.server";
import {
  acceptEmailInvite,
  acceptInviteLink,
} from "~/features/organizations/organizations-helpers.server";
import {
  retrieveUserAccountWithActiveMembershipsFromDatabaseByEmail,
  saveUserAccountToDatabase,
} from "~/features/user-accounts/user-accounts-model.server";
import { anonymousContext } from "~/features/user-authentication/user-authentication-middleware.server";
import { combineHeaders } from "~/utils/combine-headers.server";
import { getSearchParameterFromRequest } from "~/utils/get-search-parameter-from-request.server";
import { redirectWithToast } from "~/utils/toast.server";

export async function loader({ request, context }: Route.LoaderArgs) {
  try {
    const { supabase, headers } = context.get(anonymousContext);
    const i18n = getInstance(context);
    const { inviteLinkInfo, headers: inviteLinkHeaders } =
      await getValidInviteLinkInfo(request);
    const { emailInviteInfo, headers: emailInviteHeaders } =
      await getValidEmailInviteInfo(request);

    const code = getSearchParameterFromRequest("code")(request);

    if (!code) {
      throw new Error("Missing code");
    }

    const {
      error,
      data: { user },
    } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      throw error;
    }

    if (!user) {
      throw new Error("User not found");
    }

    const { email } = user;

    if (!email) {
      throw new Error("User email not found");
    }

    const maybeUser =
      await retrieveUserAccountWithActiveMembershipsFromDatabaseByEmail(email);

    if (maybeUser) {
      if (inviteLinkInfo || emailInviteInfo) {
        const organizationId =
          // biome-ignore lint/style/noNonNullAssertion: The is checked above
          inviteLinkInfo?.organizationId ?? emailInviteInfo!.organizationId;
        const organizationSlug =
          // biome-ignore lint/style/noNonNullAssertion: The is checked above
          inviteLinkInfo?.organizationSlug ?? emailInviteInfo!.organizationSlug;
        const organizationName =
          // biome-ignore lint/style/noNonNullAssertion: The is checked above
          inviteLinkInfo?.organizationName ?? emailInviteInfo!.organizationName;

        // If the user is already a member of the organization, redirect to
        // the organization dashboard and show a toast.
        if (
          maybeUser.memberships.some((m) => m.organizationId === organizationId)
        ) {
          return redirectWithToast(
            href("/organizations/:organizationSlug/dashboard", {
              organizationSlug,
            }),
            {
              description: i18n.t(
                "organizations:acceptInviteLink.alreadyMemberToastDescription",
                {
                  organizationName,
                },
              ),
              title: i18n.t(
                "organizations:acceptInviteLink.alreadyMemberToastTitle",
              ),
              type: "info",
            },
            {
              headers: combineHeaders(
                headers,
                await destroyEmailInviteInfoSession(request),
                await destroyInviteLinkInfoSession(request),
              ),
            },
          );
        }

        if (emailInviteInfo) {
          await acceptEmailInvite({
            emailInviteId: emailInviteInfo.emailInviteId,
            emailInviteToken: emailInviteInfo.emailInviteToken,
            i18n,
            organizationId: emailInviteInfo.organizationId,
            request,
            role: emailInviteInfo.role,
            userAccountId: maybeUser.id,
          });

          return redirectWithToast(
            href("/organizations/:organizationSlug/dashboard", {
              organizationSlug: emailInviteInfo.organizationSlug,
            }),
            {
              description: i18n.t(
                "organizations:acceptInviteLink.joinSuccessToastDescription",
                {
                  organizationName: emailInviteInfo.organizationName,
                },
              ),
              title: i18n.t(
                "organizations:acceptInviteLink.joinSuccessToastTitle",
              ),
              type: "success",
            },
            {
              headers: combineHeaders(
                headers,
                inviteLinkHeaders,
                await destroyEmailInviteInfoSession(request),
              ),
            },
          );
        } else if (inviteLinkInfo) {
          // If the user is not a member of the organization, add them to the
          // organization and save the invite link use.
          await acceptInviteLink({
            i18n,
            inviteLinkId: inviteLinkInfo.inviteLinkId,
            inviteLinkToken: inviteLinkInfo.inviteLinkToken,
            organizationId: inviteLinkInfo.organizationId,
            request,
            userAccountId: maybeUser.id,
          });

          return redirectWithToast(
            href("/organizations/:organizationSlug/dashboard", {
              organizationSlug: inviteLinkInfo.organizationSlug,
            }),
            {
              description: i18n.t(
                "organizations:acceptInviteLink.joinSuccessToastDescription",
                {
                  organizationName: inviteLinkInfo.organizationName,
                },
              ),
              title: i18n.t(
                "organizations:acceptInviteLink.joinSuccessToastTitle",
              ),
              type: "success",
            },
            {
              headers: combineHeaders(
                headers,
                emailInviteHeaders,
                await destroyInviteLinkInfoSession(request),
              ),
            },
          );
        }
      }

      return redirect(href("/organizations"), {
        headers: combineHeaders(headers, inviteLinkHeaders, emailInviteHeaders),
      });
    }

    const userProfile = await saveUserAccountToDatabase({
      email,
      supabaseUserId: user.id,
    });

    if (emailInviteInfo) {
      await acceptEmailInvite({
        deactivatedAt: null,
        emailInviteId: emailInviteInfo.emailInviteId,
        emailInviteToken: emailInviteInfo.emailInviteToken,
        i18n,
        organizationId: emailInviteInfo.organizationId,
        request,
        role: emailInviteInfo.role,
        userAccountId: userProfile.id,
      });
    } else if (inviteLinkInfo) {
      await acceptInviteLink({
        i18n,
        inviteLinkId: inviteLinkInfo.inviteLinkId,
        inviteLinkToken: inviteLinkInfo.inviteLinkToken,
        organizationId: inviteLinkInfo.organizationId,
        request,
        userAccountId: userProfile.id,
      });
    }

    return redirect(href("/onboarding"), {
      headers: combineHeaders(headers, inviteLinkHeaders, emailInviteHeaders),
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
}
