import type { Interval, Tier } from './billing-constants';
import { pricesByTierAndInterval } from './billing-constants';

/**
 * Given a tier and an interval, returns the matching Stripe price ID,
 * or throws if no such combination exists.
 *
 * @param tier - The billing tier.
 * @param interval - The billing interval.
 *
 * @returns The Stripe price ID.
 *
 * @throws If the tier/interval combination is invalid.
 */
export function getPriceIdForTierAndInterval(
  tier: Tier,
  interval: Interval,
): string {
  const key = `${tier}_${interval}` as const;
  const entry = pricesByTierAndInterval[key];

  if (!entry) {
    throw new Error(`Invalid tier/interval combination: ${tier}/${interval}`);
  }

  return entry.id;
}

/**
 * Given a Stripe price ID, returns its associated tier and interval,
 * or throws if the ID is not found.
 *
 * @param priceId - The Stripe price ID to look up.
 * @returns An object with `tier` and `interval`.
 * @throws If no entry matches the given `priceId`.
 */
export function getTierAndIntervalForPriceId(priceId: string): {
  tier: Tier;
  interval: Interval;
} {
  const found = (
    Object.entries(pricesByTierAndInterval) as [
      `${Tier}_${Interval}`,
      { id: string },
    ][]
  ).find(([, { id }]) => id === priceId);

  if (!found) {
    throw new Error(`Invalid price ID: ${priceId}`);
  }

  const [key] = found;
  const [tier, interval] = key.split('_') as [Tier, Interval];
  return { tier, interval };
}
