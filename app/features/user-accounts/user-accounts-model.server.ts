import type { Prisma, UserAccount } from "~/generated/client";
import { prisma } from "~/utils/database.server";

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

/**
 * Creates a local account for a Supabase identity, or returns and refreshes the
 * existing account when an authentication callback is replayed.
 */
export async function upsertUserAccountInDatabaseBySupabaseUserId({
  email,
  supabaseUserId,
}: Pick<UserAccount, "email" | "supabaseUserId">) {
  return prisma.$transaction(async (transaction) => {
    // Supabase cleanup is asynchronous. Serialize callbacks with deletion so
    // an identity awaiting provider cleanup cannot recreate its local account.
    await transaction.$queryRaw`
      SELECT 1 FROM pg_advisory_xact_lock(
        hashtextextended(${`account:${supabaseUserId}`}, 0)
      )
    `;
    const deletion = await transaction.accountDeletion.findUnique({
      where: { supabaseUserId },
    });
    if (deletion) {
      throw new Response("This account has been deleted.", { status: 410 });
    }
    return transaction.userAccount.upsert({
      create: { email, supabaseUserId },
      update: { email },
      where: { supabaseUserId },
    });
  });
}

/* READ */

/**
 * Retrieves a user account by its id.
 *
 * @param id The id of the user account.
 * @returns The user account or null.
 */
export async function retrieveUserAccountFromDatabaseById(
  id: UserAccount["id"],
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
  email: UserAccount["email"],
) {
  return prisma.userAccount.findUnique({ where: { email } });
}

/**
 * Retrieve a user account with their active organization memberships by email.
 *
 * @param email The email of the user account.
 * @returns The user account with active memberships or null.
 */
export async function retrieveUserAccountWithActiveMembershipsFromDatabaseByEmail(
  email: UserAccount["email"],
) {
  return prisma.userAccount.findUnique({
    include: {
      memberships: {
        where: {
          OR: [{ deactivatedAt: null }, { deactivatedAt: { gt: new Date() } }],
        },
      },
    },
    where: { email },
  });
}

/**
 * Retrieves a user account by their Supabase ID.
 *
 * @param supabaseUserId The Supabase ID of the user account.
 * @returns The user account or null.
 */
export async function retrieveUserAccountFromDatabaseBySupabaseUserId(
  supabaseUserId: UserAccount["supabaseUserId"],
) {
  return prisma.userAccount.findUnique({ where: { supabaseUserId } });
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
  supabaseUserId: UserAccount["supabaseUserId"],
) {
  return prisma.userAccount.findUnique({
    include: {
      memberships: {
        select: {
          deactivatedAt: true,
          organization: {
            select: {
              _count: {
                select: {
                  memberships: {
                    where: {
                      OR: [
                        { deactivatedAt: null },
                        { deactivatedAt: { gt: new Date() } },
                      ],
                    },
                  },
                },
              },
              billingEmail: true,
              id: true,
              imageUrl: true,
              name: true,
              slug: true,
              stripeCustomerId: true,
              stripeSubscriptions: {
                include: {
                  items: { include: { price: { include: { product: true } } } },
                  schedule: {
                    include: {
                      phases: {
                        include: { price: true },
                        orderBy: { startDate: "asc" },
                      },
                    },
                    where: {
                      currentPhaseEnd: { not: null },
                      currentPhaseStart: { not: null },
                    },
                  },
                },
                orderBy: { created: "desc" },
                take: 1,
              },
              trialEnd: true,
            },
          },
          role: true,
        },
        where: {
          OR: [{ deactivatedAt: null }, { deactivatedAt: { gt: new Date() } }],
        },
      },
    },
    where: { supabaseUserId },
  });
}

/**
 * Retrieves a user account, their active organization memberships, and the count
 * of members in each organization by Supabase ID.
 *
 * @param supabaseUserId The Supabase ID of the user account.
 * @returns The user account with active memberships and member counts or null.
 * Active memberships are those that are either not deactivated or have a
 * deactivation date in the future.
 */
export async function retrieveUserAccountWithMembershipsAndMemberCountsFromDatabaseBySupabaseUserId(
  supabaseUserId: UserAccount["supabaseUserId"],
) {
  return prisma.userAccount.findUnique({
    include: {
      memberships: {
        select: {
          deactivatedAt: true,
          organization: {
            select: {
              // Count active members in the organization
              _count: {
                select: {
                  memberships: {
                    where: {
                      OR: [
                        { deactivatedAt: null },
                        { deactivatedAt: { gt: new Date() } },
                      ],
                    },
                  },
                },
              },
              id: true,
              imageUrl: true,
              name: true,
              slug: true,
            },
          },
          role: true,
        },
        where: {
          OR: [{ deactivatedAt: null }, { deactivatedAt: { gt: new Date() } }],
        },
      },
    },
    where: { supabaseUserId },
  });
}

/**
 * Retrieves a user account, their active organization memberships, and the
 * count of members in each organization by Supabase ID. Also includes the
 * organization's subscription.
 *
 * @param supabaseUserId The Supabase ID of the user account.
 * @returns The user account with active memberships and member counts or null.
 * Active memberships are those that are either not deactivated or have a
 * deactivation date in the future.
 */
export async function retrieveUserAccountWithMembershipsAndMemberCountsAndSubscriptionsFromDatabaseBySupabaseUserId(
  supabaseUserId: UserAccount["supabaseUserId"],
) {
  return prisma.userAccount.findUnique({
    include: {
      memberships: {
        select: {
          deactivatedAt: true,
          organization: {
            select: {
              // Count active members in the organization
              _count: {
                select: {
                  memberships: {
                    where: {
                      OR: [
                        { deactivatedAt: null },
                        { deactivatedAt: { gt: new Date() } },
                      ],
                    },
                  },
                },
              },
              id: true,
              imageUrl: true,
              name: true,
              slug: true,
              stripeSubscriptions: {
                include: {
                  items: { include: { price: true } },
                  schedule: {
                    include: {
                      phases: {
                        include: { price: true },
                        orderBy: { startDate: "asc" },
                      },
                    },
                  },
                },
                orderBy: { created: "desc" },
                take: 1,
              },
            },
          },
          role: true,
        },
        where: {
          OR: [{ deactivatedAt: null }, { deactivatedAt: { gt: new Date() } }],
        },
      },
    },
    where: { supabaseUserId },
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
  expectedImageUrl,
  id,
  user,
}: {
  expectedImageUrl?: UserAccount["imageUrl"];
  id: UserAccount["id"];
  user: Omit<Prisma.UserAccountUpdateInput, "id">;
}) {
  return prisma.userAccount.update({
    data: user,
    where: { id, imageUrl: expectedImageUrl },
  });
}

/* DELETE */

/**
 * Deletes a user account from the database.
 *
 * @param id The id of the user account to delete.
 * @returns The deleted user account.
 */
export async function deleteUserAccountFromDatabaseById(id: UserAccount["id"]) {
  return prisma.userAccount.delete({ where: { id } });
}
