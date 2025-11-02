import { z } from "zod";

import { SWITCH_ORGANIZATION_INTENT } from "./sidebar-layout-constants";

export const switchOrganizationSchema = z.object({
  currentPath: z.string(),
  intent: z.literal(SWITCH_ORGANIZATION_INTENT),
  organizationId: z.string(),
});
