import { OrganizationMembershipRole } from '@prisma/client';
import { href, redirect } from 'react-router';

import { getValidInviteLinkInfo } from '~/features/organizations/accept-invite-link/accept-invite-link-helpers.server';
import { destroyInviteLinkInfoSession } from '~/features/organizations/accept-invite-link/accept-invite-link-session.server';
import { saveInviteLinkUseToDatabase } from '~/features/organizations/accept-invite-link/invite-link-use-model.server';
import { addMembersToOrganizationInDatabaseById } from '~/features/organizations/organizations-model.server';
import { saveUserAccountToDatabase } from '~/features/user-accounts/user-accounts-model.server';
import { retrieveUserAccountFromDatabaseByEmail } from '~/features/user-accounts/user-accounts-model.server';
import { requireUserIsAnonymous } from '~/features/user-authentication/user-authentication-helpers.server';
import { combineHeaders } from '~/utils/combine-headers.server';
import { getSearchParameterFromRequest } from '~/utils/get-search-parameter-from-request.server';
import i18next from '~/utils/i18next.server';
import { redirectWithToast } from '~/utils/toast.server';

import type { Route } from './+types/register.confirm';

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase, headers } = await requireUserIsAnonymous(request);
  const { inviteLinkInfo, headers: inviteLinkHeaders } =
    await getValidInviteLinkInfo(request);

  const tokenHash = getSearchParameterFromRequest('token_hash')(request);

  const {
    data: { user },
    error,
  } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'email',
  });

  if (error) {
    throw error;
  }

  if (!user?.email || !user.id) {
    throw new Error('User not found');
  }

  // If the user for some reason did NOT click the link from the register route
  // and they try to sign up again, they will instead get here because Supabase
  // will already have created a user (with an unconfirmed email).
  // So we need to check if the user already exists in the database and if not,
  // we need to create a new user account.
  const userAccount = await retrieveUserAccountFromDatabaseByEmail(user.email);

  const finalUserAccount =
    userAccount ??
    (await saveUserAccountToDatabase({
      email: user.email,
      supabaseUserId: user.id,
    }));

  if (inviteLinkInfo) {
    await addMembersToOrganizationInDatabaseById({
      id: inviteLinkInfo.organizationId,
      members: [finalUserAccount.id],
      role: OrganizationMembershipRole.member,
    });
    await saveInviteLinkUseToDatabase({
      inviteLinkId: inviteLinkInfo.inviteLinkId,
      userId: finalUserAccount.id,
    });
    const t = await i18next.getFixedT(request, 'organizations', {
      keyPrefix: 'accept-invite-link',
    });

    // If the user has a name, they're already onboarded and we can redirect
    // them to their new organization's dashboar.
    return userAccount?.name
      ? redirectWithToast(
          href('/organizations/:organizationSlug/dashboard', {
            organizationSlug: inviteLinkInfo.organizationSlug,
          }),
          {
            title: t('join-success-toast-title'),
            description: t('join-success-toast-description', {
              organizationName: inviteLinkInfo.organizationName,
            }),
            type: 'success',
          },
          {
            headers: combineHeaders(
              headers,
              await destroyInviteLinkInfoSession(request),
            ),
          },
        )
      : // Otherwise, they're new and we need to send them to the onboarding
        // flow.
        redirect(href('/onboarding/user-account'), { headers });
  }

  return redirect(href('/organizations'), {
    headers: combineHeaders(headers, inviteLinkHeaders),
  });
}
