import { href, redirect } from "react-router";

import type { Route } from "./+types/auth.callback";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import {
  getAcceptedEmailInviteOnboardingPath,
  getValidEmailInviteInfo,
} from "~/features/organizations/accept-email-invite/accept-email-invite-helpers.server";
import { destroyEmailInviteInfoSession } from "~/features/organizations/accept-email-invite/accept-email-invite-session.server";
import { getValidInviteLinkInfo } from "~/features/organizations/accept-invite-link/accept-invite-link-helpers.server";
import { destroyInviteLinkInfoSession } from "~/features/organizations/accept-invite-link/accept-invite-link-session.server";
import {
  acceptEmailInvite,
  acceptInviteLink,
} from "~/features/organizations/organizations-helpers.server";
import {
  retrieveUserAccountWithActiveMembershipsFromDatabaseByEmail,
  upsertUserAccountInDatabaseBySupabaseUserId,
} from "~/features/user-accounts/user-accounts-model.server";
import { anonymousContext } from "~/features/user-authentication/user-authentication-middleware.server";
import { getVerifiedUserEmail } from "~/features/user-authentication/verified-email-helpers";
import { combineHeaders } from "~/utils/combine-headers.server";
import { getSearchParameterFromRequest } from "~/utils/get-search-parameter-from-request.server";
import { redirectWithToast } from "~/utils/toast.server";

export async function loader({ request, context }: Route.LoaderArgs) {
  try {
    const { supabase } = context.get(anonymousContext);
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
        if (emailInviteInfo) {
          const acceptance = await acceptEmailInvite({
            emailInviteToken: emailInviteInfo.emailInviteToken,
            i18n,
            request,
            userAccountId: maybeUser.id,
            verifiedUserEmail: getVerifiedUserEmail(user),
          });

          if (acceptance.outcome === "rejected") {
            return redirect(href("/organizations"), {
              headers: combineHeaders(
                inviteLinkHeaders,
                await destroyEmailInviteInfoSession(request),
                await destroyInviteLinkInfoSession(request),
              ),
            });
          }

          const alreadyMember = acceptance.outcome === "alreadyMember";

          return redirectWithToast(
            href("/organizations/:organizationSlug/dashboard", {
              organizationSlug: acceptance.organization.slug,
            }),
            {
              description: i18n.t(
                alreadyMember
                  ? "organizations:acceptInviteLink.alreadyMemberToastDescription"
                  : "organizations:acceptInviteLink.joinSuccessToastDescription",
                { organizationName: acceptance.organization.name },
              ),
              title: i18n.t(
                alreadyMember
                  ? "organizations:acceptInviteLink.alreadyMemberToastTitle"
                  : "organizations:acceptInviteLink.joinSuccessToastTitle",
              ),
              type: alreadyMember ? "info" : "success",
            },
            {
              headers: combineHeaders(
                inviteLinkHeaders,
                await destroyEmailInviteInfoSession(request),
                await destroyInviteLinkInfoSession(request),
              ),
            },
          );
        } else if (inviteLinkInfo) {
          const { organizationId, organizationName, organizationSlug } =
            inviteLinkInfo;

          if (
            maybeUser.memberships.some(
              (membership) => membership.organizationId === organizationId,
            )
          ) {
            return redirectWithToast(
              href("/organizations/:organizationSlug/dashboard", {
                organizationSlug,
              }),
              {
                description: i18n.t(
                  "organizations:acceptInviteLink.alreadyMemberToastDescription",
                  { organizationName },
                ),
                title: i18n.t(
                  "organizations:acceptInviteLink.alreadyMemberToastTitle",
                ),
                type: "info",
              },
              {
                headers: combineHeaders(
                  await destroyEmailInviteInfoSession(request),
                  await destroyInviteLinkInfoSession(request),
                ),
              },
            );
          }

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
              organizationSlug,
            }),
            {
              description: i18n.t(
                "organizations:acceptInviteLink.joinSuccessToastDescription",
                { organizationName },
              ),
              title: i18n.t(
                "organizations:acceptInviteLink.joinSuccessToastTitle",
              ),
              type: "success",
            },
            {
              headers: combineHeaders(
                emailInviteHeaders,
                await destroyInviteLinkInfoSession(request),
              ),
            },
          );
        }
      }

      return redirect(href("/organizations"), {
        headers: combineHeaders(inviteLinkHeaders, emailInviteHeaders),
      });
    }

    const userProfile = await upsertUserAccountInDatabaseBySupabaseUserId({
      email,
      supabaseUserId: user.id,
    });

    if (emailInviteInfo) {
      const acceptance = await acceptEmailInvite({
        emailInviteToken: emailInviteInfo.emailInviteToken,
        i18n,
        request,
        userAccountId: userProfile.id,
        verifiedUserEmail: getVerifiedUserEmail(user),
      });
      const onboardingPath =
        acceptance.outcome === "rejected"
          ? href("/onboarding")
          : getAcceptedEmailInviteOnboardingPath(acceptance.organization.slug);

      return redirect(onboardingPath, {
        headers: combineHeaders(
          inviteLinkHeaders,
          await destroyEmailInviteInfoSession(request),
          await destroyInviteLinkInfoSession(request),
        ),
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
      headers: combineHeaders(inviteLinkHeaders, emailInviteHeaders),
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
}
