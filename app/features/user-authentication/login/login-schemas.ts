import type { FieldErrors } from 'react-hook-form';
import { z } from 'zod';

import { LOGIN_INTENTS } from './login-constants';

export const loginWithEmailSchema = z.object({
  intent: z.literal(LOGIN_INTENTS.loginWithEmail),
  email: z
    .email({
      error: 'user-authentication:common.email-invalid',
    })
    .min(1, 'user-authentication:common.email-required'),
});

export const loginWithGoogleSchema = z.object({
  intent: z.literal(LOGIN_INTENTS.loginWithGoogle),
});

export type LoginWithEmailSchema = z.infer<typeof loginWithEmailSchema>;
export type LoginWithGoogleSchema = z.infer<typeof loginWithGoogleSchema>;
export type EmailLoginErrors = FieldErrors<LoginWithEmailSchema>;
