import { faker } from '@faker-js/faker';
import { createId } from '@paralleldrive/cuid2';
import type {
  StripePrice,
  StripeSubscription,
  StripeSubscriptionItem,
} from '@prisma/client';

import type { Factory } from '~/utils/types';

/**
 * Creates a Stripe price with populated values.
 *
 * @param priceParams - StripePrice params to create price with.
 * @returns A populated Stripe price with given params.
 */
export const createPopulatedStripePrice: Factory<StripePrice> = ({
  stripeId = `price_${createId()}`,
  lookupKey = `price_${faker.string.alphanumeric(8)}`,
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
