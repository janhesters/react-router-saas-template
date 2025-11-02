import { z } from "zod";

import {
  AVATAR_MAX_FILE_SIZE,
  UPDATE_USER_ACCOUNT_INTENT,
} from "./account-settings-constants";

export const updateUserAccountFormSchema = z.object({
  avatar: z
    .instanceof(File, {
      message: "settings:user-account.form.avatar-must-be-file",
    })
    .refine(
      (file) => file.size <= AVATAR_MAX_FILE_SIZE,
      "settings:user-account.form.avatar-max-file-size",
    )
    .optional(),
  email: z.email().optional(),
  intent: z.literal(UPDATE_USER_ACCOUNT_INTENT),
  name: z
    .string({
      error: "settings:user-account.form.name-required",
    })
    .trim()
    .min(2, "settings:user-account.form.name-min-length")
    .max(128, "settings:user-account.form.name-max-length"),
});

export type UpdateUserAccountFormSchema = z.infer<
  typeof updateUserAccountFormSchema
>;
