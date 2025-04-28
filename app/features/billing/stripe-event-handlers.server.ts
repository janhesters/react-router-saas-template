import type { Stripe } from 'stripe';

export const handleStripeCustomerCreatedEvent = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  event: Stripe.CustomerCreatedEvent,
  // eslint-disable-next-line @typescript-eslint/require-await
) => {
  return new Response('OK');
};

export const handleStripeCustomerSubscriptionCreatedEvent = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  event: Stripe.CustomerSubscriptionCreatedEvent,
  // eslint-disable-next-line @typescript-eslint/require-await
) => {
  return new Response('OK');
};
