import type { Stripe } from 'stripe';

import { updateOrganizationInDatabaseById } from '../organizations/organizations-model.server';
import { updateStripeCustomer } from './stripe-helpers.server';
import { upsertStripeSubscriptionForOrganizationInDatabaseById } from './stripe-subscription-model.server';

const ok = () => new Response('OK');

export const handleStripeCheckoutSessionCompletedEvent = async (
  event: Stripe.CheckoutSessionCompletedEvent,
) => {
  console.log(
    'event.data.object in checkout session completed',
    event.data.object,
  );
  console.log(
    'trying to update organization',
    event.data.object.metadata?.organizationId,
  );
  if (event.data.object.metadata?.organizationId) {
    console.log(
      'updating organization',
      event.data.object.metadata.organizationId,
    );
    const organization = await updateOrganizationInDatabaseById({
      id: event.data.object.metadata.organizationId,
      organization: {
        ...(event.data.object.customer_details?.email && {
          billingEmail: event.data.object.customer_details.email,
        }),
        ...(typeof event.data.object.customer === 'string' && {
          stripeCustomerId: event.data.object.customer,
        }),
      },
    });

    if (typeof event.data.object.customer === 'string') {
      await updateStripeCustomer({
        customerId: event.data.object.customer,
        customerName: organization.name,
      });
    }
  }

  return ok();
};

export const handleStripeCustomerSubscriptionCreatedEvent = async (
  event: Stripe.CustomerSubscriptionCreatedEvent,
) => {
  await upsertStripeSubscriptionForOrganizationInDatabaseById(
    event.data.object,
  );

  return ok();
};

export const handleStripeCustomerSubscriptionUpdatedEvent = async (
  event: Stripe.CustomerSubscriptionUpdatedEvent,
) => {
  await upsertStripeSubscriptionForOrganizationInDatabaseById(
    event.data.object,
  );

  return ok();
};
