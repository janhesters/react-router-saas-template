import { z } from "zod";

import { ONBOARDING_USER_ACCOUNT_INTENT } from "./onboarding-user-account-constants";

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 128;
const ONE_MB = 1_000_000;

z.config({ jitless: true });

export const onboardingUserAccountSchema = z.object({
  image: z
    .file()
    .max(ONE_MB, { message: "onboarding:userAccount.errors.photoTooLarge" })
    .mime(["image/png", "image/jpeg", "image/gif", "image/webp"], {
      message: "onboarding:userAccount.errors.invalidFileType",
    })
    .optional(),
  intent: z.literal(ONBOARDING_USER_ACCOUNT_INTENT),
  name: z
    .string()
    .trim()
    .min(MIN_NAME_LENGTH, {
      message: "onboarding:userAccount.errors.nameMin",
    })
    .max(MAX_NAME_LENGTH, {
      message: "onboarding:userAccount.errors.nameMax",
    }),
});
