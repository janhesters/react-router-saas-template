export const OPEN_CUSTOMER_PORTAL_INTENT = 'openCustomerPortal';
export const CANCEL_SUBSCRIPTION_INTENT = 'cancelSubscription';

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

export const pricesByLookupKey = {
  hobby_monthly: {
    id: 'price_1RGetVPti3AuUdaNtTABSlP3',
    lookupKey: 'hobby_monthly',
  },
  hobby_annual: {
    id: 'price_1RGetVPti3AuUdaN3GlBQBY6',
    lookupKey: 'hobby_annual',
  },
  startup_monthly: {
    id: 'price_1RGetVPti3AuUdaN4RCP21pJ',
    lookupKey: 'startup_monthly',
  },
  startup_annual: {
    id: 'price_1RGetVPti3AuUdaNzCYSZMi7',
    lookupKey: 'startup_annual',
  },
  business_monthly: {
    id: 'price_1RGetVPti3AuUdaN7MPTxiEe',
    lookupKey: 'business_monthly',
  },
  business_annual: {
    id: 'price_1RGetVPti3AuUdaNTfflLuNP',
    lookupKey: 'business_annual',
  },
} as const;

export type PriceLookupKey = keyof typeof pricesByLookupKey;
