import { z } from "zod";

import { CREATE_ORGANIZATION_INTENT } from "./create-organization-constants";

export const createOrganizationFormSchema = z.object({
  intent: z.literal(CREATE_ORGANIZATION_INTENT),
  logo: z
    .string({
      error: "organizations:new.form.logo-invalid",
    })
    .url("organizations:new.form.logo-must-be-url")
    .optional(),
  name: z
    .string({
      error: "organizations:new.form.name-required",
    })
    .trim()
    .min(3, "organizations:new.form.name-min-length")
    .max(255, "organizations:new.form.name-max-length"),
  organizationId: z.string().optional(),
});

export type CreateOrganizationFormSchema = z.infer<
  typeof createOrganizationFormSchema
>;
