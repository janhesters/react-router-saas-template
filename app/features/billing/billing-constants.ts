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
  hobbyMonthly: {
    id: 'price_1RGetVPti3AuUdaNtTABSlP3',
    lookupKey: 'hobby_monthly',
  },
  hobbyAnnual: {
    id: 'price_1RGetVPti3AuUdaN3GlBQBY6',
    lookupKey: 'hobby_annual',
  },
  startupMonthly: {
    id: 'price_1RGetVPti3AuUdaN4RCP21pJ',
    lookupKey: 'startup_monthly',
  },
  startupAnnual: {
    id: 'price_1RGetVPti3AuUdaNzCYSZMi7',
    lookupKey: 'startup_annual',
  },
  businessMonthly: {
    id: 'price_1RGetVPti3AuUdaN7MPTxiEe',
    lookupKey: 'business_monthly',
  },
  businessAnnual: {
    id: 'price_1RGetVPti3AuUdaNTfflLuNP',
    lookupKey: 'business_annual',
  },
} as const;
