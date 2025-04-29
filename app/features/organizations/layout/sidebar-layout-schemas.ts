import { z } from 'zod';

import { OPEN_CHECKOUT_SESSION_INTENT } from '~/features/billing/billing-constants';

import { SWITCH_ORGANIZATION_INTENT } from './sidebar-layout-constants';

export const switchOrganizationSchema = z.object({
  intent: z.literal(SWITCH_ORGANIZATION_INTENT),
  currentPath: z.string(),
  organizationId: z.string(),
});

export const openCustomerCheckoutSessionSchema = z.object({
  intent: z.literal(OPEN_CHECKOUT_SESSION_INTENT),
  priceId: z.string(),
});
