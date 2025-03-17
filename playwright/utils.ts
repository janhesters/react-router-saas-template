import type { APIResponse, Page } from '@playwright/test';
import { request } from '@playwright/test';
import type { Organization, UserAccount } from '@prisma/client';
import { OrganizationMembershipRole } from '@prisma/client';
import dotenv from 'dotenv';
import { promiseHash } from 'remix-utils/promise';

import { createPopulatedOrganization } from '~/features/organizations/organizations-factories.server';
import {
  addMembersToOrganizationInDatabaseById,
  saveOrganizationToDatabase,
} from '~/features/organizations/organizations-model.server';
import { createPopulatedUserAccount } from '~/features/user-accounts/user-accounts-factories.server';
import { saveUserAccountToDatabase } from '~/features/user-accounts/user-accounts-model.server';
import { setMockSession } from '~/test/mocks/handlers/supabase/mock-sessions';
import { createMockSupabaseSession } from '~/test/test-utils';

dotenv.config();

/**
 * Returns the pathname with the search of a given page's url.
 *
 * @param page - The page to get the path of.
 * @returns The path of the page's url.
 */
export const getPath = (page: Page | APIResponse) => {
  const url = new URL(page.url());
  return `${url.pathname}${url.search}`;
};

/**
 * Fake logs in a user by setting the necessary Supabase auth cookies.
 * This allows testing authenticated routes without going through the actual
 * login flow.
 *
 * NOTE: You need to activate the MSW mocks for Supabase (`getUser`) for this
 * to work. You need to run the server mocks (`npm run dev-with-server-mocks`)
 * and have the MSW interceptor for `getUser` enabled (see `startMockServer`).
 *
 * @param options - The options for logging in.
 * @param options.page - The Playwright page to set cookies on.
 * @param options.superbaseUserId - Optional Supabase user ID to set in the
 * session.
 * @param options.email - Optional email to set in the session.
 * @returns A promise that resolves when the cookies have been set.
 */
export async function loginByCookie({
  page,
  user = createPopulatedUserAccount(),
}: {
  page: Page;
  user?: UserAccount;
}) {
  // Create a mock session with the provided user details
  const mockSession = createMockSupabaseSession({ user });
  await setMockSession(mockSession.access_token, mockSession);

  // Set the Supabase session cookie
  const projectReference =
    process.env.SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1] ?? 'default';

  // Set the cookie with the session data
  await page.context().addCookies([
    {
      name: `sb-${projectReference}-auth-token`,
      value: JSON.stringify(mockSession),
      domain: 'localhost',
      path: '/',
    },
  ]);
}

/**
 * Creates an authenticated Playwright request context with a Supabase auth cookie.
 * Useful for testing API endpoints that require authentication via cookies.
 *
 * @param options - The options for creating the authenticated request.
 * @param options.supabaseUserId - The Supabase user ID to set in the session.
 * @param options.email - The email to set in the session.
 * @returns A promise that resolves to an authenticated APIRequestContext.
 */
export async function createAuthenticatedRequest({
  supabaseUserId,
  email,
}: {
  supabaseUserId: UserAccount['supabaseUserId'];
  email: UserAccount['email'];
}) {
  // Create a mock session with the provided user details
  const user = createPopulatedUserAccount({ supabaseUserId, email });
  const mockSession = createMockSupabaseSession({ user });
  await setMockSession(mockSession.access_token, mockSession);

  // Determine the Supabase project reference for the cookie name
  const projectReference =
    process.env.SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1] ?? 'default';
  const cookieName = `sb-${projectReference}-auth-token`;
  const cookieValue = JSON.stringify(mockSession);

  // Create a new request context with the auth cookie
  const authenticatedRequest = await request.newContext({
    extraHTTPHeaders: {
      Cookie: `${cookieName}=${encodeURIComponent(cookieValue)}`,
    },
  });

  return authenticatedRequest;
}

/**
 * Logs in a user by saving them to the database and then logging them in
 * via the cookie.
 *
 * @param user - The user to save and login.
 * @param page - The Playwright page to set cookies on.
 * @returns The user account that was saved and logged in.
 */
export async function loginAndSaveUserAccountToDatabase({
  user = createPopulatedUserAccount(),
  page,
}: {
  user?: UserAccount;
  page: Page;
}) {
  const [userAccount] = await Promise.all([
    saveUserAccountToDatabase(user),
    loginByCookie({ user, page }),
  ]);

  return userAccount;
}

/**
 * Creates an organization and a user, adds that user as a member of the
 * organization, and logs in the user via cookie for the given page.
 *
 * @param params - The organization and user to create and the test's page.
 * @returns The organization and user that were created.
 */
export async function setupOrganizationAndLoginAsMember({
  organization = createPopulatedOrganization(),
  page,
  user = createPopulatedUserAccount(),
  role = OrganizationMembershipRole.member,
}: {
  organization?: Organization;
  page: Page;
  role?: OrganizationMembershipRole;
  user?: UserAccount;
}) {
  const data = await promiseHash({
    organization: saveOrganizationToDatabase(organization),
    user: loginAndSaveUserAccountToDatabase({ user, page }),
  });
  await addMembersToOrganizationInDatabaseById({
    id: data.organization.id,
    members: [data.user.id],
    role,
  });

  return data;
}
