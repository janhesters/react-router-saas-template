import type { Prisma, UserAccount } from '@prisma/client';

import { prisma } from '~/utils/database.server';

/* CREATE */

/**
 * Saves a user account to the database.
 *
 * @param userAccount The user account to save.
 * @returns The saved user account.
 */
export async function saveUserAccountToDatabase(
  userAccount: Prisma.UserAccountCreateInput,
) {
  return prisma.userAccount.create({ data: userAccount });
}

/* READ */

/**
 * Retrieves a user account by its id.
 *
 * @param id The id of the user account.
 * @returns The user account or null.
 */
export async function retrieveUserAccountFromDatabaseById(
  id: UserAccount['id'],
) {
  return prisma.userAccount.findUnique({ where: { id } });
}

/**
 * Retrieves a user account by its email.
 *
 * @param email The email of the user account.
 * @returns The user account or null.
 */
export async function retrieveUserAccountFromDatabaseByEmail(
  email: UserAccount['email'],
) {
  return prisma.userAccount.findUnique({ where: { email } });
}

/**
 * Retrieves a user account and their active organization memberships by
 * Supabase ID.
 *
 * @param supabaseUserId The Supabase ID of the user account.
 * @returns The user account with active memberships or null. Active memberships
 * are those that are either not deactivated or have a deactivation date in the
 * future.
 */
export async function retrieveUserAccountWithMembershipsFromDatabaseBySupabaseUserId(
  supabaseUserId: UserAccount['supabaseUserId'],
) {
  return prisma.userAccount.findUnique({
    where: { supabaseUserId },
    include: {
      memberships: {
        where: {
          // eslint-disable-next-line unicorn/no-null
          OR: [{ deactivatedAt: null }, { deactivatedAt: { gt: new Date() } }],
        },
        select: {
          organization: { select: { id: true, name: true, slug: true } },
          role: true,
          deactivatedAt: true,
        },
      },
    },
  });
}

/* UPDATE */

/**
 * Updates a user account by its id.
 *
 * @param id The id of the user account.
 * @param data The new data for the user account.
 * @returns The updated user account.
 */
export async function updateUserAccountInDatabaseById({
  id,
  user,
}: {
  id: UserAccount['id'];
  user: Omit<Prisma.UserAccountUpdateInput, 'id'>;
}) {
  return prisma.userAccount.update({ where: { id }, data: user });
}

/* DELETE */

/**
 * Deletes a user account from the database.
 *
 * @param id The id of the user account to delete.
 * @returns The deleted user account.
 */
export async function deleteUserAccountFromDatabaseById(id: UserAccount['id']) {
  return prisma.userAccount.delete({ where: { id } });
}
