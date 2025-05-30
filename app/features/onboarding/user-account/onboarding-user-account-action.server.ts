import { href, redirect } from 'react-router';

import { getInstance } from '~/features/localization/middleware.server';
import { destroyEmailInviteInfoSession } from '~/features/organizations/accept-email-invite/accept-email-invite-session.server';
import { destroyInviteLinkInfoSession } from '~/features/organizations/accept-invite-link/accept-invite-link-session.server';
import { updateEmailInviteLinkInDatabaseById } from '~/features/organizations/organizations-email-invite-link-model.server';
import { getInviteInfoForAuthRoutes } from '~/features/organizations/organizations-helpers.server';
import { updateUserAccountInDatabaseById } from '~/features/user-accounts/user-accounts-model.server';
import { combineHeaders } from '~/utils/combine-headers.server';
import { getIsDataWithResponseInit } from '~/utils/get-is-data-with-response-init.server';
import { redirectWithToast } from '~/utils/toast.server';
import { validateFormData } from '~/utils/validate-form-data.server';

import { requireUserNeedsOnboarding } from '../onboarding-helpers.server';
import type { OnboardingUserAccountErrors } from './onboarding-user-account-schemas';
import { onboardingUserAccountSchema } from './onboarding-user-account-schemas';
import type { Route } from '.react-router/types/app/routes/onboarding+/+types/user-account';

export async function onboardingUserAccountAction({
  request,
  context,
}: Route.ActionArgs) {
  try {
    const { headers, user } = await requireUserNeedsOnboarding(request);
    const data = await validateFormData(request, onboardingUserAccountSchema);

    await updateUserAccountInDatabaseById({
      id: user.id,
      user: { name: data.name, imageUrl: data.avatar },
    });

    const { inviteLinkInfo, headers: inviteLinkHeaders } =
      await getInviteInfoForAuthRoutes(request);

    if (user.memberships.length > 0 && inviteLinkInfo) {
      const i18n = getInstance(context);

      if (inviteLinkInfo.type === 'emailInvite') {
        await updateEmailInviteLinkInDatabaseById({
          id: inviteLinkInfo.inviteLinkId,
          emailInviteLink: { deactivatedAt: new Date() },
        });
      }

      return redirectWithToast(
        href('/organizations/:organizationSlug/dashboard', {
          organizationSlug: inviteLinkInfo.organizationSlug,
        }),
        {
          title: i18n.t(
            'organizations:accept-invite-link.join-success-toast-title',
          ),
          description: i18n.t(
            'organizations:accept-invite-link.join-success-toast-description',
            {
              organizationName: inviteLinkInfo.organizationName,
            },
          ),
          type: 'success',
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

    return redirect(href('/onboarding/organization'), {
      headers: combineHeaders(headers, inviteLinkHeaders),
    });
  } catch (error) {
    if (
      getIsDataWithResponseInit<{ errors: OnboardingUserAccountErrors }>(error)
    ) {
      return error;
    }

    throw error;
  }
}
