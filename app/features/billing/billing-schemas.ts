import { z } from 'zod';

import { OPEN_CUSTOMER_PORTAL_INTENT } from './billing-constanst';

export const openCustomerPortalSchema = z.object({
  intent: z.literal(OPEN_CUSTOMER_PORTAL_INTENT),
});
