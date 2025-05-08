import { href, redirect } from 'react-router';

import { getValidInviteLinkInfo } from '~/features/organizations/accept-invite-link/accept-invite-link-helpers.server';
import { destroyInviteLinkInfoSession } from '~/features/organizations/accept-invite-link/accept-invite-link-session.server';
import { acceptInviteLink } from '~/features/organizations/organizations-helpers.server';
import {
  retrieveUserAccountWithActiveMembershipsFromDatabaseByEmail,
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

    const maybeUser =
      await retrieveUserAccountWithActiveMembershipsFromDatabaseByEmail(email);

    if (maybeUser) {
      if (inviteLinkInfo) {
        const t = await i18next.getFixedT(request, 'organizations', {
          keyPrefix: 'accept-invite-link',
        });

        // If the user is already a member of the organization, redirect to
        // the organization dashboard and show a toast.
        if (
          maybeUser.memberships.some(
            m => m.organizationId === inviteLinkInfo.organizationId,
          )
        ) {
          return redirectWithToast(
            href('/organizations/:organizationSlug/dashboard', {
              organizationSlug: inviteLinkInfo.organizationSlug,
            }),
            {
              title: t('already-member-toast-title'),
              description: t('already-member-toast-description', {
                organizationName: inviteLinkInfo.organizationName,
              }),
              type: 'info',
            },
            {
              headers: combineHeaders(
                headers,
                await destroyInviteLinkInfoSession(request),
              ),
            },
          );
        }

        // If the user is not a member of the organization, add them to the
        // organization and save the invite link use.
        await acceptInviteLink({
          userAccountId: maybeUser.id,
          organizationId: inviteLinkInfo.organizationId,
          inviteLinkId: inviteLinkInfo.inviteLinkId,
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
      await acceptInviteLink({
        userAccountId: userProfile.id,
        organizationId: inviteLinkInfo.organizationId,
        inviteLinkId: inviteLinkInfo.inviteLinkId,
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
