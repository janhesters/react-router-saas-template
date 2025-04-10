import { OrganizationMembershipRole } from '@prisma/client';
import { href, redirect } from 'react-router';

import { getValidInviteLinkInfo } from '~/features/organizations/accept-invite-link/accept-invite-link-helpers.server';
import { destroyInviteLinkInfoSession } from '~/features/organizations/accept-invite-link/accept-invite-link-session.server';
import { saveInviteLinkUseToDatabase } from '~/features/organizations/accept-invite-link/invite-link-use-model.server';
import { addMembersToOrganizationInDatabaseById } from '~/features/organizations/organizations-model.server';
import {
  retrieveUserAccountFromDatabaseByEmail,
  saveUserAccountToDatabase,
} from '~/features/user-accounts/user-accounts-model.server';
import { requireUserIsAnonymous } from '~/features/user-authentication/user-authentication-helpers.server';
import { combineHeaders } from '~/utils/combine-headers.server';
import { getSearchParameterFromRequest } from '~/utils/get-search-parameter-from-request.server';
import i18next from '~/utils/i18next.server';
import { redirectWithToast } from '~/utils/toast.server';

import type { Route } from './+types/auth.callback';

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const { supabase, headers } = await requireUserIsAnonymous(request);
    const { inviteLinkInfo, headers: inviteLinkHeaders } =
      await getValidInviteLinkInfo(request);

    const code = getSearchParameterFromRequest('code')(request);

    if (!code) {
      throw new Error('Missing code');
    }

    const {
      error,
      data: { user },
    } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      throw error;
    }

    if (!user) {
      throw new Error('User not found');
    }

    const { email } = user;

    if (!email) {
      throw new Error('User email not found');
    }

    const maybeUser = await retrieveUserAccountFromDatabaseByEmail(email);

    if (maybeUser) {
      if (inviteLinkInfo) {
        await addMembersToOrganizationInDatabaseById({
          id: inviteLinkInfo.organizationId,
          members: [maybeUser.id],
          role: OrganizationMembershipRole.member,
        });
        await saveInviteLinkUseToDatabase({
          inviteLinkId: inviteLinkInfo.inviteLinkId,
          userId: maybeUser.id,
        });
        const t = await i18next.getFixedT(request, 'organizations', {
          keyPrefix: 'accept-invite-link',
        });

        return redirectWithToast(
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
        );
      }

      return redirect(href('/organizations'), {
        headers: combineHeaders(headers, inviteLinkHeaders),
      });
    }

    const userProfile = await saveUserAccountToDatabase({
      email,
      supabaseUserId: user.id,
    });

    if (inviteLinkInfo) {
      await addMembersToOrganizationInDatabaseById({
        id: inviteLinkInfo.organizationId,
        members: [userProfile.id],
        role: OrganizationMembershipRole.member,
      });
      await saveInviteLinkUseToDatabase({
        inviteLinkId: inviteLinkInfo.inviteLinkId,
        userId: userProfile.id,
      });
    }

    return redirect(href('/onboarding'), {
      headers: combineHeaders(headers, inviteLinkHeaders),
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
}
