import { href, redirect } from "react-router";

import type { Route } from "./+types/register.confirm";
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
import { upsertUserAccountInDatabaseBySupabaseUserId } from "~/features/user-accounts/user-accounts-model.server";
import { anonymousContext } from "~/features/user-authentication/user-authentication-middleware.server";
import { getVerifiedUserEmail } from "~/features/user-authentication/verified-email-helpers";
import { combineHeaders } from "~/utils/combine-headers.server";
import { getSearchParameterFromRequest } from "~/utils/get-search-parameter-from-request.server";

export async function loader({ request, context }: Route.LoaderArgs) {
  const { supabase } = context.get(anonymousContext);
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

  const userAccount = await upsertUserAccountInDatabaseBySupabaseUserId({
    email: user.email,
    supabaseUserId: user.id,
  });
  const i18n = getInstance(context);
  let acceptedEmailInviteOrganizationSlug: string | undefined;

  if (emailInviteInfo) {
    const acceptance = await acceptEmailInvite({
      emailInviteToken: emailInviteInfo.emailInviteToken,
      i18n,
      request,
      userAccountId: userAccount.id,
      verifiedUserEmail: getVerifiedUserEmail(user),
    });

    acceptedEmailInviteOrganizationSlug =
      acceptance.outcome === "rejected"
        ? undefined
        : acceptance.organization.slug;
  } else if (inviteLinkInfo) {
    await acceptInviteLink({
      i18n,
      inviteLinkId: inviteLinkInfo.inviteLinkId,
      inviteLinkToken: inviteLinkInfo.inviteLinkToken,
      organizationId: inviteLinkInfo.organizationId,
      request,
      userAccountId: userAccount.id,
    });
  }

  return redirect(
    acceptedEmailInviteOrganizationSlug
      ? getAcceptedEmailInviteOnboardingPath(
          acceptedEmailInviteOrganizationSlug,
        )
      : href("/onboarding"),
    {
      headers: combineHeaders(
        inviteLinkHeaders,
        emailInviteInfo
          ? combineHeaders(
              await destroyEmailInviteInfoSession(request),
              await destroyInviteLinkInfoSession(request),
            )
          : emailInviteHeaders,
      ),
    },
  );
}
