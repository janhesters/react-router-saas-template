/* eslint-disable unicorn/no-null */
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
 * Retrieves an organization by its id.
 *
 * @param id - The id of the organization to retrieve.
 * @returns The organization or null if not found.
 */
export async function retrieveOrganizationFromDatabaseById(
  id: Organization['id'],
) {
  return prisma.organization.findUnique({ where: { id } });
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

/**
 * Retrieves an organization by its slug with memberships and latest active
 * invite links (both regular and email invites).
 *
 * @param slug - The slug of the organization to retrieve.
 * @returns The organization with memberships and latest active invite links or
 * null if not found.
 */
export async function retrieveOrganizationWithMembersAndLatestInviteLinkFromDatabaseBySlug(
  slug: Organization['slug'],
) {
  const now = new Date();
  return prisma.organization.findUnique({
    where: { slug },
    include: {
      memberships: {
        include: { member: true },
        orderBy: { createdAt: 'desc' },
      },
      organizationInviteLinks: {
        where: { expiresAt: { gt: now }, deactivatedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      organizationEmailInviteLink: {
        where: { expiresAt: { gt: now } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

/* UPDATE */

/**
 * Updates an organization by its slug.
 *
 * @param slug - The slug of the organization to update.
 * @param organization - The new data for the organization.
 * @returns The updated organization.
 */
export async function updateOrganizationInDatabaseBySlug({
  slug,
  organization,
}: {
  slug: Organization['slug'];
  organization: Omit<Prisma.OrganizationUpdateInput, 'id'>;
}) {
  return prisma.organization.update({ where: { slug }, data: organization });
}

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
      // 1) add each member
      memberships: {
        create: members.map(memberId => ({
          member: { connect: { id: memberId } },
          role,
        })),
      },
      // 2) create a NotificationPanel for each new member
      notificationPanels: {
        create: members.map(memberId => ({
          user: { connect: { id: memberId } },
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
