/** biome-ignore-all lint/style/noNonNullAssertion: Test code */
import { OrganizationMembershipRole } from "@prisma/client";
import { describe, expect, test } from "vitest";

import { createPopulatedOrganization } from "./organizations-factories.server";
import {
  findOrganizationIfUserIsMemberById,
  findOrganizationIfUserIsMemberBySlug,
} from "./organizations-helpers.server";
import { createOnboardingUser } from "~/test/test-utils";
import { notFound } from "~/utils/http-responses.server";

describe("findOrganizationIfUserIsMemberBySlug()", () => {
  test("given: a user who is a member of the organization, should: return the organization and role", () => {
    const organization = createPopulatedOrganization();
    const user = createOnboardingUser({
      memberships: [
        {
          deactivatedAt: null,
          organization,
          role: OrganizationMembershipRole.member,
        },
      ],
    });

    const actual = findOrganizationIfUserIsMemberBySlug(
      user,
      organization.slug,
    );
    const expected = {
      organization: user.memberships[0]!.organization,
      role: OrganizationMembershipRole.member,
    };

    expect(actual).toEqual(expected);
  });

  test("given: a user who is an admin of the organization, should: return the organization and admin role", () => {
    const organization = createPopulatedOrganization();
    const user = createOnboardingUser({
      memberships: [
        {
          deactivatedAt: null,
          organization,
          role: OrganizationMembershipRole.admin,
        },
      ],
    });

    const actual = findOrganizationIfUserIsMemberBySlug(
      user,
      organization.slug,
    );
    const expected = {
      organization: user.memberships[0]!.organization,
      role: OrganizationMembershipRole.admin,
    };

    expect(actual).toEqual(expected);
  });

  test("given: a user who is not a member of the organization, should: throw a 404", () => {
    expect.assertions(1);

    const user = createOnboardingUser({
      memberships: [
        {
          deactivatedAt: null,
          organization: createPopulatedOrganization(),
          role: OrganizationMembershipRole.member,
        },
      ],
    });
    const nonExistentSlug = createPopulatedOrganization().slug;

    try {
      findOrganizationIfUserIsMemberBySlug(user, nonExistentSlug);
    } catch (error) {
      expect(error).toEqual(notFound());
    }
  });

  test("given: a user with no memberships, should: throw a 404", () => {
    expect.assertions(1);

    const user = createOnboardingUser({ memberships: [] });
    const organizationSlug = createPopulatedOrganization().slug;

    try {
      findOrganizationIfUserIsMemberBySlug(user, organizationSlug);
    } catch (error) {
      expect(error).toEqual(notFound());
    }
  });
});

describe("findOrganizationIfUserIsMemberById()", () => {
  test("given: a user who is a member of the organization, should: return the organization and role", () => {
    const organization = createPopulatedOrganization();
    const user = createOnboardingUser({
      memberships: [
        {
          deactivatedAt: null,
          organization,
          role: OrganizationMembershipRole.member,
        },
      ],
    });

    const actual = findOrganizationIfUserIsMemberById(user, organization.id);
    const expected = {
      organization: user.memberships[0]!.organization,
      role: OrganizationMembershipRole.member,
    };

    expect(actual).toEqual(expected);
  });

  test("given: a user who is an admin of the organization, should: return the organization and admin role", () => {
    const organization = createPopulatedOrganization();
    const user = createOnboardingUser({
      memberships: [
        {
          deactivatedAt: null,
          organization,
          role: OrganizationMembershipRole.admin,
        },
      ],
    });

    const actual = findOrganizationIfUserIsMemberById(user, organization.id);
    const expected = {
      organization: user.memberships[0]!.organization,
      role: OrganizationMembershipRole.admin,
    };

    expect(actual).toEqual(expected);
  });

  test("given: a user who is not a member of the organization, should: throw a 404", () => {
    expect.assertions(1);

    const user = createOnboardingUser({
      memberships: [
        {
          deactivatedAt: null,
          organization: createPopulatedOrganization(),
          role: OrganizationMembershipRole.member,
        },
      ],
    });
    const nonExistentId = createPopulatedOrganization().id;

    try {
      findOrganizationIfUserIsMemberById(user, nonExistentId);
    } catch (error) {
      expect(error).toEqual(notFound());
    }
  });

  test("given: a user with no memberships, should: throw a 404", () => {
    expect.assertions(1);

    const user = createOnboardingUser({ memberships: [] });
    const organizationId = createPopulatedOrganization().id;

    try {
      findOrganizationIfUserIsMemberById(user, organizationId);
    } catch (error) {
      expect(error).toEqual(notFound());
    }
  });
});
