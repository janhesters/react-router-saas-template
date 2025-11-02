import { createCookieSessionStorage } from "react-router";

const ORGANIZATION_SWITCHER_SESSION_KEY = "currentOrganizationId";
const ORGANIZATION_SWITCHER_SESSION_NAME = "__organization_switcher";
const TEN_YEARS_IN_SECONDS = 60 * 60 * 24 * 365 * 10;

const organizationSwitcherSession = createCookieSessionStorage<{
  [ORGANIZATION_SWITCHER_SESSION_KEY]: string;
}>({
  cookie: {
    httpOnly: true, // Prevents client-side JS from accessing the cookie
    maxAge: 0,
    name: ORGANIZATION_SWITCHER_SESSION_NAME,
    path: "/", // Cookie is available across the entire site
    sameSite: "lax", // Helps mitigate CSRF attacks
    secrets: [process.env.COOKIE_SECRET], // Secret to sign the cookie (replace with a secure value)
    secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
  },
});

/**
 * Gets the organization switcher session from the request cookies.
 *
 * @param request - The request object containing cookies
 * @returns The organization switcher session
 */
function getOrganizationSwitcherSession(request: Request) {
  return organizationSwitcherSession.getSession(request.headers.get("Cookie"));
}

/**
 * Gets the current organization ID from the session.
 *
 * @param request - The request object containing cookies
 * @returns The current organization ID stored in the session
 */
export async function getCurrentOrganizationIdFromSession(request: Request) {
  const session = await getOrganizationSwitcherSession(request);
  return session.get(ORGANIZATION_SWITCHER_SESSION_KEY);
}

/**
 * Sets the current organization ID in the session.
 *
 * @param request - The request object containing cookies
 * @param organizationId - The ID of the organization to set as current
 * @returns The committed session with the updated organization ID
 */
export async function createCookieForOrganizationSwitcherSession(
  request: Request,
  organizationId: string,
) {
  const session = await getOrganizationSwitcherSession(request);
  session.set(ORGANIZATION_SWITCHER_SESSION_KEY, organizationId);
  return organizationSwitcherSession.commitSession(session, {
    maxAge: TEN_YEARS_IN_SECONDS,
  });
}

/**
 * Destroys the organization switcher session.
 *
 * @param request - The request object containing cookies
 * @returns The response headers to destroy the session cookie
 */
export async function destroyOrganizationSwitcherSession(request: Request) {
  const session = await getOrganizationSwitcherSession(request);
  return organizationSwitcherSession.destroySession(session);
}
