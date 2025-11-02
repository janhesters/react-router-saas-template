import type { FieldErrors } from "react-hook-form";
import { z } from "zod";

import { ONBOARDING_ORGANIZATION_INTENT } from "./onboarding-organization-consants";

export const onboardingOrganizationSchema = z.object({
  intent: z.literal(ONBOARDING_ORGANIZATION_INTENT),
  logo: z
    .string({
      error: "onboarding:organization.logo-invalid",
    })
    .url("onboarding:organization.logo-must-be-url")
    .optional(),
  name: z
    .string({
      error: "onboarding:organization.name-required",
    })
    .trim()
    .min(3, "onboarding:organization.name-min-length")
    .max(255, "onboarding:organization.name-max-length"),
  organizationId: z.string().optional(),
});

export type OnboardingOrganizationSchema = z.infer<
  typeof onboardingOrganizationSchema
>;
export type OnboardingOrganizationErrors =
  FieldErrors<OnboardingOrganizationSchema>;
