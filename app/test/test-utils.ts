import {
  type Organization,
  OrganizationMembershipRole,
  type UserAccount,
} from '@prisma/client';

import { createPopulatedOrganization } from '~/features/organizations/organizations-factories.server';
import {
  addMembersToOrganizationInDatabaseById,
  deleteOrganizationFromDatabaseById,
  saveOrganizationToDatabase,
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
}: {
  url: string;
  user: UserAccount;
  method?: string;
  formData?: FormData;
}) {
  // Create a mock session with the provided user details.
  const mockSession = createMockSupabaseSession({ user });

  await setMockSession(mockSession.access_token, mockSession);

  // Determine the Supabase project reference for the cookie name.
  const projectReference =
    process.env.SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1] ?? 'default';
  const cookieName = `sb-${projectReference}-auth-token`;
  const cookieValue = encodeURIComponent(JSON.stringify(mockSession));

  // Create a new request with the auth cookie.
  const request = new Request(url, { method, body: formData });
  request.headers.set('Cookie', `${cookieName}=${cookieValue}`);

  return request;
}

/**
 * Saves the user account and organization to the database and adds the user as
 * a member of the organization.
 *
 * @param options - Optional parameter containing the organization and user
 * objects to be saved.
 * @returns - An object containing the saved organization and user.
 */
export async function setupUserWithOrgAndAddAsMember({
  organization = createPopulatedOrganization(),
  user = createPopulatedUserAccount(),
  role = OrganizationMembershipRole.member,
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
  await deleteOrganizationFromDatabaseById(organization.id);
  await deleteUserAccountFromDatabaseById(user.id);
}
