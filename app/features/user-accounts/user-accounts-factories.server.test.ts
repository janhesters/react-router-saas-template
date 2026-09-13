import { faker } from "@faker-js/faker";
import { afterEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { createPopulatedUserAccount } from "./user-accounts-factories.server";
import { createPopulatedSupabaseUser } from "~/features/user-authentication/user-authentication-factories";

afterEach(() => {
  vi.restoreAllMocks();
});

describe.each([
  ["createPopulatedUserAccount()", createPopulatedUserAccount],
  ["createPopulatedSupabaseUser()", createPopulatedSupabaseUser],
])("%s", (_name, createUser) => {
  test("given: repeated Faker email values, should: generate distinct valid email addresses", () => {
    vi.spyOn(faker.internet, "email").mockReturnValue("repeat@example.com");

    const users = Array.from({ length: 20 }, () => createUser());

    expect(new Set(users.map(({ email }) => email)).size).toBe(20);
    for (const user of users) {
      expect(z.email().safeParse(user.email).success).toBe(true);
    }
  });

  test("given: an explicit colliding email address, should: preserve the override", () => {
    const email = "existing@example.com";

    expect(createUser({ email }).email).toBe(email);
    expect(createUser({ email }).email).toBe(email);
  });
});
