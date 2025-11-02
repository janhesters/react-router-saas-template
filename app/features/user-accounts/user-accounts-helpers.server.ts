import type { UserAccount } from "@prisma/client";
import type { RouterContextProvider } from "react-router";

import { logout } from "../user-authentication/user-authentication-helpers.server";
import { authContext } from "../user-authentication/user-authentication-middleware.server";
import {
  retrieveUserAccountFromDatabaseBySupabaseUserId,
  retrieveUserAccountWithMembershipsAndMemberCountsAndSubscriptionsFromDatabaseBySupabaseUserId,
  retrieveUserAccountWithMembershipsAndMemberCountsFromDatabaseBySupabaseUserId,
} from "./user-accounts-model.server";

/**
 * Ensures that a user account is present.
 *
 * @param userAccount - The user account to check - possibly null or undefined.
 * @returns The same user account if it exists.
 * @throws Logs the user out if the user account is missing.
 */
export const throwIfUserAccountIsMissing = async <T extends UserAccount>(
  request: Request,
  userAccount: T | null,
) => {
  if (!userAccount) {
    throw await logout(request, "/login");
  }

  return userAccount;
};

/**
 * Ensures that a user account for the authenticated user exists.
 *
 * @param context - Router context provider containing authentication data.
 * @param request - Request object used for logout if user account is missing.
 * @returns The user account and authentication headers.
 * @throws Logs the user out if the user account is missing.
 */
export const requireAuthenticatedUserExists = async ({
  context,
  request,
}: {
  context: Readonly<RouterContextProvider>;
  request: Request;
}) => {
  const {
    user: { id },
    headers,
  } = context.get(authContext);
  const user = await retrieveUserAccountFromDatabaseBySupabaseUserId(id);
  return { headers, user: await throwIfUserAccountIsMissing(request, user) };
};

/**
 * Ensures that a user account for the authenticated user exists and also
 * returns their memberships.
 *
 * IMPORTANT: This function does not check if the user is an active member of
 * the current slug in the URL! For that use `requireUserIsMemberOfOrganization`
 * instead.
 *
 * @param context - Router context provider containing authentication data.
 * @param request - Request object used for logout if user account is missing.
 * @returns The user account with memberships, authentication headers, and supabase client.
 * @throws Logs the user out if the user account is missing.
 */
export const requireAuthenticatedUserWithMembershipsExists = async ({
  context,
  request,
}: {
  context: Readonly<RouterContextProvider>;
  request: Request;
}) => {
  const {
    user: { id },
    headers,
    supabase,
  } = context.get(authContext);
  const user =
    await retrieveUserAccountWithMembershipsAndMemberCountsFromDatabaseBySupabaseUserId(
      id,
    );
  return {
    headers,
    supabase,
    user: await throwIfUserAccountIsMissing(request, user),
  };
};

/**
 * Ensures that a user account for the authenticated user exists and also
 * returns their memberships and subscriptions.
 *
 * IMPORTANT: This function does not check if the user is an active member of
 * the current slug in the URL! For that use `requireUserIsMemberOfOrganization`
 * instead.
 *
 * @param context - Router context provider containing authentication data.
 * @param request - Request object used for logout if user account is missing.
 * @returns The user account with memberships and subscriptions, authentication headers, and supabase client.
 * @throws Logs the user out if the user account is missing.
 */
export const requireAuthenticatedUserWithMembershipsAndSubscriptionsExists =
  async ({
    context,
    request,
  }: {
    context: Readonly<RouterContextProvider>;
    request: Request;
  }) => {
    const {
      user: { id },
      headers,
      supabase,
    } = context.get(authContext);
    const user =
      await retrieveUserAccountWithMembershipsAndMemberCountsAndSubscriptionsFromDatabaseBySupabaseUserId(
        id,
      );
    return {
      headers,
      supabase,
      user: await throwIfUserAccountIsMissing(request, user),
    };
  };

/**
 * Ensures that a user account for the provided supabase user id exists.
 *
 * @param request - The incoming request object.
 * @param id - The supabase user id.
 * @returns The user account.
 */
export async function requireSupabaseUserExists(request: Request, id: string) {
  const user = await retrieveUserAccountFromDatabaseBySupabaseUserId(id);
  return await throwIfUserAccountIsMissing(request, user);
}
