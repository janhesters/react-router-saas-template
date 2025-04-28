import type { BillingPageProps } from './billing-page';
import type { retrieveLatestStripeSubscriptionByOrganizationId } from './stripe-subscription-model.server';

export type StripeSubscriptionData = NonNullable<
  Awaited<ReturnType<typeof retrieveLatestStripeSubscriptionByOrganizationId>>
>;

export function mapStripeSubscriptionDataToBillingPageProps({
  subscription,
  now,
}: {
  subscription: StripeSubscriptionData;
  now: Date;
}): Omit<BillingPageProps, 'organizationSlug'> {
  console.log('subscription', subscription);
  console.log('now', now);
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
  const currentSeats = maxSeats;

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

  // 7. Check free trial
  const isOnFreeTrial =
    subscription.trialEnd !== null && now < subscription.trialEnd;

  // 8. Projected total = per-user rate × seats
  const projectedTotal = currentMonthlyRatePerUser * currentSeats;

  return {
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    currentMonthlyRatePerUser,
    currentPeriodEnd,
    currentSeats,
    currentTierName,
    isEnterprisePlan: false,
    isOnFreeTrial,
    maxSeats,
    projectedTotal,
    subscriptionStatus,
  };
}
