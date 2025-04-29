import { faker } from '@faker-js/faker';
import { createId } from '@paralleldrive/cuid2';
import type {
  StripePrice,
  StripeSubscription,
  StripeSubscriptionItem,
} from '@prisma/client';

import type { Factory } from '~/utils/types';

import type { PriceLookupKey } from './billing-constants';
import { pricesByLookupKey } from './billing-constants';

export const getRandomLookupKey = () =>
  faker.helpers.arrayElement(
    Object.keys(pricesByLookupKey) as PriceLookupKey[],
  );

/* Base factories */

/**
 * Creates a Stripe price with populated values.
 *
 * @param priceParams - StripePrice params to create price with.
 * @returns A populated Stripe price with given params.
 */
export const createPopulatedStripePrice: Factory<StripePrice> = ({
  lookupKey = getRandomLookupKey(),
  stripeId = pricesByLookupKey[lookupKey as PriceLookupKey].id,
  currency = 'usd',
  unitAmount = faker.number.int({ min: 500, max: 50_000 }),
  metadata = {},
} = {}) => ({
  stripeId,
  lookupKey,
  currency,
  unitAmount,
  metadata,
});

/**
 * Creates a Stripe subscription item with populated values.
 *
 * @param subscriptionItemParams - StripeSubscriptionItem params to create subscription item with.
 * @returns A populated Stripe subscription item with given params.
 */
export const createPopulatedStripeSubscriptionItem: Factory<
  StripeSubscriptionItem
> = ({
  stripeId = `si_${createId()}`,
  stripeSubscriptionId = `sub_${createId()}`,
  currentPeriodEnd = faker.date.future({ years: 1 }),
  currentPeriodStart = faker.date.past({ years: 1, refDate: currentPeriodEnd }),
  priceId = `price_${createId()}`,
} = {}) => ({
  stripeId,
  stripeSubscriptionId,
  currentPeriodEnd,
  currentPeriodStart,
  priceId,
});

/**
 * Creates a Stripe subscription with populated values.
 *
 * @param subscriptionParams - StripeSubscription params to create subscription with.
 * @returns A populated Stripe subscription with given params.
 */
export const createPopulatedStripeSubscription: Factory<StripeSubscription> = ({
  stripeId = `sub_${createId()}`,
  organizationId = createId(),
  purchasedById = createId(),
  created = faker.date.past({ years: 1 }),
  cancelAtPeriodEnd = false,
  trialEnd = faker.date.future({ years: 0.038, refDate: created }), // ~14 days in years
  status = 'active',
} = {}) => ({
  stripeId,
  organizationId,
  purchasedById,
  created,
  cancelAtPeriodEnd,
  trialEnd,
  status,
});

/* Compound factories */

export type SubscriptionItemWithPrice = StripeSubscriptionItem & {
  price: StripePrice;
};

/**
 * Creates a Stripe subscription item with its associated price relation.
 *
 * @param subscriptionItemWithPriceParams - Parameters to create the
 * subscription item and price with.
 * @returns A populated Stripe subscription item with its associated price.
 */
export const createSubscriptionItemWithPrice: Factory<
  SubscriptionItemWithPrice
> = ({ price = createPopulatedStripePrice(), ...rest } = {}) => ({
  price,
  ...createPopulatedStripeSubscriptionItem({
    priceId: price.stripeId,
    ...rest,
  }),
});

export type SubscriptionWithItems = StripeSubscription & {
  items: SubscriptionItemWithPrice[];
};

/**
 * Creates a Stripe subscription with its associated subscription items and
 * prices.
 *
 * @param subscriptionWithItemsParams - Parameters to create the subscription,
 * items and prices with.
 * @returns A populated Stripe subscription with its associated items and
 * prices.
 */
export const createSubscriptionWithItems: Factory<SubscriptionWithItems> = ({
  stripeId = createPopulatedStripeSubscription().stripeId,
  items = [createSubscriptionItemWithPrice({ stripeSubscriptionId: stripeId })],
  ...rest
} = {}) => ({
  ...createPopulatedStripeSubscription({ stripeId, ...rest }),
  items: items.map(item => ({ ...item, stripeSubscriptionId: stripeId })),
});

/**
 * Creates a Stripe subscription with a populated price.
 *
 * @param subscriptionWithPriceParams - Parameters to create the subscription with.
 * @returns A populated Stripe subscription with a populated price.
 */
export const createSubscriptionWithPrice = ({
  lookupKey = getRandomLookupKey(),
  ...rest
}: Partial<
  StripeSubscription & { lookupKey: PriceLookupKey }
> = {}): SubscriptionWithItems => ({
  ...createSubscriptionWithItems({
    items: [
      createSubscriptionItemWithPrice({
        price: createPopulatedStripePrice({ lookupKey }),
      }),
    ],
    ...rest,
  }),
});
