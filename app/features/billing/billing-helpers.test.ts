import { describe, expect, test } from 'vitest';

import type { Interval, Tier } from './billing-constants';
import { pricesByTierAndInterval } from './billing-constants';
import {
  getPriceIdForTierAndInterval,
  getTierAndIntervalForPriceId,
} from './billing-helpers';

describe('getPriceIdForTierAndInterval()', () => {
  const validCases: { tier: Tier; interval: Interval }[] = [
    { tier: 'low', interval: 'monthly' },
    { tier: 'low', interval: 'annual' },
    { tier: 'mid', interval: 'monthly' },
    { tier: 'mid', interval: 'annual' },
    { tier: 'high', interval: 'monthly' },
    { tier: 'high', interval: 'annual' },
  ];

  test.each(validCases)(
    'given: tier="%s", interval="%s", should: return the matching price ID',
    ({ tier, interval }) => {
      const actual = getPriceIdForTierAndInterval(tier, interval);
      const expected = pricesByTierAndInterval[`${tier}_${interval}`].id;
      expect(actual).toBe(expected);
    },
  );

  test('given: invalid tier, should: throw an “Invalid tier/interval combination” error', () => {
    // @ts-expect-error: testing runtime error
    expect(() => getPriceIdForTierAndInterval('foo', 'monthly')).toThrow(
      /Invalid tier\/interval combination/,
    );
  });

  test('given: invalid interval, should: throw an “Invalid tier/interval combination” error', () => {
    // @ts-expect-error: testing runtime error
    expect(() => getPriceIdForTierAndInterval('low', 'daily')).toThrow(
      /Invalid tier\/interval combination/,
    );
  });
});

describe('getTierAndIntervalForPriceId()', () => {
  const validCases: [string, Tier, Interval][] = [
    [pricesByTierAndInterval.low_monthly.id, 'low', 'monthly'],
    [pricesByTierAndInterval.low_annual.id, 'low', 'annual'],
    [pricesByTierAndInterval.mid_monthly.id, 'mid', 'monthly'],
    [pricesByTierAndInterval.mid_annual.id, 'mid', 'annual'],
    [pricesByTierAndInterval.high_monthly.id, 'high', 'monthly'],
    [pricesByTierAndInterval.high_annual.id, 'high', 'annual'],
  ];

  test.each(validCases)(
    'given: priceId="%s", should: return { tier: "%s", interval: "%s" }',
    (priceId, tier, interval) => {
      const actual = getTierAndIntervalForPriceId(priceId);
      const expected = { tier, interval };
      expect(actual).toEqual(expected);
    },
  );

  test('given: an unknown priceId, should: throw an “Invalid price ID” error', () => {
    expect(() => getTierAndIntervalForPriceId('not-a-real-id')).toThrow(
      /Invalid price ID/,
    );
  });
});
