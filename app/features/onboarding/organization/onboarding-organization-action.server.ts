import { redirect } from 'react-router';

import {
  createStripeCustomer,
  createStripeTrialSubscription,
} from '~/features/billing/stripe-helpers.server';
import {
  saveOrganizationWithOwnerToDatabase,
  upsertStripeSubscriptionForOrganizationInDatabaseById,
} from '~/features/organizations/organizations-model.server';
import { getIsDataWithResponseInit } from '~/utils/get-is-data-with-response-init.server';
import { slugify } from '~/utils/slugify.server';
import { validateFormData } from '~/utils/validate-form-data.server';

import { requireUserNeedsOnboarding } from '../onboarding-helpers.server';
import type { OnboardingOrganizationErrors } from './onboarding-organization-schemas';
import { onboardingOrganizationSchema } from './onboarding-organization-schemas';
import type { Route } from '.react-router/types/app/routes/onboarding+/+types/organization';

export async function onboardingOrganizationAction({
  request,
}: Route.ActionArgs) {
  try {
    const { user, headers } = await requireUserNeedsOnboarding(request);
    const data = await validateFormData(request, onboardingOrganizationSchema);

    const organization = await saveOrganizationWithOwnerToDatabase({
      organization: {
        name: data.name,
        slug: slugify(data.name),
        imageUrl: data.logo,
        id: data.organizationId,
        billingEmail: user.email,
      },
      userId: user.id,
    });

    const customer = await createStripeCustomer({
      billingEmail: user.email,
      createdById: user.id,
      organizationId: organization.id,
      organizationName: organization.name,
    });

    const subscription = await createStripeTrialSubscription({
      customerId: customer.id,
      organizationId: organization.id,
      purchasedById: user.id,
    });

    await upsertStripeSubscriptionForOrganizationInDatabaseById({
      organizationId: organization.id,
      purchasedById: user.id,
      stripeCustomerId: customer.id,
      stripeSubscription: subscription,
    });

    return redirect(`/organizations/${organization.slug}`, { headers });
  } catch (error) {
    if (
      getIsDataWithResponseInit<{ errors: OnboardingOrganizationErrors }>(error)
    ) {
      return error;
    }

    throw error;
  }
}
