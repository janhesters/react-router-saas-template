import { describe, expect, test } from "vitest";

import { serverEnvSchema } from "./env.server";

const validEnvironment = {
  APP_URL: "https://app.example.com",
  COOKIE_SECRET: "cookie-secret-with-at-least-32-characters",
  DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/postgres",
  HONEYPOT_SECRET: "honeypot-secret-with-at-least-32-characters",
  NODE_ENV: "test",
  STORAGE_ACCESS_KEY_ID: "storage-access-key",
  STORAGE_ENDPOINT: "https://project.storage.example.com",
  STORAGE_REGION: "eu-west-1",
  STORAGE_SECRET_ACCESS_KEY: "storage-secret-key",
  STRIPE_SECRET_KEY: "stripe-secret-key",
  STRIPE_WEBHOOK_SECRET: "stripe-webhook-secret",
  SUPABASE_SECRET_KEY: "sb_secret_test",
  VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  VITE_SUPABASE_URL: "https://project.supabase.co",
} as const;

describe("server environment", () => {
  test.each(["EMAIL_MOCKS", "MOCKS"] as const)(
    "given: production enables %s, should: reject the environment",
    (mockFlag) => {
      const actual = serverEnvSchema.safeParse({
        ...validEnvironment,
        [mockFlag]: "true",
        NODE_ENV: "production",
      }).success;
      const expected = false;

      expect(actual).toEqual(expected);
    },
  );

  test.each(["development", "test"] as const)(
    "given: email mocks are enabled in %s, should: accept the environment",
    (nodeEnvironment) => {
      const actual = serverEnvSchema.safeParse({
        ...validEnvironment,
        EMAIL_MOCKS: "true",
        NODE_ENV: nodeEnvironment,
      }).success;
      const expected = true;

      expect(actual).toEqual(expected);
    },
  );
});
