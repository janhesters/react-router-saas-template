import { faker } from "@faker-js/faker";
import { afterEach, describe, expect, test, vi } from "vitest";

import { priceLookupKeysByTierAndInterval } from "./billing-constants";
import {
  createPopulatedStripePrice,
  createPopulatedStripePriceWithProduct,
  createPopulatedStripeSubscriptionWithItemsAndPrice,
  createStripeProductWithPrices,
} from "./billing-factories.server";
import { createStripePriceFactory } from "./stripe-factories.server";

afterEach(() => {
  vi.restoreAllMocks();
});

describe.each([
  ["createPopulatedStripePrice()", createPopulatedStripePrice],
  [
    "createPopulatedStripePriceWithProduct()",
    createPopulatedStripePriceWithProduct,
  ],
])("%s", (_name, createPrice) => {
  test("given: repeated Faker words, should: generate distinct price lookup keys", () => {
    vi.spyOn(faker.word, "noun").mockReturnValue("repeat");

    const prices = Array.from({ length: 20 }, () => createPrice());

    expect(new Set(prices.map(({ lookupKey }) => lookupKey)).size).toBe(20);
  });

  test("given: an explicit seeded lookup key, should: preserve the override", () => {
    const lookupKey = priceLookupKeysByTierAndInterval.high.annual;

    expect(createPrice({ lookupKey }).lookupKey).toBe(lookupKey);
    expect(createPrice({ lookupKey }).lookupKey).toBe(lookupKey);
  });
});

describe("compound Stripe factories", () => {
  test("given: repeated Faker words, should: generate distinct lookup keys for all nested prices", () => {
    vi.spyOn(faker.word, "noun").mockReturnValue("repeat");

    const prices = Array.from({ length: 20 }, () => [
      ...createStripeProductWithPrices().prices,
      ...createPopulatedStripeSubscriptionWithItemsAndPrice().items.map(
        ({ price }) => price,
      ),
      ...createPopulatedStripeSubscriptionWithItemsAndPrice({
        items: [{}],
      }).items.map(({ price }) => price),
    ]).flat();

    expect(new Set(prices.map(({ lookupKey }) => lookupKey)).size).toBe(
      prices.length,
    );
  });

  test("given: explicit nested lookup keys, should: preserve collision and seeded-price overrides", () => {
    const lookupKey = priceLookupKeysByTierAndInterval.high.annual;
    const product = createStripeProductWithPrices({
      prices: [{ lookupKey }, { lookupKey }],
    });
    const subscription = createPopulatedStripeSubscriptionWithItemsAndPrice({
      items: [{ price: { lookupKey } }, { price: { lookupKey } }],
    });

    expect(product.prices.map((price) => price.lookupKey)).toEqual([
      lookupKey,
      lookupKey,
    ]);
    expect(subscription.items.map(({ price }) => price.lookupKey)).toEqual([
      lookupKey,
      lookupKey,
    ]);
  });
});

describe("createStripePriceFactory()", () => {
  test("given: repeated Faker words, should: generate distinct Stripe API price lookup keys", () => {
    vi.spyOn(faker.word, "noun").mockReturnValue("repeat");

    const prices = Array.from({ length: 20 }, () => createStripePriceFactory());

    expect(new Set(prices.map(({ lookup_key }) => lookup_key)).size).toBe(20);
  });

  test("given: an explicit lookup key, should: preserve the override", () => {
    const lookup_key = priceLookupKeysByTierAndInterval.high.annual;

    expect(createStripePriceFactory({ lookup_key }).lookup_key).toBe(
      lookup_key,
    );
    expect(createStripePriceFactory({ lookup_key }).lookup_key).toBe(
      lookup_key,
    );
  });
});
