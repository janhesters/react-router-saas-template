import { describe, expect, test } from "vitest";

import { createPopulatedSupabaseUser } from "./user-authentication-factories";
import { getVerifiedUserEmail } from "./verified-email-helpers";

describe("getVerifiedUserEmail()", () => {
  test("given: a user with an email confirmation timestamp, should: return the normalized email", () => {
    const user = createPopulatedSupabaseUser({
      email: " Jane.Doe@Example.com ",
    });

    const actual = getVerifiedUserEmail(user);
    const expected = "jane.doe@example.com";

    expect(actual).toEqual(expected);
  });

  test("given: a user without an email, should: return undefined", () => {
    const user = createPopulatedSupabaseUser();
    delete user.email;

    const actual = getVerifiedUserEmail(user);
    const expected = undefined;

    expect(actual).toEqual(expected);
  });

  test("given: a user with an unconfirmed email, should: return undefined", () => {
    const user = createPopulatedSupabaseUser();
    delete user.email_confirmed_at;

    const actual = getVerifiedUserEmail(user);
    const expected = undefined;

    expect(actual).toEqual(expected);
  });

  test("given: a phone-confirmed user without email confirmation, should: return undefined", () => {
    const user = createPopulatedSupabaseUser({
      phone: "+41791234567",
      phone_confirmed_at: new Date().toISOString(),
    });
    delete user.email_confirmed_at;

    const actual = getVerifiedUserEmail(user);
    const expected = undefined;

    expect(actual).toEqual(expected);
  });

  test("given: a user whose metadata claims the email is verified, should: return undefined", () => {
    const user = createPopulatedSupabaseUser({
      user_metadata: { email_verified: true },
    });
    delete user.email_confirmed_at;

    const actual = getVerifiedUserEmail(user);
    const expected = undefined;

    expect(actual).toEqual(expected);
  });
});
