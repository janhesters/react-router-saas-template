import { useTranslation } from 'react-i18next';
import { useActionData, useNavigation } from 'react-router';
import { promiseHash } from 'remix-utils/promise';

import { GeneralErrorBoundary } from '~/components/general-error-boundary';
import { onboardingIntents } from '~/features/onboarding/onboarding-constants';
import { requireUserNeedsOnboarding } from '~/features/onboarding/onboarding-helpers.server';
import { OnboardingSteps } from '~/features/onboarding/onboarding-steps';
import { onboardingOrganizationAction } from '~/features/onboarding/organization/onboarding-organization-action.server';
import { OnboardingOrganizationFormCard } from '~/features/onboarding/organization/onboarding-organization-form-card';
import { getFormErrors } from '~/utils/get-form-errors';
import { getPageTitle } from '~/utils/get-page-title.server';
import i18next from '~/utils/i18next.server';

import type { Route } from './+types/organization';

export const handle = { i18n: 'onboarding' };

export async function loader({ request }: Route.LoaderArgs) {
  const { t } = await promiseHash({
    userNeedsOnboarding: requireUserNeedsOnboarding(request),
    t: i18next.getFixedT(request, ['onboarding', 'common']),
  });

  return { title: getPageTitle(t, 'organization.title') };
}

export const meta: Route.MetaFunction = ({ data }) => [{ title: data.title }];

export async function action(args: Route.ActionArgs) {
  return await onboardingOrganizationAction(args);
}

export default function OrganizationOnboardingRoute() {
  const { t } = useTranslation('onboarding');
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isCreatingOrganization =
    navigation.formData?.get('intent') === onboardingIntents.createOrganization;
  const errors = getFormErrors(actionData);

  return (
    <>
      <header className="sr-only">
        <h1>{t('common.onboarding')}</h1>
      </header>

      <main className="mx-auto flex min-h-svh max-w-7xl flex-col space-y-4 py-4 sm:px-6 md:h-full md:space-y-0 md:px-8">
        <OnboardingSteps
          className="px-4 sm:px-0"
          label={t('common.onboarding-progress')}
          steps={[
            {
              name: t('user-account.title'),
              href: '/onboarding/user-account',
              status: 'complete',
            },
            {
              name: t('organization.title'),
              href: '/onboarding/organization',
              status: 'current',
            },
          ]}
        />

        <div className="flex flex-grow flex-col items-center justify-center py-4">
          <OnboardingOrganizationFormCard
            errors={errors}
            isCreatingOrganization={isCreatingOrganization}
          />
        </div>
      </main>
    </>
  );
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}
