/** biome-ignore-all lint/style/noNonNullAssertion: test code */

import { randomUUID } from "node:crypto";
import { createId } from "@paralleldrive/cuid2";
import type { RequestHandler } from "msw";
import { HttpResponse, http } from "msw";
import { z } from "zod";

import { writeEmail } from "../../utils";
import {
  deleteMockSession,
  getMockSession,
  setMockSession,
} from "./mock-sessions";
import {
  createPopulatedSupabaseSession,
  createPopulatedSupabaseUser,
} from "~/features/user-authentication/user-authentication-factories";
import { prisma } from "~/utils/database.server";

/*
Auth handlers
*/

/**
 * Gets or creates a consistent Supabase user ID for an email address.
 * This ensures the same email always gets the same Supabase ID by checking
 * existing database records first.
 */
async function getSupabaseUserIdForEmail(email: string): Promise<string> {
  // Check if user already exists in database
  const existingUser = await prisma.userAccount.findUnique({
    select: { supabaseUserId: true },
    where: { email },
  });

  if (existingUser) {
    return existingUser.supabaseUserId;
  }

  // Create new UUID v4 for new user (Supabase uses UUID v4 for user IDs)
  return randomUUID();
}

// supabase.auth.getUser

const getUserMock = http.get(
  `${process.env.VITE_SUPABASE_URL}/auth/v1/user`,
  async ({ request }) => {
    // Check for the presence of an Authorization header.
    const authHeader = request.headers.get("Authorization");

    // If no Authorization header or it doesn't start with 'Bearer ',
    // return unauthenticated response.
    if (!authHeader?.startsWith("Bearer ")) {
      return HttpResponse.json(
        { message: "JWT token is missing" },
        { status: 401 },
      );
    }

    const accessToken = authHeader.split(" ")[1];

    // Look up the user in the mockSessions map.
    const session = await getMockSession(accessToken ?? "");

    if (!session) {
      return HttpResponse.json(
        { message: "Invalid access token" },
        { status: 401 },
      );
    }

    // Mock user data response.
    return HttpResponse.json({ user: session.user });
  },
);

// supabase.auth.signInWithOtp

const rateLimitPrefix = "rate-limited";

/**
 * Creates a rate limited email for testing purposes. The Supabase MSW handler
 * will return a 429 status code for this email.
 *
 * @returns An email that will be rate limited.
 */
export function createRateLimitedEmail() {
  return `${rateLimitPrefix}-${createId()}@example.com`;
}

const signInWithOtpMock = http.post(
  `${process.env.VITE_SUPABASE_URL}/auth/v1/otp`,
  async ({ request }) => {
    // Parse the request body to determine if it's an email or phone OTP request
    const body = (await request.json()) as Record<string, string> & {
      data?: { intent: string };
    };

    if (body.email) {
      if (body.email.includes(rateLimitPrefix)) {
        // Rate limit response for specific email
        return HttpResponse.json(
          {
            message:
              "For security purposes, you can only request this after 60 seconds.",
          },
          { status: 429 },
        );
      }

      // Generate token_hash with email and consistent id for this email
      const supabaseUserId = await getSupabaseUserIdForEmail(body.email);
      const tokenHashData = { email: body.email, id: supabaseUserId };
      const tokenHash = stringifyTokenHashData(tokenHashData);

      // Determine intent (login vs register)
      const isLogin = body.data?.intent === "loginWithEmail";
      const route = isLogin ? "login" : "register";

      // Generate confirmation URL
      const confirmUrl = `${process.env.APP_URL}/${route}/confirm?token_hash=${encodeURIComponent(tokenHash)}`;

      // Create mock email
      const email = {
        from: "noreply@yourapp.com",
        html: `<p>Click here to ${isLogin ? "login" : "confirm your email"}:</p><a href="${confirmUrl}">${confirmUrl}</a>`,
        subject: isLogin ? "Login to Your App" : "Confirm your email",
        text: `Click here to ${isLogin ? "login" : "confirm your email"}: ${confirmUrl}`,
        to: body.email,
      };

      // Log to console (like Resend mocks)
      console.info("🔶 mocked OTP email:", email);
      console.info("🔗 Magic link:", confirmUrl);

      // Write to fixtures for programmatic access
      await writeEmail(email);

      // Email OTP response
      return HttpResponse.json({
        // For email OTP, the response is typically empty with no error
      });
    } else if (body.phone) {
      // Phone OTP response
      return HttpResponse.json({
        message_id: "mock-message-id-123456",
      });
    } else {
      // Invalid request
      return HttpResponse.json(
        { message: "You must provide either an email or phone number." },
        { status: 400 },
      );
    }
  },
);

// supabase.auth.verifyOtp

const tokenHashDataSchema = z.object({
  email: z.string(),
  id: z.string().optional(),
});

type TokenHashData = z.infer<typeof tokenHashDataSchema>;

export function parseTokenHashData(input: string): TokenHashData {
  return tokenHashDataSchema.parse(JSON.parse(input));
}

export function stringifyTokenHashData(data: TokenHashData): string {
  return JSON.stringify(data);
}

const verifyOtpMock = http.post(
  `${process.env.VITE_SUPABASE_URL}/auth/v1/verify`,
  async ({ request }) => {
    const body = (await request.json()) as Record<string, string>;

    // Check for invalid cases
    if (body.token_hash === "invalid_token_hash") {
      return HttpResponse.json(
        {
          error: "Invalid OTP",
          message: "Invalid token_hash provided.",
        },
        { status: 401 },
      );
    }

    if (body.type === "email" && !body.token_hash) {
      return HttpResponse.json(
        {
          error: "Invalid parameters",
          message: "Missing token_hash parameter.",
        },
        { status: 400 },
      );
    }

    // The token_hash in tests is the email and the supabase user id stringified.
    const isValid = typeof body.token_hash === "string";

    if (!isValid) {
      return HttpResponse.json(
        {
          error: "Invalid OTP",
          message: "Invalid verification parameters.",
        },
        { status: 401 },
      );
    }

    const { email, id } = parseTokenHashData(body.token_hash!);

    // Create a user with the provided email or phone.
    const mockUser = createPopulatedSupabaseUser({ email, id });

    // Create a session with the user.
    const mockSession = createPopulatedSupabaseSession({ user: mockUser });
    await setMockSession(mockSession.access_token, mockSession);

    // Return session data at the root level.
    return HttpResponse.json(mockSession);
  },
);

// supabase.auth.exchangeCodeForSession

const authCodeDataSchema = z.object({
  email: z.string(),
  id: z.string().optional(),
  provider: z.string(),
});

type AuthCodeData = z.infer<typeof authCodeDataSchema>;

export function parseAuthCodeData(input: string): AuthCodeData {
  return authCodeDataSchema.parse(JSON.parse(input));
}

export function stringifyAuthCodeData(data: AuthCodeData): string {
  return JSON.stringify(data);
}

const exchangeCodeForSessionMock = http.post(
  `${process.env.VITE_SUPABASE_URL}/auth/v1/token`,
  async ({ request }) => {
    // Access query parameters dynamically
    const url = new URL(request.url);
    const grantType = url.searchParams.get("grant_type");
    const body = (await request.json()) as Record<string, string>;

    // Handle PKCE flow (OAuth callback)
    if (grantType === "pkce") {
      const { auth_code, code_verifier } = body;

      // Validate the request.
      if (!auth_code) {
        return HttpResponse.json(
          { error: "Invalid code", message: "code is required" },
          { status: 400 },
        );
      }

      if (!code_verifier) {
        return HttpResponse.json(
          {
            error: "Invalid code_verifier",
            message: "code_verifier is required",
          },
          { status: 400 },
        );
      }

      // Create a mock user with an email based on the provider.
      const { email, id } = parseAuthCodeData(auth_code);
      const mockUser = createPopulatedSupabaseUser({ email, id });

      // Create a session with the user.
      const mockSession = createPopulatedSupabaseSession({ user: mockUser });
      await setMockSession(mockSession.access_token, mockSession);

      // Return the session data in the format expected by _sessionResponse.
      return HttpResponse.json({
        access_token: mockSession.access_token,
        expires_at: mockSession.expires_at,
        expires_in: mockSession.expires_in,
        refresh_token: mockSession.refresh_token,
        token_type: mockSession.token_type,
        user: mockUser,
      });
    }

    // Handle refresh token flow (session refresh)
    if (grantType === "refresh_token") {
      const { refresh_token } = body;

      if (!refresh_token) {
        return HttpResponse.json(
          { error: "Invalid request", message: "refresh_token required" },
          { status: 400 },
        );
      }

      // In a real scenario, we'd look up the user by refresh token
      // For mocks, we'll create a fresh session with a new user
      // This is sufficient for development testing
      const mockUser = createPopulatedSupabaseUser();
      const mockSession = createPopulatedSupabaseSession({
        refresh_token,
        user: mockUser,
      });
      await setMockSession(mockSession.access_token, mockSession);

      return HttpResponse.json({
        access_token: mockSession.access_token,
        expires_at: mockSession.expires_at,
        expires_in: mockSession.expires_in,
        refresh_token: mockSession.refresh_token,
        token_type: mockSession.token_type,
        user: mockUser,
      });
    }

    // Unknown grant type
    return HttpResponse.json(
      {
        error: "Invalid grant_type",
        message: 'grant_type must be "pkce" or "refresh_token"',
      },
      { status: 400 },
    );
  },
);

// supabase.auth.logout

const logoutMock = http.post(
  `${process.env.VITE_SUPABASE_URL}/auth/v1/logout`,
  async ({ request }) => {
    // Check for the presence of an Authorization header
    const authHeader = request.headers.get("Authorization");

    // If no Authorization header or it doesn't start with 'Bearer ', return unauthenticated response
    if (!authHeader?.startsWith("Bearer ")) {
      return HttpResponse.json(
        { message: "JWT token is missing" },
        { status: 401 },
      );
    }

    const accessToken = authHeader.split(" ")[1];

    if (!accessToken) {
      return HttpResponse.json(
        { message: "JWT token is missing" },
        { status: 401 },
      );
    }

    // Remove the session from the mockSessions map.
    await deleteMockSession(accessToken);

    // Return successful logout response
    return HttpResponse.json(undefined, { status: 204 });
  },
);

// supabase.auth.admin.deleteUser

const deleteUserMock = http.delete(
  `${process.env.VITE_SUPABASE_URL}/auth/v1/admin/users/:id`,
  async ({ request, params }) => {
    // Check for the presence of an Authorization header
    const authHeader = request.headers.get("Authorization");

    // If no Authorization header or it doesn't start with 'Bearer ', return unauthenticated response
    if (!authHeader?.startsWith("Bearer ")) {
      return HttpResponse.json(
        { message: "JWT token is missing" },
        { status: 401 },
      );
    }

    // Get the user ID from the URL params
    const { id } = params;

    if (!id) {
      return HttpResponse.json(
        { message: "User ID is required" },
        { status: 400 },
      );
    }

    // Parse the request body to get the soft delete flag
    const body = (await request.json()) as { should_soft_delete?: boolean };

    // Return a successful response with a mock user
    return HttpResponse.json({
      user: {
        deleted_at: new Date().toISOString(),
        id,
        soft_delete: body.should_soft_delete ?? false,
      },
    });
  },
);

export const supabaseAuthHandlers: RequestHandler[] = [
  getUserMock,
  signInWithOtpMock,
  verifyOtpMock,
  exchangeCodeForSessionMock,
  logoutMock,
  deleteUserMock,
];
