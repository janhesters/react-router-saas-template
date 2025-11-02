import { z } from "zod";

import {
  DELETE_ORGANIZATION_INTENT,
  UPDATE_ORGANIZATION_INTENT,
} from "./general-settings-constants";

export const deleteOrganizationFormSchema = z.object({
  intent: z.literal(DELETE_ORGANIZATION_INTENT),
});

export const updateOrganizationFormSchema = z.object({
  intent: z.literal(UPDATE_ORGANIZATION_INTENT),
  logo: z
    .string()
    .url("organizations:settings.general.form.logo-must-be-url")
    .optional(),
  name: z
    .string({
      error: "organizations:settings.general.form.name-required",
    })
    .trim()
    .min(3, "organizations:settings.general.form.name-min-length")
    .max(255, "organizations:settings.general.form.name-max-length"),
});

export type UpdateOrganizationFormSchema = z.infer<
  typeof updateOrganizationFormSchema
>;
