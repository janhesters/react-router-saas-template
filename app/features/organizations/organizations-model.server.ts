import {
  type Organization,
  type OrganizationMembership,
  OrganizationMembershipRole,
  type Prisma,
  type UserAccount,
} from '@prisma/client';

import { prisma } from '~/utils/database.server';

/* CREATE */

/**
 * Saves a new organization to the database.
 *
 * @param organization - Parameters of the organization that should be created.
 * @returns The newly created organization.
 */
export async function saveOrganizationToDatabase(
  organization: Prisma.OrganizationCreateInput,
) {
  return prisma.organization.create({ data: organization });
}

/**
 * Saves a new organization to the database with an owner.
 *
 * @param organization - Parameters of the organization that should be created.
 * @param userId - The id of the user who will be the owner.
 * @returns The newly created organization.
 */
export async function saveOrganizationWithOwnerToDatabase({
  organization,
  userId,
}: {
  organization: Prisma.OrganizationCreateInput;
  userId: UserAccount['id'];
}) {
  return prisma.organization.create({
    data: {
      ...organization,
      memberships: {
        create: { memberId: userId, role: OrganizationMembershipRole.owner },
      },
    },
  });
}

/* READ */

/**
 * Retrieves all organizations where the user has an active membership with
 * their role. Active memberships are those that are either not deactivated or
 * have a deactivation date in the future.
 *
 * @param userId - The id of the user.
 * @returns An array of organizations where the user is an active member,
 * including their role.
 */
export async function retrieveActiveOrganizationsMembershipsFromDatabaseByUserId(
  userId: UserAccount['id'],
) {
  return prisma.organizationMembership.findMany({
    where: {
      memberId: userId,
      // eslint-disable-next-line unicorn/no-null
      OR: [{ deactivatedAt: null }, { deactivatedAt: { gt: new Date() } }],
    },
    select: {
      role: true,
      organization: {
        select: { id: true, name: true, slug: true, imageUrl: true },
      },
    },
  });
}

/**
 * Retrieves an organization by its slug with memberships.
 *
 * @param slug - The slug of the organization to retrieve.
 * @returns The organization with memberships or null if not found.
 */
export async function retrieveOrganizationWithMembershipsFromDatabaseBySlug(
  slug: Organization['slug'],
) {
  return prisma.organization.findUnique({
    where: { slug },
    include: { memberships: { include: { member: true } } },
  });
}

/* UPDATE */

/**
 * Adds members to an organization.
 *
 * @param options - An object with the organization's id, the id of the user who
 * assigned the members and the ids of the members.
 * @returns The updated organization.
 */
export async function addMembersToOrganizationInDatabaseById({
  id,
  members,
  role = OrganizationMembershipRole.member,
}: {
  id: Organization['id'];
  members: UserAccount['id'][];
  role?: OrganizationMembership['role'];
}) {
  return prisma.organization.update({
    where: { id },
    data: {
      memberships: {
        create: members.map(memberId => ({
          member: { connect: { id: memberId } },
          role,
        })),
      },
    },
  });
}

/* DELETE */

/**
 * Deletes an organization from the database.
 *
 * @param id - The id of the organization to delete.
 * @returns The deleted organization.
 */
export async function deleteOrganizationFromDatabaseById(
  id: Organization['id'],
) {
  return prisma.organization.delete({ where: { id } });
}
