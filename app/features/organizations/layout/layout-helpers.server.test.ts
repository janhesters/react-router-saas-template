import { OrganizationMembershipRole } from "@prisma/client";
import { href } from "react-router";
import { describe, expect, test } from "vitest";

import { createPopulatedOrganization } from "../organizations-factories.server";
import {
  getSidebarState,
  mapOnboardingUserToBillingSidebarCardProps,
  mapOnboardingUserToOrganizationLayoutProps,
  switchSlugInRoute,
} from "./layout-helpers.server";
import { priceLookupKeysByTierAndInterval } from "~/features/billing/billing-constants";
import {
  createPopulatedStripeSubscriptionItemWithPriceAndProduct,
  createPopulatedStripeSubscriptionWithScheduleAndItemsWithPriceAndProduct,
} from "~/features/billing/billing-factories.server";
import { createOnboardingUser } from "~/test/test-utils";

describe("getSidebarState", () => {
  test('given: request with sidebar_state cookie set to "true", should: return true', () => {
    const request = new Request("http://localhost", {
      headers: {
        cookie: "sidebar_state=true",
      },
    });

    const actual = getSidebarState(request);
    const expected = true;

    expect(actual).toEqual(expected);
  });

  test('given: request with sidebar_state cookie set to "false", should: return false', () => {
    const request = new Request("http://localhost", {
      headers: {
        cookie: "sidebar_state=false",
      },
    });

    const actual = getSidebarState(request);
    const expected = false;

    expect(actual).toEqual(expected);
  });

  test("given: request with no sidebar_state cookie, should: return true", () => {
    const request = new Request("http://localhost");

    const actual = getSidebarState(request);
    const expected = true;

    expect(actual).toEqual(expected);
  });

  test("given: request with invalid sidebar_state cookie value, should: return false", () => {
    const request = new Request("http://localhost", {
      headers: {
        cookie: "sidebar_state=invalid",
      },
    });

    const actual = getSidebarState(request);
    const expected = false;

    expect(actual).toEqual(expected);
  });
});

describe("mapOnboardingUserToOrganizationLayoutProps()", () => {
  test("given: onboarding user with organizations where the current organization has no subscription, should: map to organization layout props", () => {
    const user = createOnboardingUser({
      email: "john@example.com",
      imageUrl: "https://example.com/avatar.jpg",
      memberships: [
        {
          deactivatedAt: null,
          organization: {
            id: "org1",
            imageUrl: "https://example.com/org1.jpg",
            name: "Organization 1",
            slug: "org-1",
            stripeSubscriptions: [],
          },
          role: "member",
        },
        {
          deactivatedAt: null,
          organization: {
            id: "org2",
            imageUrl: "https://example.com/org2.jpg",
            name: "Organization 2",
            slug: "org-2",
            stripeSubscriptions: [
              createPopulatedStripeSubscriptionWithScheduleAndItemsWithPriceAndProduct(
                {
                  items: [
                    createPopulatedStripeSubscriptionItemWithPriceAndProduct({
                      price: {
                        lookupKey: priceLookupKeysByTierAndInterval.low.annual,
                      },
                    }),
                  ],
                },
              ),
            ],
          },
          role: "member",
        },
      ],
      name: "John Doe",
    });

    const organizationSlug = "org-1";

    const actual = mapOnboardingUserToOrganizationLayoutProps({
      organizationSlug,
      user,
    });
    const expected = {
      navUserProps: {
        user: {
          avatar: "https://example.com/avatar.jpg",
          email: "john@example.com",
          name: "John Doe",
        },
      },
      organizationSwitcherProps: {
        currentOrganization: {
          id: "org1",
          logo: "https://example.com/org1.jpg",
          name: "Organization 1",
          slug: "org-1",
          tier: "high",
        },
        organizations: [
          {
            id: "org1",
            logo: "https://example.com/org1.jpg",
            name: "Organization 1",
            slug: "org-1",
            tier: "high",
          },
          {
            id: "org2",
            logo: "https://example.com/org2.jpg",
            name: "Organization 2",
            slug: "org-2",
            tier: "low",
          },
        ],
      },
    };

    expect(actual).toEqual(expected);
  });

  test("given: onboarding user with organizations where the current organization has a subscription, should: map to organization layout props", () => {
    const user = createOnboardingUser({
      email: "john@example.com",
      imageUrl: "https://example.com/avatar.jpg",
      memberships: [
        {
          deactivatedAt: null,
          organization: {
            id: "org1",
            imageUrl: "https://example.com/org1.jpg",
            name: "Organization 1",
            slug: "org-1",
            stripeSubscriptions: [
              createPopulatedStripeSubscriptionWithScheduleAndItemsWithPriceAndProduct(
                {
                  items: [
                    createPopulatedStripeSubscriptionItemWithPriceAndProduct({
                      price: {
                        lookupKey:
                          priceLookupKeysByTierAndInterval.high.monthly,
                      },
                    }),
                  ],
                },
              ),
            ],
          },
          role: "member",
        },
        {
          deactivatedAt: null,
          organization: {
            id: "org2",
            imageUrl: "https://example.com/org2.jpg",
            name: "Organization 2",
            slug: "org-2",
            stripeSubscriptions: [
              createPopulatedStripeSubscriptionWithScheduleAndItemsWithPriceAndProduct(
                {
                  items: [
                    createPopulatedStripeSubscriptionItemWithPriceAndProduct({
                      price: {
                        lookupKey: priceLookupKeysByTierAndInterval.low.monthly,
                      },
                    }),
                  ],
                },
              ),
            ],
          },
          role: "member",
        },
      ],
      name: "John Doe",
    });
    const organizationSlug = "org-2";

    const actual = mapOnboardingUserToOrganizationLayoutProps({
      organizationSlug,
      user,
    });
    const expected = {
      navUserProps: {
        user: {
          avatar: "https://example.com/avatar.jpg",
          email: "john@example.com",
          name: "John Doe",
        },
      },
      organizationSwitcherProps: {
        currentOrganization: {
          id: "org2",
          logo: "https://example.com/org2.jpg",
          name: "Organization 2",
          slug: "org-2",
          tier: "low",
        },
        organizations: [
          {
            id: "org1",
            logo: "https://example.com/org1.jpg",
            name: "Organization 1",
            slug: "org-1",
            tier: "high",
          },
          {
            id: "org2",
            logo: "https://example.com/org2.jpg",
            name: "Organization 2",
            slug: "org-2",
            tier: "low",
          },
        ],
      },
    };

    expect(actual).toEqual(expected);
  });

  test("given: onboarding user with no organizations, should: return empty organizations array", () => {
    const user = createOnboardingUser({
      email: "john@example.com",
      imageUrl: "https://example.com/avatar.jpg",
      memberships: [],
      name: "John Doe",
    });

    const actual = mapOnboardingUserToOrganizationLayoutProps({
      organizationSlug: "org-1",
      user,
    });
    const expected = {
      navUserProps: {
        user: {
          avatar: "https://example.com/avatar.jpg",
          email: "john@example.com",
          name: "John Doe",
        },
      },
      organizationSwitcherProps: {
        currentOrganization: undefined,
        organizations: [],
      },
    };

    expect(actual).toEqual(expected);
  });
});

describe("mapOnboardingUserToBillingSidebarCardProps()", () => {
  test("given: a user without a membership for the given organization, should: return empty object", () => {
    const now = new Date();
    const user = createOnboardingUser({ memberships: [] });
    const organizationSlug = "org-1";

    const actual = mapOnboardingUserToBillingSidebarCardProps({
      now,
      organizationSlug,
      user,
    });
    const expected = {};

    expect(actual).toEqual(expected);
  });

  test.each([
    OrganizationMembershipRole.member,
    OrganizationMembershipRole.admin,
    OrganizationMembershipRole.owner,
  ])(
    "given: an onboarded %s user without a free trial, should: return an empty object",
    (role) => {
      const now = new Date();
      const subscription =
        createPopulatedStripeSubscriptionItemWithPriceAndProduct({
          price: {
            lookupKey: priceLookupKeysByTierAndInterval.low.monthly,
          },
        });
      const organization = createPopulatedOrganization();
      const user = createOnboardingUser({
        memberships: [
          {
            deactivatedAt: null,
            organization: {
              ...organization,
              stripeSubscriptions: [subscription],
            },
            role,
          },
        ],
      });

      const actual = mapOnboardingUserToBillingSidebarCardProps({
        now,
        organizationSlug: organization.slug,
        user,
      });
      const expected = {};

      expect(actual).toEqual(expected);
    },
  );

  test("given: an onboarded member user with a free trial, should: show the billing sidebar card without the button", () => {
    const now = new Date();
    const organization = createPopulatedOrganization({
      // 1 day ago
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24),
    });
    const user = createOnboardingUser({
      memberships: [
        {
          deactivatedAt: null,
          organization: { ...organization, stripeSubscriptions: [] },
          role: OrganizationMembershipRole.member,
        },
      ],
    });

    const actual = mapOnboardingUserToBillingSidebarCardProps({
      now,
      organizationSlug: organization.slug,
      user,
    });
    const expected = {
      billingSidebarCardProps: {
        showButton: false,
        state: "trialing",
        trialEndDate: organization.trialEnd,
      },
    };

    expect(actual).toEqual(expected);
  });

  test.each([
    OrganizationMembershipRole.admin,
    OrganizationMembershipRole.owner,
  ])(
    "given: an onboarded %s user with a free trial, should: show the billing sidebar card with the button",
    (role) => {
      const now = new Date();
      const organization = createPopulatedOrganization({
        // 1 day ago
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24),
      });
      const user = createOnboardingUser({
        memberships: [
          {
            deactivatedAt: null,
            organization: { ...organization, stripeSubscriptions: [] },
            role,
          },
        ],
      });

      const actual = mapOnboardingUserToBillingSidebarCardProps({
        now,
        organizationSlug: organization.slug,
        user,
      });

      const expected = {
        billingSidebarCardProps: {
          showButton: true,
          state: "trialing",
          trialEndDate: organization.trialEnd,
        },
      };

      expect(actual).toEqual(expected);
    },
  );

  test("given: any onboarded user with a free trial that has run out, should: show the billing sidebar card with the correct content", () => {
    const now = new Date();
    const organization = createPopulatedOrganization({
      // 30 days ago
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30),
    });
    const user = createOnboardingUser({
      memberships: [
        {
          deactivatedAt: null,
          organization: { ...organization, stripeSubscriptions: [] },
          role: OrganizationMembershipRole.member,
        },
      ],
    });

    const actual = mapOnboardingUserToBillingSidebarCardProps({
      now,
      organizationSlug: organization.slug,
      user,
    });

    const expected = {
      billingSidebarCardProps: {
        showButton: false,
        state: "trialEnded",
        trialEndDate: organization.trialEnd,
      },
    };

    expect(actual).toEqual(expected);
  });
});

describe("switchSlugInRoute()", () => {
  test.each([
    {
      expected: href("/organizations/:organizationSlug", {
        organizationSlug: "org-1",
      }),
      route: href("/organizations/:organizationSlug", {
        organizationSlug: createPopulatedOrganization().slug,
      }),
      slug: "org-1",
    },
    {
      expected: href("/organizations/:organizationSlug/dashboard", {
        organizationSlug: "org-1",
      }),
      route: href("/organizations/:organizationSlug/dashboard", {
        organizationSlug: createPopulatedOrganization().slug,
      }),
      slug: "org-1",
    },
    {
      expected: href("/organizations/:organizationSlug/settings/general", {
        organizationSlug: "org-1",
      }),
      route: href("/organizations/:organizationSlug/settings/general", {
        organizationSlug: createPopulatedOrganization().slug,
      }),
      slug: "org-1",
    },
  ])(
    "given: a route with a slug, should: return the route with the slug replaced",
    ({ route, slug, expected }) => {
      const actual = switchSlugInRoute(route, slug);

      expect(actual).toEqual(expected);
    },
  );
});
