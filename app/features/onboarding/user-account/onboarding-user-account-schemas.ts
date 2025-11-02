import type { FieldErrors } from "react-hook-form";
import { z } from "zod";

import { ONBOARDING_USER_ACCOUNT_INTENT } from "./onboarding-user-account-constants";

export const onboardingUserAccountSchema = z.object({
  avatar: z
    .string()
    .url("onboarding:user-account.avatar-must-be-url")
    .optional(),
  intent: z.literal(ONBOARDING_USER_ACCOUNT_INTENT),
  name: z
    .string({
      error: "onboarding:user-account.name-required",
    })
    .trim()
    .min(2, "onboarding:user-account.name-min-length")
    .max(128, "onboarding:user-account.name-max-length"),
});

export type OnboardingUserAccountSchema = z.infer<
  typeof onboardingUserAccountSchema
>;
export type OnboardingUserAccountErrors =
  FieldErrors<OnboardingUserAccountSchema>;
