import { StripePriceInterval } from "@prisma/client";
import { describe, expect, test } from "vitest";

import {
  createOrganizationWithMembershipsAndSubscriptions,
  createPopulatedOrganization,
} from "../organizations/organizations-factories.server";
import { priceLookupKeysByTierAndInterval } from "./billing-constants";
import {
  createPopulatedStripePriceWithProduct,
  createPopulatedStripeSubscriptionItem,
  createPopulatedStripeSubscriptionSchedule,
  createPopulatedStripeSubscriptionScheduleWithPhasesAndPrice,
  createPopulatedStripeSubscriptionWithScheduleAndItemsWithPriceAndProduct,
  createStripeProductWithPrices,
} from "./billing-factories.server";
import type { ProductsForBillingPage } from "./billing-helpers.server";
import {
  extractBaseUrl,
  getCreateSubscriptionModalProps,
  mapStripeSubscriptionDataToBillingPageProps,
} from "./billing-helpers.server";
import type { BillingPageProps } from "./billing-page";

describe.skipIf(!!process.env.CI)(
  "mapStripeSubscriptionDataToBillingPageProps()",
  () => {
    test("given: an active paid monthly plan, should: return correct billing props", () => {
      const now = new Date("2025-06-01T00:00:00.000Z");
      const subscription =
        createPopulatedStripeSubscriptionWithScheduleAndItemsWithPriceAndProduct(
          {
            cancelAtPeriodEnd: false,
            items: [
              {
                price: createPopulatedStripePriceWithProduct({
                  interval: StripePriceInterval.month,
                  lookupKey: priceLookupKeysByTierAndInterval.mid.monthly,
                  product: { maxSeats: 10 },
                  unitAmount: 2000,
                }),
                ...createPopulatedStripeSubscriptionItem({
                  currentPeriodEnd: new Date("2025-06-14T00:00:00.000Z"),
                  currentPeriodStart: new Date("2025-05-15T00:00:00.000Z"),
                }),
              },
            ],
            organizationId: "org-123",
            schedule: {
              phases: [], // No future phases - regular active subscription
            },
            status: "active",
          },
        );
      const organization = createOrganizationWithMembershipsAndSubscriptions({
        memberCount: 4,
        stripeSubscriptions: [subscription],
      });

      const actual = mapStripeSubscriptionDataToBillingPageProps({
        now,
        organization,
      });
      const expected: Omit<BillingPageProps, "createSubscriptionModalProps"> = {
        billingEmail: organization.billingEmail,
        cancelAtPeriodEnd: false,
        cancelOrModifySubscriptionModalProps: {
          canCancelSubscription: true,
          currentTier: "mid",
          currentTierInterval: "monthly",
        },
        currentInterval: "monthly",
        currentMonthlyRatePerUser: 20,
        currentPeriodEnd: new Date("2025-06-14T00:00:00.000Z"),
        currentSeats: 4,
        currentTier: "mid",
        isEnterprisePlan: false,
        isOnFreeTrial: false,
        maxSeats: 10,
        organizationSlug: organization.slug,
        projectedTotal: 80,
        subscriptionStatus: "active",
      };

      expect(actual).toEqual(expected);
    });

    test('given: a subscription cancelled at period end but still ongoing, should: mark status "active"', () => {
      const now = new Date("2025-06-10T00:00:00.000Z");
      const subscription =
        createPopulatedStripeSubscriptionWithScheduleAndItemsWithPriceAndProduct(
          {
            cancelAtPeriodEnd: true,
            items: [
              {
                price: createPopulatedStripePriceWithProduct({
                  interval: StripePriceInterval.month,
                  lookupKey: priceLookupKeysByTierAndInterval.high.monthly,
                  product: { maxSeats: 25 },
                  unitAmount: 5000,
                }),
                ...createPopulatedStripeSubscriptionItem({
                  currentPeriodEnd: new Date("2025-06-30T00:00:00.000Z"),
                  currentPeriodStart: new Date("2025-06-01T00:00:00.000Z"),
                }),
              },
            ],
            organizationId: "org-456",
            schedule: {
              phases: [], // No future phases - subscription will end at period end
            },
            status: "active",
          },
        );
      const organization = createOrganizationWithMembershipsAndSubscriptions({
        memberCount: 8,
        stripeSubscriptions: [subscription],
      });

      const actual = mapStripeSubscriptionDataToBillingPageProps({
        now,
        organization,
      });
      const expected: Omit<BillingPageProps, "createSubscriptionModalProps"> = {
        billingEmail: organization.billingEmail,
        cancelAtPeriodEnd: true,
        cancelOrModifySubscriptionModalProps: {
          canCancelSubscription: false,
          currentTier: "high",
          currentTierInterval: "monthly",
        },
        currentInterval: "monthly",
        currentMonthlyRatePerUser: 50,
        currentPeriodEnd: new Date("2025-06-30T00:00:00.000Z"),
        currentSeats: 8,
        currentTier: "high",
        isEnterprisePlan: false,
        isOnFreeTrial: false,
        maxSeats: 25,
        organizationSlug: organization.slug,
        projectedTotal: 400,
        subscriptionStatus: "active",
      };

      expect(actual).toEqual(expected);
    });

    test('given: a subscription cancelled at period end and it ran out, should: mark status "paused"', () => {
      const now = new Date("2025-06-10T00:00:00.000Z");
      const subscription =
        createPopulatedStripeSubscriptionWithScheduleAndItemsWithPriceAndProduct(
          {
            cancelAtPeriodEnd: true,
            items: [
              {
                price: createPopulatedStripePriceWithProduct({
                  interval: StripePriceInterval.month,
                  lookupKey: priceLookupKeysByTierAndInterval.high.monthly,
                  product: { maxSeats: 25 },
                  unitAmount: 5000,
                }),
                ...createPopulatedStripeSubscriptionItem({
                  currentPeriodEnd: new Date("2025-06-09T00:00:00.000Z"),
                  currentPeriodStart: new Date("2025-06-01T00:00:00.000Z"),
                }),
              },
            ],
            organizationId: "org-456",
            schedule: {
              phases: [], // No future phases - subscription has ended
            },
            status: "active",
          },
        );
      const organization = createOrganizationWithMembershipsAndSubscriptions({
        memberCount: 8,
        stripeSubscriptions: [subscription],
      });

      const actual = mapStripeSubscriptionDataToBillingPageProps({
        now,
        organization,
      });
      const expected: Omit<BillingPageProps, "createSubscriptionModalProps"> = {
        billingEmail: organization.billingEmail,
        cancelAtPeriodEnd: true,
        cancelOrModifySubscriptionModalProps: {
          canCancelSubscription: false,
          currentTier: "high",
          currentTierInterval: "monthly",
        },
        currentInterval: "monthly",
        currentMonthlyRatePerUser: 50,
        currentPeriodEnd: new Date("2025-06-09T00:00:00.000Z"),
        currentSeats: 8,
        currentTier: "high",
        isEnterprisePlan: false,
        isOnFreeTrial: false,
        maxSeats: 25,
        organizationSlug: organization.slug,
        projectedTotal: 400,
        subscriptionStatus: "paused",
      };

      expect(actual).toEqual(expected);
    });

    test("given: a subscription still in free trial, should: flag isOnFreeTrial true", () => {
      const now = new Date("2025-01-10T00:00:00.000Z");
      const organization = createOrganizationWithMembershipsAndSubscriptions({
        memberCount: 2,
        organization: createPopulatedOrganization({
          createdAt: new Date("2024-12-29T00:00:00.000Z"),
        }),
        stripeSubscriptions: [],
      });

      const actual = mapStripeSubscriptionDataToBillingPageProps({
        now,
        organization,
      });

      const expected: Omit<BillingPageProps, "createSubscriptionModalProps"> = {
        billingEmail: organization.billingEmail,
        cancelAtPeriodEnd: false,
        cancelOrModifySubscriptionModalProps: {
          canCancelSubscription: false,
          currentTier: "high",
          currentTierInterval: "monthly",
        },
        currentInterval: "monthly",
        currentMonthlyRatePerUser: 85,
        currentPeriodEnd: organization.trialEnd,
        currentSeats: 2,
        currentTier: "high",
        isEnterprisePlan: false,
        isOnFreeTrial: true,
        maxSeats: 25,
        organizationSlug: organization.slug,
        projectedTotal: 170,
        subscriptionStatus: "active",
      };

      expect(actual).toEqual(expected);
    });

    test("given: a subscription with a pending downgrade, should: return correct billing props", () => {
      const now = new Date("2025-06-15T00:00:00.000Z");
      const subscriptionId =
        createPopulatedStripeSubscriptionWithScheduleAndItemsWithPriceAndProduct()
          .stripeId;
      const subscriptionScheduleId =
        createPopulatedStripeSubscriptionSchedule().stripeId;

      // 1) Start with a live, high-tier subscription
      const subscription = {
        ...createPopulatedStripeSubscriptionWithScheduleAndItemsWithPriceAndProduct(
          {
            cancelAtPeriodEnd: false,
            items: [
              {
                price: createPopulatedStripePriceWithProduct({
                  interval: StripePriceInterval.month,
                  lookupKey: priceLookupKeysByTierAndInterval.high.monthly,
                  product: { maxSeats: 25 },
                  unitAmount: 6000,
                }),
                ...createPopulatedStripeSubscriptionItem({
                  currentPeriodEnd: new Date("2025-06-30T00:00:00.000Z"),
                  currentPeriodStart: new Date("2025-05-01T00:00:00.000Z"),
                }),
              },
            ],
            organizationId: "org-789",
            status: "active",
            stripeId: subscriptionId,
          },
        ),
        schedule: createPopulatedStripeSubscriptionScheduleWithPhasesAndPrice({
          // deep‐override exactly the two phases you care about
          phases: [
            {
              endDate: new Date("2025-06-30T00:00:00.000Z"),
              price: {
                lookupKey: priceLookupKeysByTierAndInterval.high.monthly,
                unitAmount: 6000,
              },
              quantity: 5,
              scheduleId: subscriptionScheduleId,
              startDate: new Date("2025-05-01T00:00:00.000Z"),
            },
            {
              endDate: new Date("2025-07-30T00:00:00.000Z"),
              price: {
                lookupKey: priceLookupKeysByTierAndInterval.low.monthly,
                unitAmount: 2000,
              },
              quantity: 2,
              scheduleId: subscriptionScheduleId,
              startDate: new Date("2025-06-30T00:00:00.000Z"),
            },
          ],
          // force the same IDs you generated above
          stripeId: subscriptionScheduleId,
          subscriptionId,
        }),
      };

      const organization = createOrganizationWithMembershipsAndSubscriptions({
        memberCount: 5,
        stripeSubscriptions: [subscription],
      });

      const actual = mapStripeSubscriptionDataToBillingPageProps({
        now,
        organization,
      });
      const expected: Omit<BillingPageProps, "createSubscriptionModalProps"> = {
        billingEmail: organization.billingEmail,
        cancelAtPeriodEnd: false,
        cancelOrModifySubscriptionModalProps: {
          canCancelSubscription: true,
          currentTier: "high",
          currentTierInterval: "monthly",
        },
        currentInterval: "monthly",
        currentMonthlyRatePerUser: 60,
        currentPeriodEnd: new Date("2025-06-30T00:00:00.000Z"),
        currentSeats: 5,
        currentTier: "high",
        isEnterprisePlan: false,
        isOnFreeTrial: false,
        maxSeats: 25,
        organizationSlug: organization.slug,
        pendingChange: {
          pendingChangeDate: new Date("2025-06-30T00:00:00.000Z"),
          pendingInterval: "monthly",
          pendingTier: "low",
        },
        projectedTotal: 300,
        subscriptionStatus: "active",
      };

      expect(actual).toEqual(expected);
    });
  },
);

describe("extractBaseUrl()", () => {
  test("given: a request URL, should: return the base URL", () => {
    const url = new URL("https://example.com/some/path?query=param");

    const actual = extractBaseUrl(url);
    const expected = "http://example.com";

    expect(actual).toEqual(expected);
  });
});

describe("getCreateSubscriptionModalProps()", () => {
  test("should compute modal props from org and products", () => {
    const organization = createOrganizationWithMembershipsAndSubscriptions({
      memberCount: 3,
      stripeSubscriptions: [],
    });
    const products = [
      createStripeProductWithPrices({ maxSeats: 1 }),
      createStripeProductWithPrices({ maxSeats: 10 }),
      createStripeProductWithPrices({ maxSeats: 25 }),
    ];

    const actual = getCreateSubscriptionModalProps(organization, products);
    expect(actual).toEqual({
      createSubscriptionModalProps: {
        currentSeats: 3,
        planLimits: { high: 25, low: 1, mid: 10 },
      },
    });
  });

  test("should handle empty products", () => {
    const organization = createOrganizationWithMembershipsAndSubscriptions({
      memberCount: 2,
      stripeSubscriptions: [],
    });
    const products: ProductsForBillingPage = [];

    const actual = getCreateSubscriptionModalProps(organization, products);
    expect(actual).toEqual({
      createSubscriptionModalProps: {
        currentSeats: 2,
        planLimits: { high: 0, low: 0, mid: 0 },
      },
    });
  });
});
