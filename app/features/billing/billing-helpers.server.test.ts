import type { StripePrice, StripeSubscriptionItem } from '@prisma/client';
import { describe, expect, test } from 'vitest';

import type { Factory } from '~/utils/types';

import {
  createPopulatedStripePrice,
  createPopulatedStripeSubscription,
  createPopulatedStripeSubscriptionItem,
} from './billing-factories.server';
import type { StripeSubscriptionData } from './billing-helpers.server';
import { mapStripeSubscriptionDataToBillingPageProps } from './billing-helpers.server';
import type { BillingPageProps } from './billing-page';

type ItemOverride = Partial<StripeSubscriptionItem> & {
  price?: Partial<StripePrice>;
};

export const createStripeSubscriptionData: Factory<StripeSubscriptionData> = (
  overrides = {},
) => {
  const { items: rawItems, ...subscriptionOverrides } =
    overrides as Partial<StripeSubscriptionData> & { items?: unknown };

  const itemsOverrides = Array.isArray(rawItems)
    ? (rawItems as ItemOverride[])
    : undefined;

  const subscription = createPopulatedStripeSubscription(subscriptionOverrides);

  const baseItems: ItemOverride[] =
    itemsOverrides && itemsOverrides.length > 0
      ? itemsOverrides
      : ([{}] as ItemOverride[]);

  const items = baseItems.map(itemOverride => {
    const { price: priceOverride, ...subscriptionItemOverrides } = itemOverride;

    const price = createPopulatedStripePrice(priceOverride);
    const item = createPopulatedStripeSubscriptionItem({
      stripeSubscriptionId: subscription.stripeId,
      priceId: price.stripeId,
      ...subscriptionItemOverrides,
    });

    return { ...item, price };
  });

  return { ...subscription, items };
};

describe('mapStripeSubscriptionDataToBillingPageProps()', () => {
  test('given an active paid monthly plan, returns correct billing props', () => {
    const now = new Date('2025-06-01T00:00:00.000Z');
    const subscription = createStripeSubscriptionData({
      organizationId: 'org-123',
      cancelAtPeriodEnd: false,
      status: 'active',
      trialEnd: new Date('2025-05-01T00:00:00.000Z'),
      items: [
        {
          // top-level price override
          price: createPopulatedStripePrice({
            lookupKey: 'startup_monthly',
            unitAmount: 2000,
            metadata: { max_seats: 3 },
          }),
          // spread in a base subscription item for dates & IDs
          ...createPopulatedStripeSubscriptionItem({
            currentPeriodStart: new Date('2025-05-15T00:00:00.000Z'),
            currentPeriodEnd: new Date('2025-06-14T00:00:00.000Z'),
          }),
        },
      ],
    });

    const actual = mapStripeSubscriptionDataToBillingPageProps({
      subscription,
      now,
    });
    const expected: Omit<BillingPageProps, 'organizationSlug'> = {
      cancelAtPeriodEnd: false,
      currentMonthlyRatePerUser: 20,
      currentPeriodEnd: new Date('2025-06-14T00:00:00.000Z'),
      currentSeats: 3,
      currentTierName: 'Startup',
      isEnterprisePlan: false,
      isOnFreeTrial: false,
      maxSeats: 3,
      projectedTotal: 60,
      subscriptionStatus: 'active',
    };

    expect(actual).toEqual(expected);
  });

  test('given a subscription cancelled at period end, marks status “paused”', () => {
    const now = new Date('2025-06-10T00:00:00.000Z');
    const subscription = createStripeSubscriptionData({
      organizationId: 'org-456',
      cancelAtPeriodEnd: true,
      status: 'active',
      trialEnd: new Date('2025-01-01T00:00:00.000Z'),
      items: [
        {
          price: createPopulatedStripePrice({
            lookupKey: 'business_monthly',
            unitAmount: 5000,
            metadata: { max_seats: 5 },
          }),
          ...createPopulatedStripeSubscriptionItem({
            currentPeriodStart: new Date('2025-06-01T00:00:00.000Z'),
            currentPeriodEnd: new Date('2025-06-30T00:00:00.000Z'),
          }),
        },
      ],
    });

    const actual = mapStripeSubscriptionDataToBillingPageProps({
      subscription,
      now,
    });

    const expected: Omit<BillingPageProps, 'organizationSlug'> = {
      cancelAtPeriodEnd: true,
      currentMonthlyRatePerUser: 50,
      currentPeriodEnd: new Date('2025-06-30T00:00:00.000Z'),
      currentSeats: 5,
      currentTierName: 'Business',
      isEnterprisePlan: false,
      isOnFreeTrial: false,
      maxSeats: 5,
      projectedTotal: 250,
      subscriptionStatus: 'paused',
    };

    expect(actual).toEqual(expected);
  });

  test('given a subscription still in free trial, flags isOnFreeTrial true', () => {
    const now = new Date('2025-01-10T00:00:00.000Z');
    const subscription = createStripeSubscriptionData({
      organizationId: 'org-789',
      cancelAtPeriodEnd: false,
      status: 'trialing',
      trialEnd: new Date('2025-01-15T00:00:00.000Z'),
      items: [
        {
          price: createPopulatedStripePrice({
            lookupKey: 'hobby_monthly',
            unitAmount: 1000,
            metadata: { max_seats: 1 },
          }),
          ...createPopulatedStripeSubscriptionItem({
            currentPeriodStart: new Date('2025-01-01T00:00:00.000Z'),
            currentPeriodEnd: new Date('2025-01-31T00:00:00.000Z'),
          }),
        },
      ],
    });

    const actual = mapStripeSubscriptionDataToBillingPageProps({
      subscription,
      now,
    });

    const expected: Omit<BillingPageProps, 'organizationSlug'> = {
      cancelAtPeriodEnd: false,
      currentMonthlyRatePerUser: 10,
      currentPeriodEnd: new Date('2025-01-31T00:00:00.000Z'),
      currentSeats: 1,
      currentTierName: 'Hobby',
      isEnterprisePlan: false,
      isOnFreeTrial: true,
      maxSeats: 1,
      projectedTotal: 10,
      subscriptionStatus: 'active',
    };

    expect(actual).toEqual(expected);
  });
});
