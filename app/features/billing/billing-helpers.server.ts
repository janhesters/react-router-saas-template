import type { OrganizationWithMembershipsAndSubscriptions } from '../onboarding/onboarding-helpers.server';
import type { BillingPageProps } from './billing-page';
import type { retrieveLatestStripeSubscriptionByOrganizationId } from './stripe-subscription-model.server';

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
      currentMonthlyRatePerUser: 85,
      currentPeriodEnd: organization.trialEnd,
      currentSeats: organization._count.memberships,
      currentTierName: 'Business (Trial)',
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
  const rawMaxSeats = (price.metadata as Record<string, string>)?.max_seats;
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
  const tierKey = price.lookupKey.split('_')[0] || '';
  const currentTierName = tierKey.charAt(0).toUpperCase() + tierKey.slice(1);

  // 6. Determine subscriptionStatus
  let subscriptionStatus: 'active' | 'inactive' | 'paused';
  if (subscription.cancelAtPeriodEnd && now < currentPeriodEnd) {
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

  return {
    billingEmail: organization.billingEmail,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    currentMonthlyRatePerUser,
    currentPeriodEnd,
    currentSeats,
    currentTierName,
    isEnterprisePlan: false,
    isOnFreeTrial: false,
    maxSeats,
    organizationSlug: organization.slug,
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
