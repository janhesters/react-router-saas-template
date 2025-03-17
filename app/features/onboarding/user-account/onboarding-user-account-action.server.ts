import { redirect } from 'react-router';

import { updateUserAccountInDatabaseById } from '~/features/user-accounts/user-accounts-model.server';
import { getIsDataWithResponseInit } from '~/utils/get-is-data-with-response-init.server';
import { validateFormData } from '~/utils/validate-form-data.server';

import { requireUserNeedsOnboarding } from '../onboarding-helpers.server';
import type { OnboardingUserAccountErrors } from './onboarding-user-account-form-card';
import { onboardingUserAccountSchema } from './onboarding-user-account-form-card';
import type { Route } from '.react-router/types/app/routes/onboarding+/+types/user-account';

export async function onboardingUserAccountAction({
  request,
}: Route.ActionArgs) {
  try {
    const { headers, user } = await requireUserNeedsOnboarding(request);
    const data = await validateFormData(request, onboardingUserAccountSchema);

    await updateUserAccountInDatabaseById({
      id: user.id,
      user: { name: data.name },
    });

    return redirect('/onboarding/organization', { headers });
  } catch (error) {
    if (
      getIsDataWithResponseInit<{ errors: OnboardingUserAccountErrors }>(error)
    ) {
      return error;
    }

    throw error;
  }
}

// TODO: test entering New as the organization name
