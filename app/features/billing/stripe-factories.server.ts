/* eslint-disable unicorn/no-null */
import { faker } from '@faker-js/faker';
import { createId } from '@paralleldrive/cuid2';
import type { Stripe } from 'stripe';

import type { Factory } from '~/utils/types';

import type { PriceLookupKey } from './billing-constants';
import { pricesByLookupKey } from './billing-constants';
import { getRandomLookupKey } from './billing-factories.server';

/**
 * Creates a Stripe Customer object with populated values.
 */
export const createStripeCustomer: Factory<Stripe.Customer> = ({
  id = `cus_${createId()}`,
  object = 'customer',
  address = null,
  balance = 0,
  // realistic created timestamp within last 10 days
  created = Math.floor(faker.date.recent({ days: 10 }).getTime() / 1000),
  currency = null,
  default_source = null,
  delinquent = false,
  description = null,
  email = faker.internet.email(),
  invoice_prefix = faker.string.alphanumeric(8).toUpperCase(),
  invoice_settings = {
    custom_fields: null,
    default_payment_method: null,
    footer: null,
    rendering_options: null,
  },
  livemode = false,
  metadata = {},
  name = faker.person.fullName(),
  next_invoice_sequence = faker.number.int({ min: 1, max: 10 }),
  phone = null,
  preferred_locales = [],
  shipping = null,
  tax_exempt = 'none',
  test_clock = null,
} = {}) => ({
  id,
  object,
  address,
  balance,
  created,
  currency,
  default_source,
  delinquent,
  description,
  email,
  invoice_prefix,
  invoice_settings,
  livemode,
  metadata,
  name,
  next_invoice_sequence,
  phone,
  preferred_locales,
  shipping,
  tax_exempt,
  test_clock,
});

/**
 * Creates a Stripe Price object with populated values.
 */
export const createStripePrice: Factory<Stripe.Price> = ({
  lookup_key = getRandomLookupKey(),
  id = pricesByLookupKey[lookup_key as PriceLookupKey].id,
  object = 'price',
  active = true,
  billing_scheme = 'per_unit',
  // realistic creation within last month
  created = Math.floor(faker.date.past().getTime() / 1000),
  currency = 'usd',
  custom_unit_amount = null,
  livemode = false,
  metadata = {},
  nickname = null,
  product = `prod_${createId()}`,
  recurring = {
    interval: 'month' as Stripe.Price.Recurring.Interval,
    interval_count: 1,
    trial_period_days: null,
    usage_type: 'licensed' as Stripe.Price.Recurring.UsageType,
    meter: null,
  },
  tax_behavior = 'unspecified',
  tiers_mode = null,
  transform_quantity = null,
  type = 'recurring',
  unit_amount = faker.number.int({ min: 500, max: 5000, multipleOf: 100 }),
  unit_amount_decimal = String(
    faker.number.int({ min: 500, max: 5000, multipleOf: 100 }),
  ),
} = {}) => ({
  id,
  object,
  active,
  billing_scheme,
  created,
  currency,
  custom_unit_amount,
  livemode,
  lookup_key,
  metadata,
  nickname,
  product,
  recurring,
  tax_behavior,
  tiers_mode,
  transform_quantity,
  type,
  unit_amount,
  unit_amount_decimal,
});

/**
 * Creates a Stripe SubscriptionItem object with populated values.
 */
export const createStripeSubscriptionItem: Factory<Stripe.SubscriptionItem> = ({
  id = `si_${createId()}`,
  object = 'subscription_item',
  // realistic created within last 5 days
  created = Math.floor(faker.date.recent({ days: 5 }).getTime() / 1000),
  discounts = [],
  metadata = {},
  plan = {} as Stripe.Plan, // deprecated in favor of price
  price = createStripePrice(),
  quantity = faker.number.int({ min: 1, max: 5 }),
  subscription = `sub_${createId()}`,
  current_period_start = created,
  // realistic period end ~30 days after start
  current_period_end = Math.floor(
    faker.date.soon({ days: 30, refDate: new Date(created * 1000) }).getTime() /
      1000,
  ),
  tax_rates = [],
} = {}) => ({
  id,
  object,
  created,
  discounts,
  metadata,
  plan,
  price,
  quantity,
  subscription,
  current_period_start,
  current_period_end,
  tax_rates,
});

/**
 * Creates a Stripe Subscription object with populated values.
 */
export const createStripeSubscription: Factory<Stripe.Subscription> = ({
  id = `sub_${createId()}`,
  object = 'subscription',
  application = null,
  application_fee_percent = null,
  automatic_tax = { enabled: false, liability: null, disabled_reason: null },
  // realistic dates: created and cycle anchor within last week
  created = Math.floor(faker.date.recent({ days: 7 }).getTime() / 1000),
  billing_cycle_anchor = created,
  billing_cycle_anchor_config = null,
  cancel_at = null,
  cancel_at_period_end = false,
  canceled_at = null,
  cancellation_details = { comment: null, feedback: null, reason: null },
  collection_method = 'charge_automatically',
  currency = 'usd',
  customer = `cus_${createId()}`,
  days_until_due = null,
  default_payment_method = null,
  default_source = null,
  default_tax_rates = [],
  description = null,
  discounts = [],
  ended_at = null,
  invoice_settings = {
    account_tax_ids: null,
    issuer: { type: 'self' as Stripe.Invoice.Issuer.Type },
  },
  items: itemsParameter,
  latest_invoice = `in_${createId()}`,
  livemode = false,
  metadata = {},
  next_pending_invoice_item_invoice = null,
  on_behalf_of = null,
  pause_collection = null,
  payment_settings = {
    payment_method_options: null,
    payment_method_types: null,
    save_default_payment_method:
      'off' as Stripe.Subscription.PaymentSettings.SaveDefaultPaymentMethod,
  },
  pending_invoice_item_interval = null,
  pending_setup_intent = null,
  pending_update = null,
  schedule = null,
  start_date = created,
  status = 'active',
  test_clock = null,
  transfer_data = null,
  trial_end = null,
  trial_settings = {
    end_behavior: {
      missing_payment_method:
        'create_invoice' as Stripe.Subscription.TrialSettings.EndBehavior.MissingPaymentMethod,
    },
  },
  trial_start = null,
} = {}) => {
  const defaultItem = createStripeSubscriptionItem({
    subscription: id,
    // align periods with subscription dates
    created,
    current_period_start: created,
  });
  const items = itemsParameter ?? {
    object: 'list',
    data: [defaultItem],
    has_more: false,
    total_count: 1,
    url: `/v1/subscription_items?subscription=${id}`,
  };

  return {
    id,
    object,
    application,
    application_fee_percent,
    automatic_tax,
    billing_cycle_anchor,
    billing_cycle_anchor_config,
    cancel_at,
    cancel_at_period_end,
    canceled_at,
    cancellation_details,
    collection_method,
    created,
    currency,
    customer,
    days_until_due,
    default_payment_method,
    default_source,
    default_tax_rates,
    description,
    discounts,
    ended_at,
    invoice_settings,
    items,
    latest_invoice,
    livemode,
    metadata,
    next_pending_invoice_item_invoice,
    on_behalf_of,
    pause_collection,
    payment_settings,
    pending_invoice_item_interval,
    pending_setup_intent,
    pending_update,
    schedule,
    start_date,
    status,
    test_clock,
    transfer_data,
    trial_end,
    trial_settings,
    trial_start,
  };
};
