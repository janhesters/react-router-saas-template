import { href } from 'react-router';
import { describe, expect, test } from 'vitest';

import { createOnboardingUser } from '~/test/test-utils';

import { createPopulatedOrganization } from '../organizations-factories.server';
import { getSidebarState, switchSlugInRoute } from './layout-helpers.server';
import { mapOnboardingUserToOrganizationLayoutProps } from './layout-helpers.server';

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
      currentOrganization: {
        id: 'org2',
        name: 'Organization 2',
        logo: 'https://example.com/org2.jpg',
        slug: 'org-2',
        plan: 'Free',
      },
      organizations: [
        {
          id: 'org1',
          name: 'Organization 1',
          logo: 'https://example.com/org1.jpg',
          slug: 'org-1',
          plan: 'Free',
        },
        {
          id: 'org2',
          name: 'Organization 2',
          logo: 'https://example.com/org2.jpg',
          slug: 'org-2',
          plan: 'Free',
        },
      ],
      user: {
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://example.com/avatar.jpg',
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
      currentOrganization: undefined,
      organizations: [],
      user: {
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://example.com/avatar.jpg',
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
