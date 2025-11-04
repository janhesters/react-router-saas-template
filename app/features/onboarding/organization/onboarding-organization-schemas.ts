import { z } from "zod";

import { ONBOARDING_ORGANIZATION_INTENT } from "./onboarding-organization-consants";

const MIN_NAME_LENGTH = 3;
const MAX_NAME_LENGTH = 255;
const ONE_MB = 1_000_000;

z.config({ jitless: true });

export const onboardingOrganizationSchema = z.object({
  intent: z.literal(ONBOARDING_ORGANIZATION_INTENT),
  logo: z
    .file()
    .max(ONE_MB, { message: "onboarding:organization.errors.logoTooLarge" })
    .mime(["image/png", "image/jpeg", "image/gif", "image/webp"], {
      message: "onboarding:organization.errors.invalidFileType",
    })
    .optional(),
  name: z
    .string()
    .trim()
    .min(MIN_NAME_LENGTH, {
      message: "onboarding:organization.errors.nameMin",
    })
    .max(MAX_NAME_LENGTH, {
      message: "onboarding:organization.errors.nameMax",
    }),
});
