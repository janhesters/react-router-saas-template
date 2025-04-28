// src/mocks/stripe-mocks.ts
import { createId } from '@paralleldrive/cuid2';
import { http, HttpResponse } from 'msw';

import {
  createStripeCustomer as createStripeCustomerFactory,
  createStripePrice as createStripePriceFactory,
  createStripeSubscription as createStripeSubscriptionFactory,
  createStripeSubscriptionItem as createStripeSubscriptionItemFactory,
} from '~/features/billing/stripe-factories.server';

const createBillingPortalSessionMock = http.post(
  'https://api.stripe.com/v1/billing_portal/sessions',
  async ({ request }) => {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const customer = params.get('customer')!;
    const return_url = params.get('return_url')!;

    const sessionId = `bps_${createId()}`;
    const session = {
      id: sessionId,
      object: 'billing_portal.session',
      customer,
      return_url,
      url: `https://billing.stripe.test/${sessionId}`,
    };

    return HttpResponse.json(session);
  },
);

const createCustomerMock = http.post(
  'https://api.stripe.com/v1/customers',
  async ({ request }) => {
    const body = await request.text();
    const params = new URLSearchParams(body);

    const email = params.get('email')!;
    const name = params.get('name')!;

    // extract metadata[...] entries
    const metadata: Record<string, string> = {};
    for (const [key, value] of params.entries()) {
      const m = /^metadata\[(.+)]$/.exec(key);
      if (m) metadata[m[1]] = value;
    }

    const customer = createStripeCustomerFactory({
      email,
      name,
      metadata,
    });

    return HttpResponse.json(customer);
  },
);

const createSubscriptionMock = http.post(
  'https://api.stripe.com/v1/subscriptions',
  async ({ request }) => {
    const body = await request.text();
    const params = new URLSearchParams(body);

    const customer = params.get('customer')!;

    // extract metadata[...] entries
    const metadata: Record<string, string> = {};
    for (const [key, value] of params.entries()) {
      const m = /^metadata\[(.+)]$/.exec(key);
      if (m) metadata[m[1]] = value;
    }

    // parse items[0][price] & items[0][quantity], etc.
    const itemsMap: Record<number, { price?: string; quantity?: number }> = {};
    for (const [key, value] of params.entries()) {
      const m = /^items\[(\d+)]\[(price|quantity)]$/.exec(key);
      if (m) {
        const index = Number(m[1]);
        itemsMap[index] = itemsMap[index] || {};
        if (m[2] === 'price') itemsMap[index].price = value;
        else itemsMap[index].quantity = Number(value);
      }
    }
    const itemParams = Object.values(itemsMap);

    // build SubscriptionItem list
    const subscriptionItems = itemParams.map(it =>
      createStripeSubscriptionItemFactory({
        price: createStripePriceFactory({ id: it.price! }),
        quantity: it.quantity!,
      }),
    );

    // now create a Subscription, overriding what we care about
    const subscription = createStripeSubscriptionFactory({
      customer,
      metadata,
      items: {
        object: 'list',
        data: subscriptionItems,
        has_more: false,
        url: `/v1/subscription_items?subscription=sub_xxx`, // tests typically don't hit this
      },
    });

    return HttpResponse.json(subscription);
  },
);

export const stripeHandlers = [
  createBillingPortalSessionMock,
  createCustomerMock,
  createSubscriptionMock,
];
