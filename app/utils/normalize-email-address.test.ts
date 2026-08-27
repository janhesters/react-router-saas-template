import { describe, expect, test } from "vitest";

import {
  emailAddressesMatch,
  normalizeEmailAddress,
} from "./normalize-email-address";

describe("normalizeEmailAddress()", () => {
  test("given: an email with whitespace and mixed casing, should: trim and lowercase it", () => {
    const actual = normalizeEmailAddress(" Jane.Doe@Example.COM ");
    const expected = "jane.doe@example.com";

    expect(actual).toEqual(expected);
  });

  test("given: an email with a plus alias, should: preserve the alias", () => {
    const actual = normalizeEmailAddress("jane+invites@example.com");
    const expected = "jane+invites@example.com";

    expect(actual).toEqual(expected);
  });

  test("given: an email with dots in the local part, should: preserve the dots", () => {
    const actual = normalizeEmailAddress("j.a.n.e@gmail.com");
    const expected = "j.a.n.e@gmail.com";

    expect(actual).toEqual(expected);
  });
});

describe("emailAddressesMatch()", () => {
  test("given: addresses that only differ in casing and whitespace, should: return true", () => {
    const actual = emailAddressesMatch(
      " Jane.Doe@Example.com ",
      "jane.doe@example.com",
    );
    const expected = true;

    expect(actual).toEqual(expected);
  });

  test("given: different addresses, should: return false", () => {
    const actual = emailAddressesMatch(
      "jane.doe@example.com",
      "john.doe@example.com",
    );
    const expected = false;

    expect(actual).toEqual(expected);
  });

  test("given: addresses that differ by a plus alias, should: return false", () => {
    const actual = emailAddressesMatch(
      "jane+invites@example.com",
      "jane@example.com",
    );
    const expected = false;

    expect(actual).toEqual(expected);
  });
});
