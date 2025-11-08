import { z } from "zod";

import { CREATE_ORGANIZATION_INTENT } from "./create-organization-constants";

const MIN_NAME_LENGTH = 3;
const MAX_NAME_LENGTH = 255;
const ONE_MB = 1_000_000;

z.config({ jitless: true });

export const createOrganizationFormSchema = z.object({
  intent: z.literal(CREATE_ORGANIZATION_INTENT),
  logo: z
    .file()
    .max(ONE_MB, { message: "organizations:new.form.logoTooLarge" })
    .mime(["image/png", "image/jpeg", "image/gif", "image/webp"], {
      message: "organizations:new.form.logoInvalidType",
    })
    .optional(),
  name: z
    .string({
      message: "organizations:new.form.nameMinLength",
    })
    .trim()
    .min(MIN_NAME_LENGTH, {
      message: "organizations:new.form.nameMinLength",
    })
    .max(MAX_NAME_LENGTH, {
      message: "organizations:new.form.nameMaxLength",
    }),
});

export type CreateOrganizationFormSchema = z.infer<
  typeof createOrganizationFormSchema
>;
