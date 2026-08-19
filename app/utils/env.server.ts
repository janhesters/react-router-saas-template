import { z } from "zod";

const hasNoSurroundingWhitespace = (value: string) => value === value.trim();
const nonEmptyString = z
  .string()
  .min(1)
  .refine(hasNoSurroundingWhitespace, "Remove surrounding whitespace.");
const optionalNonEmptyString = nonEmptyString.optional();
const secret = z
  .string()
  .min(32)
  .refine(hasNoSurroundingWhitespace, "Remove surrounding whitespace.");

const schema = z.object({
  ALLOW_INDEXING: z.enum(["true", "false"]).optional(),
  APP_URL: z.url(),
  COOKIE_SECRET: secret,
  DATABASE_URL: nonEmptyString,
  HONEYPOT_SECRET: secret,
  MOCKS: z.literal("true").optional(),
  NODE_ENV: z.enum(["production", "development", "test"] as const),
  RESEND_API_KEY: optionalNonEmptyString,
  RESEND_FROM_EMAIL: optionalNonEmptyString,
  STORAGE_ACCESS_KEY_ID: nonEmptyString,
  STORAGE_ENDPOINT: z.url(),
  STORAGE_REGION: nonEmptyString,
  STORAGE_SECRET_ACCESS_KEY: nonEmptyString,
  STRIPE_SECRET_KEY: nonEmptyString,
  STRIPE_WEBHOOK_SECRET: nonEmptyString,
  SUPABASE_SECRET_KEY: z
    .string()
    .startsWith("sb_secret_")
    .refine(hasNoSurroundingWhitespace, "Remove surrounding whitespace."),
  TEST_DATABASE_URL: optionalNonEmptyString,
  VITE_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .startsWith("sb_publishable_")
    .refine(hasNoSurroundingWhitespace, "Remove surrounding whitespace."),
  VITE_SUPABASE_URL: z.url(),
});

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof schema> {}
  }
}

export function init() {
  const parsed = schema.safeParse(process.env);

  if (parsed.success === false) {
    console.error(
      "❌ Invalid environment variables:",
      z.flattenError(parsed.error).fieldErrors,
    );

    throw new Error("Invalid environment variables");
  }
}

/**
 * This is used in both `entry.server.ts` and `root.tsx` to ensure that
 * the environment variables are set and globally available before the app is
 * started.
 *
 * NOTE: Do *not* add any environment variables in here that you do not wish to
 * be included in the client.
 * @returns all public ENV variables
 */
export function getEnv() {
  return {
    ALLOW_INDEXING: process.env.ALLOW_INDEXING,
    MODE: process.env.NODE_ENV,
    VITE_SUPABASE_PUBLISHABLE_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  };
}

type Env = ReturnType<typeof getEnv>;

declare global {
  var ENV: Env;
  interface Window {
    ENV: Env;
  }
}
