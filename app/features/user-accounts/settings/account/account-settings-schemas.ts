import { z } from 'zod';

import {
  AVATAR_MAX_FILE_SIZE,
  UPDATE_USER_ACCOUNT_INTENT,
} from './account-settings-constants';

export const updateUserAccountFormSchema = z.object({
  intent: z.literal(UPDATE_USER_ACCOUNT_INTENT),
  name: z
    .string({
      invalid_type_error:
        'user-accounts:settings.user-account.form.name-must-be-string',
    })
    .trim()
    .min(2, 'user-accounts:settings.user-account.form.name-min-length')
    .max(128, 'user-accounts:settings.user-account.form.name-max-length'),
  email: z.string().email().optional(),
  avatar: z
    .instanceof(File, {
      message: 'user-accounts:settings.user-account.form.avatar-must-be-file',
    })
    .refine(
      file => file.size <= AVATAR_MAX_FILE_SIZE,
      'user-accounts:settings.user-account.form.avatar-max-file-size',
    )
    .optional(),
});

export type UpdateUserAccountFormSchema = z.infer<
  typeof updateUserAccountFormSchema
>;
