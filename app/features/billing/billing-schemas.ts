import { z } from 'zod';

import { OPEN_CUSTOMER_PORTAL_INTENT } from './billing-constants';

export const openCustomerPortalSchema = z.object({
  intent: z.literal(OPEN_CUSTOMER_PORTAL_INTENT),
});
