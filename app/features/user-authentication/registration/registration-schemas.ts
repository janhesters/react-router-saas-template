import type { FieldErrors } from 'react-hook-form';
import { z } from 'zod';

import { registerIntents } from './registration-constants';

export const registerWithEmailSchema = z.object({
  intent: z.literal(registerIntents.registerWithEmail),
  email: z
    .email({
      error: 'user-authentication:common.email-invalid',
    })
    .min(1, 'user-authentication:common.email-required'),
});

export type RegisterWithEmailSchema = z.infer<typeof registerWithEmailSchema>;
export type EmailRegistrationErrors = FieldErrors<RegisterWithEmailSchema>;

export const registerWithGoogleSchema = z.object({
  intent: z.literal(registerIntents.registerWithGoogle),
});

export type RegisterWithGoogleSchema = z.infer<typeof registerWithGoogleSchema>;
