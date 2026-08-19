/** biome-ignore-all lint/style/noNonNullAssertion: Test code */
import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { createPopulatedOrganization } from "../organizations/organizations-factories.server";
import {
  getUserIsOnboarded,
  redirectUserToOnboardingStep,
  throwIfUserIsOnboarded,
  throwIfUserNeedsOnboarding,
} from "./onboarding-helpers.server";
import { OrganizationMembershipRole } from "~/generated/client";
import { createOnboardingUser } from "~/test/test-utils";

describe("getUserIsOnboarded()", () => {
  test("given a user with no memberships and no name: returns false", () => {
    const user = createOnboardingUser({ memberships: [], name: "" });

    const actual = getUserIsOnboarded(user);
    const expected = false;

    expect(actual).toEqual(expected);
  });

  test("given a user with memberships but no name: returns false", () => {
    const user = createOnboardingUser({ name: "" });

    const actual = getUserIsOnboarded(user);
    const expected = false;

    expect(actual).toEqual(expected);
  });

  test("given a user with a name but no memberships: returns false", () => {
    const user = createOnboardingUser({ memberships: [] });

    const actual = getUserIsOnboarded(user);
    const expected = false;

    expect(actual).toEqual(expected);
  });

  test("given a user with both a name and memberships: returns true", () => {
    const user = createOnboardingUser();

    const actual = getUserIsOnboarded(user);
    const expected = true;

    expect(actual).toEqual(expected);
  });
});

describe("throwIfUserIsOnboarded()", () => {
  test("given: a user with no name and no memberships, should: return the user", () => {
    const user = createOnboardingUser({ memberships: [], name: "" });

    const actual = throwIfUserIsOnboarded(user);
    const expected = user;

    expect(actual).toEqual(expected);
  });

  test("given: an onboarded user with exactly one organization, should: redirect to the organization page", () => {
    expect.assertions(2);

    const user = createOnboardingUser({
      memberships: [
        {
          deactivatedAt: null,
          organization: createPopulatedOrganization(),
          role: OrganizationMembershipRole.member,
        },
      ],
      name: "Test User",
    });

    try {
      throwIfUserIsOnboarded(user);
    } catch (error) {
      if (error instanceof Response) {
        expect(error.status).toEqual(302);
        expect(error.headers.get("Location")).toEqual(
          `/organizations/${user.memberships[0]!.organization.slug}`,
        );
      }
    }
  });

  test("given: an onboarded user with multiple organizations, should: redirect to the organizations page", () => {
    expect.assertions(2);

    const user = createOnboardingUser({
      memberships: [
        {
          deactivatedAt: null,
          organization: createPopulatedOrganization(),
          role: OrganizationMembershipRole.member,
        },
        {
          deactivatedAt: null,
          organization: createPopulatedOrganization(),
          role: OrganizationMembershipRole.member,
        },
      ],
      name: "Test User",
    });

    try {
      throwIfUserIsOnboarded(user);
    } catch (error) {
      if (error instanceof Response) {
        expect(error.status).toEqual(302);
        expect(error.headers.get("Location")).toEqual("/organizations");
      }
    }
  });

  test("given: a user with memberships but no name, should: return the user", () => {
    const user = createOnboardingUser({ name: "" });

    const actual = throwIfUserIsOnboarded(user);
    const expected = user;

    expect(actual).toEqual(expected);
  });

  test("given: a user with a name but no memberships, should: return the user", () => {
    const user = createOnboardingUser({
      memberships: [],
      name: "Test User",
    });

    const actual = throwIfUserIsOnboarded(user);
    const expected = user;

    expect(actual).toEqual(expected);
  });
});

describe("redirectUserToOnboardingStep()", () => {
  describe("user account onboarding page", () => {
    test("given: a request to the user account onboarding page and a user has neither a name, nor organizations yet, should: return the user", () => {
      const url = "http://localhost:3000/onboarding/user-account";
      const user = createOnboardingUser({ memberships: [], name: "" });

      const actual = redirectUserToOnboardingStep(new URL(url), user);
      const expected = { user };

      expect(actual).toEqual(expected);
    });

    test.each([
      faker.internet.url(),
      "http://localhost:3000/onboarding/organization",
    ])(
      "given: any other request (to %s) and the user has no name, and is NOT a member of any organizations yet, should: redirect the user to the organization onboarding page",
      (url) => {
        expect.assertions(2);

        const user = createOnboardingUser({ memberships: [], name: "" });

        try {
          redirectUserToOnboardingStep(new URL(url), user);
        } catch (error) {
          if (error instanceof Response) {
            expect(error.status).toEqual(302);
            expect(error.headers.get("Location")).toEqual(
              "/onboarding/user-account",
            );
          }
        }
      },
    );
  });

  describe("organization onboarding page", () => {
    test("given: a request to the organization onboarding page and a user that is NOT a member of any organizations yet, should: return the user", () => {
      const user = createOnboardingUser({ memberships: [] });
      const url = "http://localhost:3000/onboarding/organization";

      const actual = redirectUserToOnboardingStep(new URL(url), user);
      const expected = { user };

      expect(actual).toEqual(expected);
    });

    test.each([
      faker.internet.url(),
      "http://localhost:3000/onboarding/future-step",
    ])(
      "given: any other request (to %s) and a user that is NOT a member of any organizations yet, should: redirect the user to the organization onboarding page",
      (url) => {
        expect.assertions(2);

        const user = createOnboardingUser({ memberships: [] });

        try {
          redirectUserToOnboardingStep(new URL(url), user);
        } catch (error) {
          if (error instanceof Response) {
            expect(error.status).toEqual(302);
            expect(error.headers.get("Location")).toEqual(
              "/onboarding/organization",
            );
          }
        }
      },
    );
  });
});

describe("throwIfUserNeedsOnboarding()", () => {
  test("given: a user with both a name and memberships, should: return the user", () => {
    const user = createOnboardingUser();

    const actual = throwIfUserNeedsOnboarding({ user });
    const expected = { user };

    expect(actual).toEqual(expected);
  });

  test("given: a user with no memberships, should: redirect to the onboarding page", () => {
    expect.assertions(2);

    const user = createOnboardingUser({ memberships: [] });

    try {
      throwIfUserNeedsOnboarding({ user });
    } catch (error) {
      if (error instanceof Response) {
        expect(error.status).toEqual(302);
        expect(error.headers.get("Location")).toEqual("/onboarding");
      }
    }
  });

  test("given: a user with no name, should: redirect to the onboarding page", () => {
    expect.assertions(2);

    const user = createOnboardingUser({ name: "" });

    try {
      throwIfUserNeedsOnboarding({ user });
    } catch (error) {
      if (error instanceof Response) {
        expect(error.status).toEqual(302);
        expect(error.headers.get("Location")).toEqual("/onboarding");
      }
    }
  });
});
