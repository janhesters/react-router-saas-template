import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";
import type { Stripe } from "stripe";

import { createPopulatedOrganization } from "../organizations/organizations-factories.server";
import { createPopulatedUserAccount } from "../user-accounts/user-accounts-factories.server";
import { STRIPE_API_VERSION } from "./stripe-admin.server";
import {
  createStripeCheckoutSessionFactory,
  createStripeCustomerFactory,
  createStripePriceFactory,
  createStripeProductFactory,
  createStripeSubscriptionFactory,
  createStripeSubscriptionScheduleFactory,
} from "./stripe-factories.server";
import type { Factory } from "~/utils/types";

/**
 * Base factory for all Stripe.Event fields _except_ `data` & `type`.
 */
export const createStripeEventFactory: Factory<
  Omit<Stripe.Event, "data" | "type">
> = ({
  api_version = STRIPE_API_VERSION,
  created = Math.floor(faker.date.recent({ days: 10 }).getTime() / 1000),
  id = `evt_${createId()}`,
  livemode = false,
  object = "event",
  pending_webhooks = faker.number.int({ max: 5, min: 1 }),
  request = {
    id: null,
    idempotency_key: faker.string.uuid(),
  },
} = {}) => ({
  api_version,
  created,
  id,
  livemode,
  object,
  pending_webhooks,
  request,
});

export const createStripeCheckoutSessionCompletedEventFactory: Factory<
  Stripe.CheckoutSessionCompletedEvent
> = ({
  data = { object: createStripeCheckoutSessionFactory() },
  type = "checkout.session.completed",
  ...rest
} = {}) => ({ ...createStripeEventFactory(rest), data, type });

export const createStripeCustomerCreatedEventFactory: Factory<
  Stripe.CustomerCreatedEvent
> = ({
  data = { object: createStripeCustomerFactory() },
  type = "customer.created",
  ...rest
} = {}) => ({ ...createStripeEventFactory(rest), data, type });

export const createStripeCustomerDeletedEventFactory: Factory<
  Stripe.CustomerDeletedEvent
> = ({
  data = { object: createStripeCustomerFactory() },
  type = "customer.deleted",
  ...rest
} = {}) => ({ ...createStripeEventFactory(rest), data, type });

export const createStripeCustomerSubscriptionCreatedEventFactory: Factory<
  Stripe.CustomerSubscriptionCreatedEvent
> = ({
  data = {
    object: createStripeSubscriptionFactory({
      automatic_tax: {
        disabled_reason: null,
        enabled: true,
        liability: { type: "self" as const },
      },
      default_payment_method: `pm_${createId()}`,
      metadata: {
        organizationId: createPopulatedOrganization().id,
        organizationSlug: createPopulatedOrganization().slug,
        purchasedById: createPopulatedUserAccount().id,
      },
      payment_settings: {
        payment_method_options: {
          acss_debit: null,
          bancontact: null,
          card: {
            network: null,
            request_three_d_secure: "automatic" as const,
          },
          customer_balance: null,
          konbini: null,
          payto: null,
          pix: null,
          sepa_debit: null,
          upi: null,
          us_bank_account: null,
        },
        payment_method_types: null,
        save_default_payment_method:
          "off" as Stripe.Subscription.PaymentSettings.SaveDefaultPaymentMethod,
      },
    }),
  },
  type = "customer.subscription.created",
  ...rest
} = {}) => ({ ...createStripeEventFactory(rest), data, type });

export const createStripeCustomerSubscriptionDeletedEventFactory: Factory<
  Stripe.CustomerSubscriptionDeletedEvent
> = ({
  data = {
    object: createStripeSubscriptionFactory({
      canceled_at: Math.floor(Date.now() / 1000),
      ended_at: Math.floor(Date.now() / 1000),
      metadata: {
        organizationId: createPopulatedOrganization().id,
        purchasedById: createPopulatedUserAccount().id,
      },
      status: "canceled",
    }),
  },
  type = "customer.subscription.deleted",
  ...rest
} = {}) => ({ ...createStripeEventFactory(rest), data, type });

export const createStripeCustomerSubscriptionUpdatedEventFactory: Factory<
  Stripe.CustomerSubscriptionUpdatedEvent
> = ({
  data = {
    object: createStripeSubscriptionFactory({
      metadata: {
        organizationId: createPopulatedOrganization().id,
        purchasedById: createPopulatedUserAccount().id,
      },
    }),
  },
  type = "customer.subscription.updated",
  ...rest
} = {}) => ({ ...createStripeEventFactory(rest), data, type });

export const createStripeSubscriptionScheduleCreatedEventFactory: Factory<
  Stripe.SubscriptionScheduleCreatedEvent
> = ({
  data = { object: createStripeSubscriptionScheduleFactory() },
  type = "subscription_schedule.created",
  ...rest
} = {}) => ({ ...createStripeEventFactory(rest), data, type });

export const createStripePriceCreatedEventFactory: Factory<
  Stripe.PriceCreatedEvent
> = ({
  data = { object: createStripePriceFactory() },
  type = "price.created",
  ...rest
} = {}) => ({ ...createStripeEventFactory(rest), data, type });

export const createStripePriceDeletedEventFactory: Factory<
  Stripe.PriceDeletedEvent
> = ({
  data = { object: createStripePriceFactory() },
  type = "price.deleted",
  ...rest
} = {}) => ({ ...createStripeEventFactory(rest), data, type });

export const createStripePriceUpdatedEventFactory: Factory<
  Stripe.PriceUpdatedEvent
> = ({
  data = { object: createStripePriceFactory() },
  type = "price.updated",
  ...rest
} = {}) => ({ ...createStripeEventFactory(rest), data, type });

export const createStripeProductCreatedEventFactory: Factory<
  Stripe.ProductCreatedEvent
> = ({
  data = { object: createStripeProductFactory() },
  type = "product.created",
  ...rest
} = {}) => ({ ...createStripeEventFactory(rest), data, type });

export const createStripeProductDeletedEventFactory: Factory<
  Stripe.ProductDeletedEvent
> = ({
  data = { object: createStripeProductFactory() },
  type = "product.deleted",
  ...rest
} = {}) => ({ ...createStripeEventFactory(rest), data, type });

export const createStripeProductUpdatedEventFactory: Factory<
  Stripe.ProductUpdatedEvent
> = ({
  data = { object: createStripeProductFactory() },
  type = "product.updated",
  ...rest
} = {}) => ({ ...createStripeEventFactory(rest), data, type });

export const createStripeSubscriptionScheduleExpiringEventFactory: Factory<
  Stripe.SubscriptionScheduleExpiringEvent
> = ({
  data = { object: createStripeSubscriptionScheduleFactory() },
  type = "subscription_schedule.expiring",
  ...rest
} = {}) => ({ ...createStripeEventFactory(rest), data, type });

export const createStripeSubscriptionScheduleUpdatedEventFactory: Factory<
  Stripe.SubscriptionScheduleUpdatedEvent
> = ({
  data = { object: createStripeSubscriptionScheduleFactory() },
  type = "subscription_schedule.updated",
  ...rest
} = {}) => ({ ...createStripeEventFactory(rest), data, type });

/**
 * A webhook endpoint renders events at the API version it was created with,
 * not at the version this app sends requests with. Until the endpoint moves to
 * `STRIPE_API_VERSION`, Stripe keeps delivering the shapes below. They are the
 * `2026-08-26.dahlia` objects that stripe 22 described: the current factories
 * without the fields that `2026-09-30.endive` added.
 */
export const PREVIOUS_STRIPE_API_VERSION = "2026-08-26.dahlia";

/**
 * Relabels an event and replaces its object with an older-version object.
 */
export const toPreviousApiEvent = <Event extends Stripe.Event, PreviousObject>(
  event: Event,
  object: PreviousObject,
) => ({
  ...event,
  api_version: PREVIOUS_STRIPE_API_VERSION,
  data: { ...event.data, object },
});

export const toPreviousApiCheckoutSession = ({
  allowed_payment_method_types: _allowedPaymentMethodTypes,
  ...session
}: Stripe.Checkout.Session) => session;

export const toPreviousApiProduct = ({
  tax_details: _taxDetails,
  ...product
}: Stripe.Product) => product;

export const toPreviousApiSubscription = ({
  items,
  trial_settings,
  ...subscription
}: Stripe.Subscription) => ({
  ...subscription,
  items: {
    ...items,
    data: items.data.map(({ current_trial: _currentTrial, ...item }) => item),
  },
  trial_settings: trial_settings && {
    end_behavior: {
      missing_payment_method:
        trial_settings.end_behavior.missing_payment_method,
    },
  },
});
