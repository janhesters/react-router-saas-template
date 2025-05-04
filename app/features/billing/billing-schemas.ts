import { z } from 'zod';

import {
  OPEN_CHECKOUT_SESSION_INTENT,
  OPEN_CUSTOMER_PORTAL_INTENT,
} from './billing-constants';

export const openCustomerPortalSchema = z.object({
  intent: z.literal(OPEN_CUSTOMER_PORTAL_INTENT),
});

export const openCustomerCheckoutSessionSchema = z.object({
  intent: z.literal(OPEN_CHECKOUT_SESSION_INTENT),
  priceId: z.string(),
});
