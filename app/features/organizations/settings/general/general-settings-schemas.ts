import { z } from "zod";

import {
  DELETE_ORGANIZATION_INTENT,
  UPDATE_ORGANIZATION_INTENT,
} from "./general-settings-constants";

const ONE_MB = 1_000_000;
const MIN_NAME_LENGTH = 3;
const MAX_NAME_LENGTH = 255;

z.config({ jitless: true });

export const deleteOrganizationFormSchema = z.object({
  intent: z.literal(DELETE_ORGANIZATION_INTENT),
});

export const updateOrganizationFormSchema = z.object({
  intent: z.literal(UPDATE_ORGANIZATION_INTENT),
  logo: z
    .file()
    .max(ONE_MB, {
      message: "organizations:settings.general.errors.logoTooLarge",
    })
    .mime(["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"], {
      message: "organizations:settings.general.errors.invalidFileType",
    })
    .optional(),
  name: z
    .string()
    .trim()
    .min(MIN_NAME_LENGTH, {
      message: "organizations:settings.general.errors.nameMin",
    })
    .max(MAX_NAME_LENGTH, {
      message: "organizations:settings.general.errors.nameMax",
    }),
});
