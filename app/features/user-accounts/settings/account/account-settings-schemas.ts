import { z } from "zod";

import {
  DELETE_USER_ACCOUNT_INTENT,
  UPDATE_USER_ACCOUNT_INTENT,
} from "./account-settings-constants";

const ONE_MB = 1_000_000;
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 128;

z.config({ jitless: true });

export const deleteUserAccountFormSchema = z.object({
  intent: z.literal(DELETE_USER_ACCOUNT_INTENT),
});

export const updateUserAccountFormSchema = z.object({
  avatar: z
    .file()
    .max(ONE_MB, {
      message: "settings:userAccount.errors.avatarTooLarge",
    })
    .mime(["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"], {
      message: "settings:userAccount.errors.invalidFileType",
    })
    .optional(),
  intent: z.literal(UPDATE_USER_ACCOUNT_INTENT),
  name: z
    .string()
    .trim()
    .min(MIN_NAME_LENGTH, {
      message: "settings:userAccount.errors.nameMin",
    })
    .max(MAX_NAME_LENGTH, {
      message: "settings:userAccount.errors.nameMax",
    }),
});
