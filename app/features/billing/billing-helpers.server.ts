import { StripeSubscriptionStatus } from '@prisma/client';

import type { OrganizationWithMembershipsAndSubscriptions } from '../onboarding/onboarding-helpers.server';
import type { Interval, Tier } from './billing-constants';
import type { StripeSubscriptionSchedulePhaseWithPrice } from './billing-factories.server';
import { getTierAndIntervalForLookupKey } from './billing-helpers';
import type { BillingPageProps } from './billing-page';
import type { CancelOrModifySubscriptionModalContentProps } from './cancel-or-modify-subscription-modal-content';
import type { retrieveLatestStripeSubscriptionByOrganizationId } from './stripe-subscription-model.server';

const cancellableSubscriptionStatuses: StripeSubscriptionStatus[] = [
  StripeSubscriptionStatus.active,
  StripeSubscriptionStatus.trialing,
  StripeSubscriptionStatus.past_due,
  StripeSubscriptionStatus.paused,
] as const;

export type StripeSubscriptionData = NonNullable<
  Awaited<ReturnType<typeof retrieveLatestStripeSubscriptionByOrganizationId>>
>;

export function mapStripeSubscriptionDataToBillingPageProps({
  organization,
  now,
}: {
  organization: OrganizationWithMembershipsAndSubscriptions;
  now: Date;
}): BillingPageProps {
  const subscription = organization.stripeSubscriptions[0];

  if (!subscription) {
    return {
      billingEmail: organization.billingEmail,
      cancelAtPeriodEnd: false,
      cancelOrModifySubscriptionModalProps: {
        canCancelSubscription: false,
        currentTier: 'high',
        currentTierInterval: 'annual',
      },
      currentInterval: 'monthly',
      currentMonthlyRatePerUser: 85,
      currentPeriodEnd: organization.trialEnd,
      currentSeats: organization._count.memberships,
      currentTier: 'high',
      isEnterprisePlan: false,
      isOnFreeTrial: true,
      maxSeats: 25,
      organizationSlug: organization.slug,
      projectedTotal: 85 * organization._count.memberships,
      subscriptionStatus: 'active',
    };
  }

  const items = subscription.items;

  // 1. Determine the end of the current billing period by taking the max timestamp
  const currentPeriodEnd = new Date(
    Math.max(...items.map(item => item.currentPeriodEnd.getTime())),
  );

  // 2. Use the first item to derive price, tier, and seats
  const { price } = items[0];

  // 3. Parse max seats from metadata.max_seats (string or number)
  // TODO: get the real max seats
  const rawMaxSeats = price.product.maxSeats;
  const maxSeats =
    typeof rawMaxSeats === 'string'
      ? Number.parseInt(rawMaxSeats, 10)
      : typeof rawMaxSeats === 'number'
        ? rawMaxSeats
        : 1;
  const currentSeats = organization._count.memberships;

  // 4. Compute the per-user monthly rate (divide annual by 12 if needed)
  let cents = price.unitAmount;
  if (price.lookupKey.endsWith('_annual')) {
    cents = Math.round(cents / 12);
  }
  const currentMonthlyRatePerUser = cents / 100;

  // 5. Humanize the tier name (capitalize lookupKey prefix)
  const currentTier = getTierAndIntervalForLookupKey(price.lookupKey).tier;

  // 6. Determine subscriptionStatus
  let subscriptionStatus: 'active' | 'inactive' | 'paused';
  if (subscription.cancelAtPeriodEnd && now > currentPeriodEnd) {
    subscriptionStatus = 'paused';
  } else if (
    subscription.status === 'active' ||
    subscription.status === 'trialing'
  ) {
    subscriptionStatus = 'active';
  } else {
    subscriptionStatus = 'inactive';
  }

  // 7. Projected total = per-user rate × seats
  const projectedTotal =
    currentMonthlyRatePerUser * organization._count.memberships;

  // 8. Cancel or modify subscription modal props
  const { tier, interval } = getTierAndIntervalForLookupKey(price.lookupKey);
  const cancelOrModifySubscriptionModalProps: CancelOrModifySubscriptionModalContentProps =
    {
      canCancelSubscription:
        !subscription.cancelAtPeriodEnd &&
        cancellableSubscriptionStatuses.includes(subscription.status),
      currentTier: tier,
      currentTierInterval: interval,
    };

  // 9. Pending change
  // 9.1) Grab the upcoming schedule (if any)
  const schedule = subscription.schedules?.[0];
  let nextPhase: StripeSubscriptionSchedulePhaseWithPrice | undefined;
  if (schedule) {
    nextPhase = schedule.phases.find(
      p => p.startDate.getTime() > now.getTime(),
    );
  }

  // 9.2) If there’s a nextPhase, derive its price & quantity
  let pendingTier: Tier | undefined;
  let pendingInterval: Interval | undefined;
  if (nextPhase) {
    const { tier, interval } = getTierAndIntervalForLookupKey(
      nextPhase.price.lookupKey,
    );
    pendingTier = tier;
    pendingInterval = interval;
  }

  return {
    billingEmail: organization.billingEmail,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    cancelOrModifySubscriptionModalProps,
    currentInterval: interval,
    currentMonthlyRatePerUser,
    currentPeriodEnd,
    currentSeats,
    currentTier,
    isEnterprisePlan: false,
    isOnFreeTrial: false,
    maxSeats,
    organizationSlug: organization.slug,
    pendingChange: nextPhase
      ? {
          pendingChangeDate: nextPhase.startDate,
          pendingInterval: pendingInterval!,
          pendingTier: pendingTier!,
        }
      : undefined,
    projectedTotal,
    subscriptionStatus,
  };
}

/**
 * Extracts the base URL from a request URL.
 *
 * @param requestUrl - The request URL.
 * @returns The base URL.
 */
export const extractBaseUrl = (url: URL) =>
  `${process.env.NODE_ENV === 'production' ? 'https:' : 'http:'}//${url.host}`;
