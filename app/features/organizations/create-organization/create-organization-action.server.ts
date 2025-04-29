import { redirect } from 'react-router';

import {
  createStripeCustomer,
  createStripeTrialSubscription,
} from '~/features/billing/stripe-helpers.server';
import {
  saveOrganizationWithOwnerToDatabase,
  upsertStripeSubscriptionForOrganizationInDatabaseById,
} from '~/features/organizations/organizations-model.server';
import { requireAuthenticatedUserExists } from '~/features/user-accounts/user-accounts-helpers.server';
import { getIsDataWithResponseInit } from '~/utils/get-is-data-with-response-init.server';
import { slugify } from '~/utils/slugify.server';
import { validateFormData } from '~/utils/validate-form-data.server';

import type { CreateOrganizationFormErrors } from './create-organization-form-card';
import { createOrganizationFormSchema } from './create-organization-schemas';
import type { Route } from '.react-router/types/app/routes/onboarding+/+types/organization';

export async function createOrganizationAction({ request }: Route.ActionArgs) {
  try {
    const { user, headers } = await requireAuthenticatedUserExists(request);
    const data = await validateFormData(request, createOrganizationFormSchema);

    const organization = await saveOrganizationWithOwnerToDatabase({
      organization: {
        id: data.organizationId,
        imageUrl: data.logo,
        name: data.name,
        slug: slugify(data.name),
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
      getIsDataWithResponseInit<{ errors: CreateOrganizationFormErrors }>(error)
    ) {
      return error;
    }

    throw error;
  }
}
