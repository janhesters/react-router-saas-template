export const CANCEL_SUBSCRIPTION_INTENT = 'cancelSubscription';
export const OPEN_CHECKOUT_SESSION_INTENT = 'openCheckoutSession';
export const RESUME_SUBSCRIPTION_INTENT = 'resumeSubscription';
export const SWITCH_SUBSCRIPTION_INTENT = 'switchSubscription';
export const UPDATE_BILLING_EMAIL_INTENT = 'updateBillingEmail';
export const VIEW_INVOICES_INTENT = 'viewInvoices';

/**
 * Hardcoded price IDs for Stripe products.
 *
 * IMPORTANT:
 * - These IDs must match exactly what's configured in Stripe.
 * - If you change a price in Stripe (e.g., create a new one), update the ID
 * here manually.
 * - Consider loading these dynamically from Stripe in the future if price plans
 * change often.
 *
 * ENVIRONMENT NOTE:
 * - If you have separate Stripe environments (dev, staging, prod),
 *   ensure you set the correct IDs for each environment.
 */
export const pricesByTierAndInterval = {
  low_monthly: {
    id: 'price_1RJetbPti3AuUdaNOPzymzNN',
    lookupKey: 'hobby_monthly_new',
  },
  low_annual: {
    id: 'price_1RJevnPti3AuUdaNPCCAIEYE',
    lookupKey: 'hobby_monthly_new_two',
  },
  mid_monthly: {
    id: 'price_1RGetVPti3AuUdaN4RCP21pJ',
    lookupKey: 'startup_monthly',
  },
  mid_annual: {
    id: 'price_1RGetVPti3AuUdaNzCYSZMi7',
    lookupKey: 'startup_annual',
  },
  high_monthly: {
    id: 'price_1RKJ8SPti3AuUdaNYJwZeeyX',
    lookupKey: 'business_monthly_new',
  },
  high_annual: {
    id: 'price_1RKJ8SPti3AuUdaNWQziByvX',
    lookupKey: 'business_annual_new',
  },
} as const;

type PriceKey = keyof typeof pricesByTierAndInterval;
export type PriceLookupKey =
  (typeof pricesByTierAndInterval)[PriceKey]['lookupKey'];
export type Tier = PriceKey extends `${infer T}_${string}` ? T : never;
export type Interval = PriceKey extends `${string}_${infer I}` ? I : never;

export const lookupKeys: readonly PriceLookupKey[] = Object.values(
  pricesByTierAndInterval,
).map(({ lookupKey }) => lookupKey);
