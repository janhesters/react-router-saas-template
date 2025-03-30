/* eslint-disable unicorn/no-null */
import type { OrganizationInviteLink, Prisma } from '@prisma/client';

import { prisma } from '~/utils/database.server';

/* CREATE */

/**
 * Saves an organization invite link to the database.
 *
 * @param inviteLink - The invite link to save.
 * @returns The saved invite link.
 */
export async function saveOrganizationInviteLinkToDatabase(
  inviteLink: Prisma.OrganizationInviteLinkUncheckedCreateInput,
) {
  return prisma.organizationInviteLink.create({ data: inviteLink });
}

/* READ */

/**
 * Retrieves an organization invite link from the database by id.
 *
 * @param id - The id of the organization invite link to retrieve.
 * @returns The organization invite link or null if not found.
 */
export async function retrieveOrganizationInviteLinkFromDatabaseById(
  id: OrganizationInviteLink['id'],
) {
  return prisma.organizationInviteLink.findUnique({ where: { id } });
}

/**
 * Retrieves the latest active invite link for an organization.
 *
 * @param organizationId - The id of the organization to retrieve the invite
 * link for.
 * @returns The latest active invite link or null if not found.
 */
export async function retrieveLatestInviteLinkFromDatabaseByOrganizationId(
  organizationId: OrganizationInviteLink['organizationId'],
) {
  return prisma.organizationInviteLink.findFirst({
    where: {
      organizationId,
      expiresAt: { gt: new Date() },
      deactivatedAt: null,
    },
    orderBy: { createdAt: 'desc' },
    take: 1,
  });
}

/* UPDATE */

/**
 * Updates an organization invite link by its id.
 *
 * @param id - The id of the invite link to update.
 * @param organizationInviteLink - The new data for the invite link.
 * @returns The updated invite link.
 */
export async function updateOrganizationInviteLinkInDatabaseById({
  id,
  organizationInviteLink,
}: {
  id: OrganizationInviteLink['id'];
  organizationInviteLink: Prisma.OrganizationInviteLinkUpdateInput;
}) {
  return prisma.organizationInviteLink.update({
    where: { id },
    data: organizationInviteLink,
  });
}
