import invariant from 'tiny-invariant';

import { stripeAdmin } from '~/features/billing/stripe-admin.server';
import {
  handleStripeCustomerCreatedEvent,
  handleStripeCustomerSubscriptionCreatedEvent,
} from '~/features/billing/stripe-event-handlers.server';
import { getErrorMessage } from '~/utils/get-error-message';

import type { Route } from './+types/stripe.webhooks';

const notAllowed = () =>
  new Response(JSON.stringify({ message: 'Method Not Allowed' }), {
    status: 405,
  });

const badRequest = (payload?: { message?: string; error?: string }) =>
  new Response(JSON.stringify({ message: 'Bad Request', ...payload }), {
    status: 400,
  });

const json = (payload: unknown) =>
  new Response(JSON.stringify(payload), { status: 200 });

export const loader = () => notAllowed();

export async function action({ request }: Route.ActionArgs) {
  const method = request.method;

  if (method !== 'POST') {
    return notAllowed();
  }

  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return badRequest({ message: 'Missing stripe-signature header' });
  }

  invariant(
    process.env.STRIPE_WEBHOOK_SECRET,
    'STRIPE_WEBHOOK_SECRET environment variable is not set',
  );
  const payload = await request.text();

  try {
    const event = stripeAdmin.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );

    switch (event.type) {
      case 'customer.created': {
        return handleStripeCustomerCreatedEvent(event);
      }
      case 'customer.subscription.created': {
        return handleStripeCustomerSubscriptionCreatedEvent(event);
      }
      default: {
        console.log('Stripe webhook unhandled event type:', event.type);
        console.log('Stripe webhook payload:', JSON.stringify(payload));

        return json({ message: `Unhandled event type: ${event.type}` });
      }
    }
  } catch (error) {
    return badRequest({ error: `Webhook Error: ${getErrorMessage(error)}` });
  }
}
