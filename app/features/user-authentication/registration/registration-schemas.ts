import * as z from "zod";

import { registerIntents } from "./registration-constants";

z.config({ jitless: true });

export const registerWithEmailSchema = z.object({
  email: z.email({
    message: "userAuthentication:register.errors.invalidEmail",
  }),
  intent: z.literal(registerIntents.registerWithEmail),
});

export const registerWithGoogleSchema = z.object({
  intent: z.literal(registerIntents.registerWithGoogle),
});
