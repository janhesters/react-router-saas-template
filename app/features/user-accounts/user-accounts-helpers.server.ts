import type { UserAccount } from '@prisma/client';

import { logout } from '../user-authentication/user-authentication-helpers.server';

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
    throw await logout(request, '/login');
  }

  return userAccount;
};
