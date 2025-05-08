/* eslint-disable unicorn/no-null */
import { faker } from '@faker-js/faker';
import type { Organization, UserAccount } from '@prisma/client';
import { OrganizationMembershipRole } from '@prisma/client';
import type Stripe from 'stripe';

import { createSubscriptionWithItems } from '~/features/billing/billing-factories.server';
import { createStripeCustomer } from '~/features/billing/stripe-factories.server';
import { createStripeSubscription } from '~/features/billing/stripe-factories.server';
import type { OnboardingUser } from '~/features/onboarding/onboarding-helpers.server';
import { createPopulatedOrganization } from '~/features/organizations/organizations-factories.server';
import {
  addMembersToOrganizationInDatabaseById,
  deleteOrganizationFromDatabaseById,
  saveOrganizationToDatabase,
  upsertStripeSubscriptionForOrganizationInDatabaseById,
} from '~/features/organizations/organizations-model.server';
import { createPopulatedUserAccount } from '~/features/user-accounts/user-accounts-factories.server';
import {
  deleteUserAccountFromDatabaseById,
  saveUserAccountToDatabase,
} from '~/features/user-accounts/user-accounts-model.server';
import {
  createPopulatedSupabaseSession,
  createPopulatedSupabaseUser,
} from '~/features/user-authentication/user-authentication-factories';

import { setMockSession } from './mocks/handlers/supabase/mock-sessions';

/**
 * Recursive partial type for deep overrides, preserving Date instances.
 */
type DeepPartial<T> = T extends Date
  ? T
  : T extends (infer U)[]
    ? DeepPartial<U>[]
    : T extends object
      ? { [P in keyof T]?: DeepPartial<T[P]> }
      : T;

/**
 * A factory function for creating an onboarded user with their memberships.
 *
 * @param props - The properties of the onboarding user.
 * @returns An onboarding user.
 *
 * @example // Default user with 3 memberships
 * const user = createOnboardingUser();
 *
 * @example // Override the user's name and email
 * const customUser = createOnboardingUser({
 *   name: 'Jane Doe',
 *   email: 'jane@example.com',
 * });
 *
 * @example // Override first membership role and organization name
 * const customMembershipUser = createOnboardingUser({
 *   memberships: [
 *     {
 *       role: OrganizationMembershipRole.admin,
 *       organization: { name: 'Acme Corporation' },
 *     },
 *   ],
 * });
 *
 * @example // Provide custom subscriptions for second membership
 * const customSubUser = createOnboardingUser({
 *   memberships: [
 *     {},
 *     {
 *       organization: {
 *         stripeSubscriptions: [
 *           createSubscriptionWithItems({ status: 'canceled' }),
 *         ],
 *       },
 *     },
 *   ],
 * });
 */
export const createOnboardingUser = (
  overrides: DeepPartial<OnboardingUser> = {},
): OnboardingUser => {
  // Base user account
  const baseUser = createPopulatedUserAccount();

  // Prepare up to three default memberships
  const defaultMemberships: OnboardingUser['memberships'] = Array.from({
    length: overrides.memberships?.length ?? 3,
  }).map(() => {
    const organization = createPopulatedOrganization();
    return {
      role: OrganizationMembershipRole.member,
      deactivatedAt: null,
      organization: {
        ...organization,
        _count: { memberships: faker.number.int({ min: 1, max: 10 }) },
        // Each org gets at least one subscription with items
        stripeSubscriptions: [
          {
            ...createSubscriptionWithItems({ organizationId: organization.id }),
            schedules: [],
          },
        ],
      },
    };
  });

  // Merge overrides for memberships
  type Membership = OnboardingUser['memberships'][number];
  type OrgWithSubscriptions = Membership['organization'];
  const finalMemberships: Membership[] = defaultMemberships.map(
    (base, index) => {
      const overrideM =
        (overrides.memberships?.[index] as Partial<Membership>) || {};
      const baseOrg = base.organization;
      const overrideOrg =
        (overrideM.organization as Partial<OrgWithSubscriptions>) || {};

      // Merge subscriptions array explicitly, fallback to base
      const subscriptions =
        overrideOrg.stripeSubscriptions ?? baseOrg.stripeSubscriptions;

      const mergedOrg: OrgWithSubscriptions = {
        ...baseOrg,
        ...overrideOrg,
        stripeSubscriptions: subscriptions,
      };

      return {
        role: overrideM.role ?? base.role,
        deactivatedAt: overrideM.deactivatedAt ?? base.deactivatedAt,
        organization: mergedOrg,
      };
    },
  );

  return {
    ...baseUser,
    // User-level overrides (e.g. name, email)
    ...overrides,
    memberships: finalMemberships,
  };
};

function createMockJWT(payload: object): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=+$/, '');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=+$/, '');
  const signature = 'mock_signature';
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Creates a mock Supabase session with a fixed access token and refresh token.
 *
 * @param options - An object containing the user to create the session for.
 * @returns A Promise that resolves to a mock Supabase session.
 */
export const createMockSupabaseSession = ({
  user = createPopulatedUserAccount(),
}: {
  user?: UserAccount;
}) => {
  // Create a Supabase user with the provided ID and email
  const supabaseUser = createPopulatedSupabaseUser({
    id: user.supabaseUserId,
    email: user.email,
  });

  const jwtPayload = {
    sub: supabaseUser.id, // Subject (user ID)
    email: supabaseUser.email,
    exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
  };

  const access_token = createMockJWT(jwtPayload);

  // Create a session with fixed tokens for testing
  const session = createPopulatedSupabaseSession({
    user: supabaseUser,
    access_token,
  });

  return session;
};

/**
 * Creates an authenticated request object with the given parameters and a user
 * auth session behind the scenes.
 * NOTE: You need to activate the MSW mocks for Supabase (`getUser`) for this to
 * work.
 *
 * @param options - An object containing the url and user as well as optional
 * form data.
 * @returns A Request object with authentication cookies.
 */
export async function createAuthenticatedRequest({
  url,
  user,
  method = 'POST',
  formData,
  headers,
}: {
  url: string;
  user: UserAccount;
  method?: string;
  formData?: FormData;
  headers?: Headers;
}) {
  // Create a mock session with the provided user details.
  const mockSession = createMockSupabaseSession({ user });

  await setMockSession(mockSession.access_token, mockSession);

  // Determine the Supabase project reference for the cookie name.
  const projectReference =
    process.env.VITE_SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1] ?? 'default';
  const cookieName = `sb-${projectReference}-auth-token`;
  const cookieValue = encodeURIComponent(JSON.stringify(mockSession));

  // Create a new request with the auth cookie.
  const request = new Request(url, { method, body: formData });

  // Add any additional headers to the request first
  if (headers) {
    for (const [key, value] of headers.entries()) {
      request.headers.set(key, value);
    }
  }

  // Set the auth cookie, preserving any existing cookies
  const existingCookies = request.headers.get('Cookie') ?? '';
  const authCookie = `${cookieName}=${cookieValue}`;
  request.headers.set(
    'Cookie',
    existingCookies ? `${existingCookies}; ${authCookie}` : authCookie,
  );

  return request;
}

export async function createUserWithTrialOrgAndAddAsMember({
  organization = createPopulatedOrganization({
    // This automatically sets the trial end to 14 days from the creation date.
    createdAt: faker.date.recent({ days: 3 }),
  }),
  user = createPopulatedUserAccount(),
  role = OrganizationMembershipRole.member as OrganizationMembershipRole,
} = {}) {
  // Save user account and organization and add user as a member.
  await Promise.all([
    saveUserAccountToDatabase(user),
    saveOrganizationToDatabase(organization),
  ]);
  await addMembersToOrganizationInDatabaseById({
    id: organization.id,
    members: [user.id],
    role,
  });

  return { organization, user };
}

/**
 * Creates a test Stripe subscription for a user and organization.
 *
 * This helper function creates a Stripe customer and subscription, then associates them
 * with the provided organization and user in the database.
 *
 * @param options - An object containing the user and organization
 * @param options.user - The user account that will be set as the subscription purchaser
 * @param options.organization - The organization that will own the subscription
 * @returns The updated organization with the new subscription data
 */
export async function createTestSubscriptionForUserAndOrganization({
  user,
  organization,
  subscription = createStripeSubscription(),
}: {
  user: UserAccount;
  organization: Organization;
  subscription?: Stripe.Subscription;
}) {
  const customer = createStripeCustomer();
  const organizationWithSubscription =
    await upsertStripeSubscriptionForOrganizationInDatabaseById({
      organizationId: organization.id,
      purchasedById: user.id,
      stripeCustomerId: customer.id,
      stripeSubscription: { ...subscription, customer: customer.id },
    });
  return organizationWithSubscription;
}

/**
 * Saves the user account and organization to the database and adds the user as
 * a member of the organization.
 *
 * @param options - Optional parameter containing the organization and user
 * objects to be saved.
 * @returns - An object containing the saved organization and user.
 */
export async function createUserWithOrgAndAddAsMember({
  organization = createPopulatedOrganization(),
  user = createPopulatedUserAccount(),
  role = OrganizationMembershipRole.member as OrganizationMembershipRole,
} = {}) {
  const createdAt = faker.date.recent({ days: 3 });
  const subscription = createStripeSubscription({
    created: Math.floor(createdAt.getTime() / 1000),
  });
  // Save user account and organization and add user as a member.
  await createUserWithTrialOrgAndAddAsMember({
    // When the user subscribes, it ends the trial.
    organization: { ...organization, trialEnd: createdAt },
    user,
    role,
  });
  await createTestSubscriptionForUserAndOrganization({
    user,
    organization,
    subscription,
  });

  return { organization, user };
}

/**
 * Deletes an organization and a user from the database.
 *
 * @param params - The organization and user to delete.
 * @returns  A Promise that resolves when the organization and user account
 * have been removed from the database.
 */
export async function teardownOrganizationAndMember({
  organization,
  user,
}: {
  organization: Organization;
  user: UserAccount;
}) {
  try {
    await deleteOrganizationFromDatabaseById(organization.id);
  } catch {
    // do nothing, the org was probably deleted in the test
  }
  try {
    await deleteUserAccountFromDatabaseById(user.id);
  } catch {
    // do nothing, the user was probably deleted in the test
  }
}
