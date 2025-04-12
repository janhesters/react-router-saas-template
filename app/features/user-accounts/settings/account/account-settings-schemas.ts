import { z } from 'zod';

import { UPDATE_USER_ACCOUNT_INTENT } from './account-settings-constants';

export const updateUserAccountFormSchema = z.object({
  intent: z.literal(UPDATE_USER_ACCOUNT_INTENT),
  name: z
    .string({
      invalid_type_error: 'settings:user-account.form.name-must-be-string',
    })
    .trim()
    .min(2, 'settings:user-account.form.name-min-length')
    .max(128, 'settings:user-account.form.name-max-length'),
  email: z.string().email().optional(),
  avatar: z
    .instanceof(File, {
      message: 'settings:user-account.form.avatar-must-be-file',
    })
    .optional(),
});

export type UpdateUserAccountFormSchema = z.infer<
  typeof updateUserAccountFormSchema
>;
