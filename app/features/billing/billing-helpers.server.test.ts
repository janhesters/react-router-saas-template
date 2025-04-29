import type { StripePrice, StripeSubscriptionItem } from '@prisma/client';
import { describe, expect, test } from 'vitest';

import type { Factory } from '~/utils/types';

import {
  createOrganizationWithMembershipsAndSubscriptions,
  createPopulatedOrganization,
} from '../organizations/organizations-factories.server';
import { pricesByTierAndInterval } from './billing-constants';
import {
  createPopulatedStripePrice,
  createPopulatedStripeSubscription,
  createPopulatedStripeSubscriptionItem,
} from './billing-factories.server';
import type { StripeSubscriptionData } from './billing-helpers.server';
import {
  extractBaseUrl,
  mapStripeSubscriptionDataToBillingPageProps,
} from './billing-helpers.server';
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
  test('given: an active paid monthly plan, should: return correct billing props', () => {
    const now = new Date('2025-06-01T00:00:00.000Z');
    const subscription = createStripeSubscriptionData({
      organizationId: 'org-123',
      cancelAtPeriodEnd: false,
      status: 'active',
      items: [
        {
          // top-level price override
          price: createPopulatedStripePrice({
            lookupKey: 'startup_monthly',
            unitAmount: 2000,
            metadata: { max_seats: 10 },
          }),
          // spread in a base subscription item for dates & IDs
          ...createPopulatedStripeSubscriptionItem({
            currentPeriodStart: new Date('2025-05-15T00:00:00.000Z'),
            currentPeriodEnd: new Date('2025-06-14T00:00:00.000Z'),
          }),
        },
      ],
    });
    const organization = createOrganizationWithMembershipsAndSubscriptions({
      stripeSubscriptions: [subscription],
      memberCount: 4,
    });

    const actual = mapStripeSubscriptionDataToBillingPageProps({
      organization,
      now,
    });
    const expected: BillingPageProps = {
      billingEmail: organization.billingEmail,
      cancelAtPeriodEnd: false,
      currentMonthlyRatePerUser: 20,
      currentPeriodEnd: new Date('2025-06-14T00:00:00.000Z'),
      currentSeats: 4,
      currentTierName: 'Startup',
      isEnterprisePlan: false,
      isOnFreeTrial: false,
      maxSeats: 10,
      organizationSlug: organization.slug,
      projectedTotal: 80,
      subscriptionStatus: 'active',
    };

    expect(actual).toEqual(expected);
  });

  test('given: a subscription cancelled at period end, should: mark status “paused”', () => {
    const now = new Date('2025-06-10T00:00:00.000Z');
    const subscription = createStripeSubscriptionData({
      organizationId: 'org-456',
      cancelAtPeriodEnd: true,
      status: 'active',
      items: [
        {
          price: createPopulatedStripePrice({
            lookupKey: pricesByTierAndInterval.high_monthly.lookupKey,
            unitAmount: 5000,
            metadata: { max_seats: 25 },
          }),
          ...createPopulatedStripeSubscriptionItem({
            currentPeriodStart: new Date('2025-06-01T00:00:00.000Z'),
            currentPeriodEnd: new Date('2025-06-30T00:00:00.000Z'),
          }),
        },
      ],
    });
    const organization = createOrganizationWithMembershipsAndSubscriptions({
      stripeSubscriptions: [subscription],
      memberCount: 8,
    });

    const actual = mapStripeSubscriptionDataToBillingPageProps({
      organization,
      now,
    });
    const expected: BillingPageProps = {
      billingEmail: organization.billingEmail,
      cancelAtPeriodEnd: true,
      currentMonthlyRatePerUser: 50,
      currentPeriodEnd: new Date('2025-06-30T00:00:00.000Z'),
      currentSeats: 8,
      currentTierName: 'Business',
      isEnterprisePlan: false,
      isOnFreeTrial: false,
      maxSeats: 25,
      organizationSlug: organization.slug,
      projectedTotal: 400,
      subscriptionStatus: 'paused',
    };

    expect(actual).toEqual(expected);
  });

  test('given: a subscription still in free trial, should: flag isOnFreeTrial true', () => {
    const now = new Date('2025-01-10T00:00:00.000Z');
    const organization = createOrganizationWithMembershipsAndSubscriptions({
      organization: createPopulatedOrganization({
        createdAt: new Date('2024-12-29T00:00:00.000Z'),
      }),
      memberCount: 2,
      stripeSubscriptions: [],
    });

    const actual = mapStripeSubscriptionDataToBillingPageProps({
      organization,
      now,
    });

    const expected: BillingPageProps = {
      billingEmail: organization.billingEmail,
      cancelAtPeriodEnd: false,
      currentMonthlyRatePerUser: 85,
      currentPeriodEnd: organization.trialEnd,
      currentSeats: 2,
      currentTierName: 'Business (Trial)',
      isEnterprisePlan: false,
      isOnFreeTrial: true,
      maxSeats: 25,
      organizationSlug: organization.slug,
      projectedTotal: 170,
      subscriptionStatus: 'active',
    };

    expect(actual).toEqual(expected);
  });
});

describe('extractBaseUrl()', () => {
  test('given: a request URL, should: return the base URL', () => {
    const url = new URL('https://example.com/some/path?query=param');

    const actual = extractBaseUrl(url);
    const expected = 'http://example.com';

    expect(actual).toEqual(expected);
  });
});
