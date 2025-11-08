import { faker } from "@faker-js/faker";
import type { APIResponse, Page } from "@playwright/test";
import { request } from "@playwright/test";
import type { Organization, UserAccount } from "@prisma/client";
import { OrganizationMembershipRole } from "@prisma/client";
import dotenv from "dotenv";
import { promiseHash } from "remix-utils/promise";

import type { LookupKey } from "~/features/billing/billing-constants";
import type { StripeSubscriptionWithItemsAndPrice } from "~/features/billing/billing-factories.server";
import { createPopulatedStripeSubscriptionWithItemsAndPrice } from "~/features/billing/billing-factories.server";
import { EMAIL_INVITE_INFO_SESSION_NAME } from "~/features/organizations/accept-email-invite/accept-email-invite-constants";
import type { CreateEmailInviteInfoCookieParams } from "~/features/organizations/accept-email-invite/accept-email-invite-session.server";
import { createEmailInviteInfoCookie } from "~/features/organizations/accept-email-invite/accept-email-invite-session.server";
import { INVITE_LINK_INFO_SESSION_NAME } from "~/features/organizations/accept-invite-link/accept-invite-link-constants";
import type { CreateInviteLinkInfoCookieParams } from "~/features/organizations/accept-invite-link/accept-invite-link-session.server";
import { createInviteLinkInfoCookie } from "~/features/organizations/accept-invite-link/accept-invite-link-session.server";
import { createPopulatedOrganization } from "~/features/organizations/organizations-factories.server";
import {
  addMembersToOrganizationInDatabaseById,
  saveOrganizationToDatabase,
} from "~/features/organizations/organizations-model.server";
import { createPopulatedUserAccount } from "~/features/user-accounts/user-accounts-factories.server";
import { saveUserAccountToDatabase } from "~/features/user-accounts/user-accounts-model.server";
import { setMockSession } from "~/test/mocks/handlers/supabase/mock-sessions";
import {
  createMockSupabaseSession,
  createTestSubscriptionForUserAndOrganization,
} from "~/test/test-utils";

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
    /https:\/\/([^.]+)/.exec(process.env.VITE_SUPABASE_URL)?.[1] ?? "default";

  // Set the cookie with the session data
  await page.context().addCookies([
    {
      domain: "localhost",
      name: `sb-${projectReference}-auth-token`,
      path: "/",
      value: JSON.stringify(mockSession),
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
  supabaseUserId: UserAccount["supabaseUserId"];
  email: UserAccount["email"];
}) {
  // Create a mock session with the provided user details
  const user = createPopulatedUserAccount({ email, supabaseUserId });
  const mockSession = createMockSupabaseSession({ user });
  await setMockSession(mockSession.access_token, mockSession);

  // Determine the Supabase project reference for the cookie name
  const projectReference =
    /https:\/\/([^.]+)/.exec(process.env.VITE_SUPABASE_URL)?.[1] ?? "default";
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
    loginByCookie({ page, user }),
  ]);

  return userAccount;
}

/**
 * Creates a trial organization and a user, adds that user as a member of the
 * organization, and logs in the user via cookie for the given page.
 *
 * @param params - The organization and user to create and the test's page.
 * @returns The organization and user that were created.
 */
export async function setupTrialOrganizationAndLoginAsMember({
  organization = createPopulatedOrganization({
    billingEmail: "",
    createdAt: faker.date.recent({ days: 3 }),
    stripeCustomerId: null,
  }),
  page,
  role = OrganizationMembershipRole.member,
  user = createPopulatedUserAccount(),
}: {
  organization?: Organization;
  page: Page;
  role?: OrganizationMembershipRole;
  user?: UserAccount;
}) {
  const data = await promiseHash({
    organization: saveOrganizationToDatabase(organization),
    user: loginAndSaveUserAccountToDatabase({ page, user }),
  });
  await addMembersToOrganizationInDatabaseById({
    id: data.organization.id,
    members: [data.user.id],
    role,
  });
  return data;
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
  subscription = createPopulatedStripeSubscriptionWithItemsAndPrice({
    organizationId: organization.id,
  }),
  lookupKey,
}: {
  organization?: Organization;
  page: Page;
  role?: OrganizationMembershipRole;
  user?: UserAccount;
  subscription?: StripeSubscriptionWithItemsAndPrice;
  lookupKey?: LookupKey;
}) {
  const data = await setupTrialOrganizationAndLoginAsMember({
    organization,
    page,
    role,
    user,
  });
  const organizationWithSubscription =
    await createTestSubscriptionForUserAndOrganization({
      lookupKey,
      organization: data.organization,
      // biome-ignore lint/style/noNonNullAssertion: The mocks have a stripe customer id
      stripeCustomerId: data.organization.stripeCustomerId!,
      subscription,
      user: data.user,
    });

  return { ...data, organization: organizationWithSubscription };
}

/**
 * Sets up the invite link cookie with organization and creator information.
 * This simulates what happens when a user clicks an invite link before authentication.
 *
 * @param params - The page and invite link information to set up the cookie.
 * @returns A promise that resolves when the cookie has been set.
 */
export async function setupInviteLinkCookie({
  page,
  link,
}: {
  page: Page;
  link: CreateInviteLinkInfoCookieParams;
}) {
  const cookieHeader = await createInviteLinkInfoCookie(link);

  // Extract the raw cookie value from the Set-Cookie header
  const cookieValueMatch = new RegExp(
    `^${INVITE_LINK_INFO_SESSION_NAME}=([^;]+)`,
  ).exec(cookieHeader);
  if (!cookieValueMatch?.[1]) {
    throw new Error("Failed to extract cookie value from Set-Cookie header");
  }
  const cookieValue = cookieValueMatch[1];

  // Extract Max-Age and convert to expires (optional)
  const maxAgeMatch = /Max-Age=(\d+)/.exec(cookieHeader);
  let expires: number | undefined;
  if (maxAgeMatch?.[1]) {
    const maxAgeSeconds = Number.parseInt(maxAgeMatch[1], 10);
    expires = Math.floor(Date.now() / 1000) + maxAgeSeconds; // Convert to Unix timestamp in seconds
  }

  await page.context().addCookies([
    {
      domain: "localhost",
      expires, // Use expires instead of maxAge
      httpOnly: true, // Match your cookie config
      name: INVITE_LINK_INFO_SESSION_NAME,
      path: "/",
      sameSite: "Lax", // Match your cookie config
      value: cookieValue, // Only the raw signed value
    },
  ]);
}

/**
 * Sets up the email invite cookie with organization and invitee information.
 * This simulates what happens when a user clicks an email invite link before authentication.
 *
 * @param params - The page and email invite information to set up the cookie.
 * @returns A promise that resolves when the cookie has been set.
 */
export async function setupEmailInviteCookie({
  page,
  invite,
}: {
  page: Page;
  invite: CreateEmailInviteInfoCookieParams;
}) {
  const cookieHeader = await createEmailInviteInfoCookie(invite);

  // Extract the raw cookie value from the Set-Cookie header
  const cookieValueMatch = new RegExp(
    `^${EMAIL_INVITE_INFO_SESSION_NAME}=([^;]+)`,
  ).exec(cookieHeader);
  if (!cookieValueMatch?.[1]) {
    throw new Error("Failed to extract cookie value from Set-Cookie header");
  }
  const cookieValue = cookieValueMatch[1];

  // Extract Max-Age and convert to expires (optional)
  const maxAgeMatch = /Max-Age=(\d+)/.exec(cookieHeader);
  let expires: number | undefined;
  if (maxAgeMatch?.[1]) {
    const maxAgeSeconds = Number.parseInt(maxAgeMatch[1], 10);
    expires = Math.floor(Date.now() / 1000) + maxAgeSeconds; // Convert to Unix timestamp in seconds
  }

  await page.context().addCookies([
    {
      domain: "localhost",
      expires, // Use expires instead of maxAge
      httpOnly: true, // Match your cookie config
      name: EMAIL_INVITE_INFO_SESSION_NAME,
      path: "/",
      sameSite: "Lax", // Match your cookie config
      value: cookieValue, // Only the raw signed value
    },
  ]);
}

/**
 * Defines valid JSON data structures for type-safe parsing.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

/**
 * Converts a Buffer into a JavaScript object by parsing its JSON string.
 *
 * @param buffer - The Buffer containing JSON data.
 * @returns The parsed JavaScript object.
 */
const butterToJson = (buffer: Buffer): Json =>
  JSON.parse(buffer.toString()) as Json;

/**
 * Extracts and parses JSON from the APIResponse's body.
 *
 * @param response - The APIResponse to parse.
 * @returns A promise resolving to the parsed JSON object.
 */
export const getJson = (response: APIResponse) =>
  response.body().then(butterToJson);
