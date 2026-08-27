import { href, redirect } from "react-router";

import type { Route } from "./+types/login.confirm";
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
  const { supabase } = context.get(anonymousContext);
  const i18n = getInstance(context);
  const { inviteLinkInfo, headers: inviteLinkHeaders } =
    await getValidInviteLinkInfo(request);
  const { emailInviteInfo, headers: emailInviteHeaders } =
    await getValidEmailInviteInfo(request);

  const tokenHash = getSearchParameterFromRequest("token_hash")(request);

  const {
    data: { user },
    error,
  } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "email",
  });

  if (error) {
    throw error;
  }

  if (!user?.email || !user.id) {
    throw new Error("User not found");
  }

  // If the user for some reason did NOT click the link from the register route
  // and they try to sign up again, they will instead get here because Supabase
  // will already have created a user (with an unconfirmed email).
  // So we need to check if the user already exists in the database and if not,
  // we need to create a new user account.
  const userAccount =
    await retrieveUserAccountWithActiveMembershipsFromDatabaseByEmail(
      user.email,
    );

  const finalUserAccount =
    userAccount ??
    (await upsertUserAccountInDatabaseBySupabaseUserId({
      email: user.email,
      supabaseUserId: user.id,
    }));

  if (inviteLinkInfo || emailInviteInfo) {
    if (emailInviteInfo) {
      const acceptance = await acceptEmailInvite({
        emailInviteToken: emailInviteInfo.emailInviteToken,
        i18n,
        request,
        userAccountId: finalUserAccount.id,
        verifiedUserEmail: getVerifiedUserEmail(user),
      });

      if (acceptance.outcome === "alreadyMember") {
        return redirectWithToast(
          href("/organizations/:organizationSlug/dashboard", {
            organizationSlug: acceptance.organization.slug,
          }),
          {
            description: i18n.t(
              "organizations:acceptInviteLink.alreadyMemberToastDescription",
              { organizationName: acceptance.organization.name },
            ),
            title: i18n.t(
              "organizations:acceptInviteLink.alreadyMemberToastTitle",
            ),
            type: "info",
          },
          {
            headers: combineHeaders(
              inviteLinkHeaders,
              await destroyEmailInviteInfoSession(request),
              await destroyInviteLinkInfoSession(request),
            ),
          },
        );
      }

      if (acceptance.outcome === "accepted") {
        return userAccount?.name
          ? redirectWithToast(
              href("/organizations/:organizationSlug/dashboard", {
                organizationSlug: acceptance.organization.slug,
              }),
              {
                description: i18n.t(
                  "organizations:acceptInviteLink.joinSuccessToastDescription",
                  { organizationName: acceptance.organization.name },
                ),
                title: i18n.t(
                  "organizations:acceptInviteLink.joinSuccessToastTitle",
                ),
                type: "success",
              },
              {
                headers: combineHeaders(
                  inviteLinkHeaders,
                  await destroyEmailInviteInfoSession(request),
                  await destroyInviteLinkInfoSession(request),
                ),
              },
            )
          : redirect(
              getAcceptedEmailInviteOnboardingPath(
                acceptance.organization.slug,
              ),
              {
                headers: combineHeaders(
                  inviteLinkHeaders,
                  await destroyEmailInviteInfoSession(request),
                  await destroyInviteLinkInfoSession(request),
                ),
              },
            );
      }

      return redirect(href("/organizations"), {
        headers: combineHeaders(
          inviteLinkHeaders,
          await destroyEmailInviteInfoSession(request),
          await destroyInviteLinkInfoSession(request),
        ),
      });
    } else if (inviteLinkInfo) {
      const { organizationId, organizationName, organizationSlug } =
        inviteLinkInfo;

      if (
        userAccount?.memberships.some(
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

      await acceptInviteLink({
        i18n,
        inviteLinkId: inviteLinkInfo.inviteLinkId,
        inviteLinkToken: inviteLinkInfo.inviteLinkToken,
        organizationId,
        request,
        userAccountId: finalUserAccount.id,
      });

      return userAccount?.name
        ? redirectWithToast(
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
          )
        : redirect(href("/onboarding/user-account"));
    }
  }

  return redirect(href("/organizations"), {
    headers: combineHeaders(inviteLinkHeaders, emailInviteHeaders),
  });
}
