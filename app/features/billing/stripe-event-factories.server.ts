/* eslint-disable unicorn/no-null */
import { faker } from '@faker-js/faker';
import { createId } from '@paralleldrive/cuid2';
import type { Stripe } from 'stripe';

import type { Factory } from '~/utils/types';

import { createPopulatedOrganization } from '../organizations/organizations-factories.server';
import { createPopulatedUserAccount } from '../user-accounts/user-accounts-factories.server';
import {
  createStripeCheckoutSessionFactory,
  createStripeSubscriptionFactory,
  createStripeSubscriptionScheduleFactory,
} from './stripe-factories.server';

export const createStripeCheckoutSessionCompletedEvent: Factory<
  Stripe.CheckoutSessionCompletedEvent
> = ({
  id = `evt_${createId()}`,
  object = 'event',
  api_version = '2025-03-31.basil',
  created = Math.floor(faker.date.recent({ days: 10 }).getTime() / 1000),
  data = { object: createStripeCheckoutSessionFactory() },
  livemode = false,
  pending_webhooks = faker.number.int({ min: 1, max: 5 }),
  request = {
    id: null,
    idempotency_key: null,
  },
  type = 'checkout.session.completed',
} = {}) => ({
  id,
  object,
  api_version,
  created,
  data,
  livemode,
  pending_webhooks,
  request,
  type,
});

export const createStripeCustomerSubscriptionCreatedEvent: Factory<
  Stripe.CustomerSubscriptionCreatedEvent
> = ({
  id = `evt_${createId()}`,
  object = 'event',
  api_version = '2025-03-31.basil',
  created = Math.floor(faker.date.recent({ days: 10 }).getTime() / 1000),
  data = {
    object: createStripeSubscriptionFactory({
      automatic_tax: {
        enabled: true,
        liability: { type: 'self' as const },
        disabled_reason: null,
      },
      default_payment_method: `pm_${createId()}`,
      payment_settings: {
        payment_method_options: {
          acss_debit: null,
          bancontact: null,
          card: {
            network: null,
            request_three_d_secure: 'automatic' as const,
          },
          customer_balance: null,
          konbini: null,
          sepa_debit: null,
          us_bank_account: null,
        },
        payment_method_types: null,
        save_default_payment_method:
          'off' as Stripe.Subscription.PaymentSettings.SaveDefaultPaymentMethod,
      },
      metadata: {
        organizationSlug: createPopulatedOrganization().slug,
        organizationId: createPopulatedOrganization().id,
        purchasedById: createPopulatedUserAccount().id,
      },
    }),
  },
  livemode = false,
  pending_webhooks = faker.number.int({ min: 1, max: 5 }),
  request = {
    id: null,
    idempotency_key: faker.string.uuid(),
  },
  type = 'customer.subscription.created',
} = {}) => ({
  id,
  object,
  api_version,
  created,
  data,
  livemode,
  pending_webhooks,
  request,
  type,
});

export const createStripeSubscriptionScheduleCreatedEvent: Factory<
  Stripe.SubscriptionScheduleCreatedEvent
> = ({
  id = `evt_${createId()}`,
  object = 'event',
  api_version = '2025-03-31.basil',
  created = Math.floor(faker.date.recent().getTime() / 1000),
  data = { object: createStripeSubscriptionScheduleFactory() },
  livemode = false,
  pending_webhooks = faker.number.int({ min: 1, max: 5 }),
  request = {
    id: null,
    idempotency_key: faker.string.uuid(),
  },
  type = 'subscription_schedule.created',
} = {}) => ({
  id,
  object,
  api_version,
  created,
  data,
  livemode,
  pending_webhooks,
  request,
  type,
});
