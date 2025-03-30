import type { Organization, Prisma, UserAccount } from '@prisma/client';

import { prisma } from '~/utils/database.server';

/* READ */

/**
 * Retrieves an organization membership by user ID and organization ID.
 *
 * @param userId - The ID of the user.
 * @param organizationId - The ID of the organization.
 * @returns The organization membership or null if not found.
 */
export async function retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId({
  userId,
  organizationId,
}: {
  userId: UserAccount['id'];
  organizationId: Organization['id'];
}) {
  return prisma.organizationMembership.findUnique({
    where: {
      memberId_organizationId: { memberId: userId, organizationId },
    },
  });
}

/* UPDATE */

/**
 * Updates a specific organization membership.
 *
 * @param userId - The ID of the user (member) whose membership is being updated.
 * @param organizationId - The ID of the organization.
 * @param data - The data to update the membership with (e.g., role, deactivatedAt).
 * @returns The updated organization membership.
 */
export async function updateOrganizationMembershipInDatabase({
  userId,
  organizationId,
  data,
}: {
  userId: UserAccount['id'];
  organizationId: Organization['id'];
  data: Prisma.OrganizationMembershipUpdateInput; // Use Prisma type for flexibility
}) {
  return prisma.organizationMembership.update({
    where: { memberId_organizationId: { memberId: userId, organizationId } },
    data,
  });
}
