import { OrganizationMembershipRole } from '@prisma/client';
import { href } from 'react-router';
import { describe, expect, test } from 'vitest';

import { createSubscriptionWithPrice } from '~/features/billing/billing-factories.server';
import { createOnboardingUser } from '~/test/test-utils';

import { createPopulatedOrganization } from '../organizations-factories.server';
import { getSidebarState, switchSlugInRoute } from './layout-helpers.server';
import {
  mapOnboardingUserToBillingSidebarCardProps,
  mapOnboardingUserToOrganizationLayoutProps,
} from './layout-helpers.server';

describe('getSidebarState', () => {
  test('given: request with sidebar_state cookie set to "true", should: return true', () => {
    const request = new Request('http://localhost', {
      headers: {
        cookie: 'sidebar_state=true',
      },
    });

    const actual = getSidebarState(request);
    const expected = true;

    expect(actual).toEqual(expected);
  });

  test('given: request with sidebar_state cookie set to "false", should: return false', () => {
    const request = new Request('http://localhost', {
      headers: {
        cookie: 'sidebar_state=false',
      },
    });

    const actual = getSidebarState(request);
    const expected = false;

    expect(actual).toEqual(expected);
  });

  test('given: request with no sidebar_state cookie, should: return true', () => {
    const request = new Request('http://localhost');

    const actual = getSidebarState(request);
    const expected = true;

    expect(actual).toEqual(expected);
  });

  test('given: request with invalid sidebar_state cookie value, should: return false', () => {
    const request = new Request('http://localhost', {
      headers: {
        cookie: 'sidebar_state=invalid',
      },
    });

    const actual = getSidebarState(request);
    const expected = false;

    expect(actual).toEqual(expected);
  });
});

describe('mapOnboardingUserToOrganizationLayoutProps()', () => {
  test('given: onboarding user with organizations, should: map to organization layout props', () => {
    const user = createOnboardingUser({
      name: 'John Doe',
      email: 'john@example.com',
      imageUrl: 'https://example.com/avatar.jpg',
      memberships: [
        {
          role: 'member',
          organization: {
            id: 'org1',
            name: 'Organization 1',
            imageUrl: 'https://example.com/org1.jpg',
            slug: 'org-1',
            stripeSubscriptions: [
              createSubscriptionWithPrice({ lookupKey: 'business_monthly' }),
            ],
          },
          deactivatedAt: null,
        },
        {
          role: 'member',
          organization: {
            id: 'org2',
            name: 'Organization 2',
            imageUrl: 'https://example.com/org2.jpg',
            slug: 'org-2',
            stripeSubscriptions: [
              createSubscriptionWithPrice({ lookupKey: 'hobby_annual' }),
            ],
          },
          deactivatedAt: null,
        },
      ],
    });
    const organizationSlug = 'org-2';

    const actual = mapOnboardingUserToOrganizationLayoutProps({
      user,
      organizationSlug,
    });
    const expected = {
      organizationSwitcherProps: {
        currentOrganization: {
          id: 'org2',
          name: 'Organization 2',
          logo: 'https://example.com/org2.jpg',
          slug: 'org-2',
          plan: 'hobby_annual',
        },
        organizations: [
          {
            id: 'org1',
            name: 'Organization 1',
            logo: 'https://example.com/org1.jpg',
            slug: 'org-1',
            plan: 'business_monthly',
          },
          {
            id: 'org2',
            name: 'Organization 2',
            logo: 'https://example.com/org2.jpg',
            slug: 'org-2',
            plan: 'hobby_annual',
          },
        ],
      },
      navUserProps: {
        user: {
          name: 'John Doe',
          email: 'john@example.com',
          avatar: 'https://example.com/avatar.jpg',
        },
      },
    };

    expect(actual).toEqual(expected);
  });

  test('given: onboarding user with no organizations, should: return empty organizations array', () => {
    const user = createOnboardingUser({
      name: 'John Doe',
      email: 'john@example.com',
      imageUrl: 'https://example.com/avatar.jpg',
      memberships: [],
    });

    const actual = mapOnboardingUserToOrganizationLayoutProps({
      user,
      organizationSlug: 'org-1',
    });
    const expected = {
      organizationSwitcherProps: {
        currentOrganization: undefined,
        organizations: [],
      },
      navUserProps: {
        user: {
          name: 'John Doe',
          email: 'john@example.com',
          avatar: 'https://example.com/avatar.jpg',
        },
      },
    };

    expect(actual).toEqual(expected);
  });
});

describe('mapOnboardingUserToBillingSidebarCardProps()', () => {
  test('given: a user without a membership for the given organization, should: return empty object', () => {
    const now = new Date();
    const user = createOnboardingUser({ memberships: [] });
    const organizationSlug = 'org-1';

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
    'given: an onboarded %s user without a free trial, should: return an empty object',
    role => {
      const now = new Date();
      const subscription = createSubscriptionWithPrice({ status: 'active' });
      const organization = createPopulatedOrganization();
      const user = createOnboardingUser({
        memberships: [
          {
            role,
            organization: {
              ...organization,
              stripeSubscriptions: [subscription],
            },
            deactivatedAt: null,
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

  test('given: an onboarded member user with a free trial, should: show the billing sidebar card without the button', () => {
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 1000 * 60 * 60 * 24); // tomorrow
    const subscription = createSubscriptionWithPrice({
      status: 'trialing',
      trialEnd,
    });
    const organization = createPopulatedOrganization();
    const user = createOnboardingUser({
      memberships: [
        {
          role: OrganizationMembershipRole.member,
          organization: {
            ...organization,
            stripeSubscriptions: [subscription],
          },
          deactivatedAt: null,
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
        freeTrialIsActive: true,
        showButton: false,
        trialEndDate: trialEnd,
      },
    };

    expect(actual).toEqual(expected);
  });

  test.each([
    OrganizationMembershipRole.admin,
    OrganizationMembershipRole.owner,
  ])(
    'given: an onboarded %s user with a free trial, should: show the billing sidebar card with the button',
    role => {
      const now = new Date();
      const trialEnd = new Date(now.getTime() + 1000 * 60 * 60);
      const subscription = createSubscriptionWithPrice({
        status: 'trialing',
        trialEnd,
      });
      const organization = createPopulatedOrganization();
      const user = createOnboardingUser({
        memberships: [
          {
            role,
            organization: {
              ...organization,
              stripeSubscriptions: [subscription],
            },
            deactivatedAt: null,
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
          freeTrialIsActive: true,
          showButton: true,
          trialEndDate: trialEnd,
        },
      };

      expect(actual).toEqual(expected);
    },
  );

  test('given: any onboarded user with a free trial that has run out, should: show the billing sidebar card with the correct content', () => {
    const now = new Date();
    const trialEnd = new Date(now.getTime() - 1000 * 60 * 60); // yesterday
    const subscription = createSubscriptionWithPrice({
      status: 'trialing',
      trialEnd,
    });
    const organization = createPopulatedOrganization();
    const user = createOnboardingUser({
      memberships: [
        {
          role: OrganizationMembershipRole.member,
          organization: {
            ...organization,
            stripeSubscriptions: [subscription],
          },
          deactivatedAt: null,
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
        freeTrialIsActive: false,
        showButton: false,
        trialEndDate: trialEnd,
      },
    };

    expect(actual).toEqual(expected);
  });
});

describe('switchSlugInRoute()', () => {
  test.each([
    {
      route: href('/organizations/:organizationSlug', {
        organizationSlug: createPopulatedOrganization().slug,
      }),
      slug: 'org-1',
      expected: href('/organizations/:organizationSlug', {
        organizationSlug: 'org-1',
      }),
    },
    {
      route: href('/organizations/:organizationSlug/dashboard', {
        organizationSlug: createPopulatedOrganization().slug,
      }),
      slug: 'org-1',
      expected: href('/organizations/:organizationSlug/dashboard', {
        organizationSlug: 'org-1',
      }),
    },
    {
      route: href('/organizations/:organizationSlug/settings/general', {
        organizationSlug: createPopulatedOrganization().slug,
      }),
      slug: 'org-1',
      expected: href('/organizations/:organizationSlug/settings/general', {
        organizationSlug: 'org-1',
      }),
    },
  ])(
    'given: a route with a slug, should: return the route with the slug replaced',
    ({ route, slug, expected }) => {
      const actual = switchSlugInRoute(route, slug);

      expect(actual).toEqual(expected);
    },
  );
});
