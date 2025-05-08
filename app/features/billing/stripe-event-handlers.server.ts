import type { Stripe } from 'stripe';

import { getErrorMessage } from '~/utils/get-error-message';

import { updateOrganizationInDatabaseById } from '../organizations/organizations-model.server';
import { updateStripeCustomer } from './stripe-helpers.server';
import { upsertStripeSubscriptionForOrganizationInDatabaseById } from './stripe-subscription-model.server';
import { upsertStripeSubscriptionScheduleInDatabase } from './stripe-subscription-schedule-model.server';
const ok = () => new Response('OK');

const prettyPrint = (event: Stripe.Event) => {
  console.log(
    `unhandled Stripe event: ${event.type}`,
    // eslint-disable-next-line unicorn/no-null
    JSON.stringify(event, null, 2),
  );
};

export const handleStripeCheckoutSessionCompletedEvent = async (
  event: Stripe.CheckoutSessionCompletedEvent,
) => {
  try {
    if (event.data.object.metadata?.organizationId) {
      const organization = await updateOrganizationInDatabaseById({
        id: event.data.object.metadata.organizationId,
        organization: {
          ...(event.data.object.customer_details?.email && {
            billingEmail: event.data.object.customer_details.email,
          }),
          ...(typeof event.data.object.customer === 'string' && {
            stripeCustomerId: event.data.object.customer,
          }),
          // End the trial now.
          trialEnd: new Date(),
        },
      });

      if (typeof event.data.object.customer === 'string') {
        await updateStripeCustomer({
          customerId: event.data.object.customer,
          customerName: organization.name,
          organizationId: organization.id,
        });
      }
    } else {
      prettyPrint(event);
    }
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error(
      'Error handling Stripe checkout session completed event',
      message,
    );
  }

  return ok();
};

export const handleStripeCustomerDeletedEvent = async (
  event: Stripe.CustomerDeletedEvent,
) => {
  try {
    if (event.data.object.metadata?.organizationId) {
      await updateOrganizationInDatabaseById({
        id: event.data.object.metadata.organizationId,
        // eslint-disable-next-line unicorn/no-null
        organization: { stripeCustomerId: null },
      });
    } else {
      prettyPrint(event);
    }
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error('Error handling Stripe customer deleted event', message);
  }

  return ok();
};

export const handleStripeCustomerSubscriptionCreatedEvent = async (
  event: Stripe.CustomerSubscriptionCreatedEvent,
) => {
  try {
    await upsertStripeSubscriptionForOrganizationInDatabaseById(
      event.data.object,
    );
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error('Error upserting Stripe subscription', message);
  }

  return ok();
};

export const handleStripeCustomerSubscriptionDeletedEvent = async (
  event: Stripe.CustomerSubscriptionDeletedEvent,
) => {
  try {
    await upsertStripeSubscriptionForOrganizationInDatabaseById(
      event.data.object,
    );
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error('Error upserting Stripe subscription', message);
  }

  return ok();
};

export const handleStripeCustomerSubscriptionUpdatedEvent = async (
  event: Stripe.CustomerSubscriptionUpdatedEvent,
) => {
  try {
    await upsertStripeSubscriptionForOrganizationInDatabaseById(
      event.data.object,
    );
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error('Error upserting Stripe subscription', message);
  }

  return ok();
};

export const handleStripeSubscriptionScheduleCreatedEvent = async (
  event: Stripe.SubscriptionScheduleCreatedEvent,
) => {
  try {
    await upsertStripeSubscriptionScheduleInDatabase(event.data.object);
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error('Error upserting Stripe subscription schedule', message);
  }

  return ok();
};

export const handleStripeSubscriptionScheduleExpiringEvent = async (
  event: Stripe.SubscriptionScheduleExpiringEvent,
) => {
  try {
    await upsertStripeSubscriptionScheduleInDatabase(event.data.object);
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error('Error upserting Stripe subscription schedule', message);
  }

  return ok();
};

export const handleStripeSubscriptionScheduleUpdatedEvent = async (
  event: Stripe.SubscriptionScheduleUpdatedEvent,
) => {
  try {
    await upsertStripeSubscriptionScheduleInDatabase(event.data.object);
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error('Error upserting Stripe subscription schedule', message);
  }

  return ok();
};
