import type {
  Organization,
  OrganizationEmailInviteLink,
  Prisma,
} from '@prisma/client';

import { prisma } from '~/utils/database.server';

/* CREATE */

/**
 * Saves an organization email invite link to the database.
 *
 * @param emailInviteLink - The email invite link to save.
 * @returns The saved email invite link.
 */
export async function saveOrganizationEmailInviteLinkToDatabase(
  emailInviteLink: Prisma.OrganizationEmailInviteLinkUncheckedCreateInput,
) {
  return prisma.organizationEmailInviteLink.create({ data: emailInviteLink });
}

/* READ */

/**
 * Retrieves an active organization email invite link from the database based on
 * its token.
 *
 * @param token - The token of the email invite link to get.
 * @returns The email invite link with a given token or null if it wasn't found
 * or has expired.
 */
export async function retrieveActiveEmailInviteLinkFromDatabaseByToken(
  token: OrganizationEmailInviteLink['token'],
) {
  const now = new Date();
  return prisma.organizationEmailInviteLink.findFirst({
    where: { token, expiresAt: { gt: now } },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      invitedBy: { select: { id: true, name: true } },
    },
  });
}

/**
 * Retrieves all active email invite links for an organization.
 *
 * @param organizationId - The id of the organization to retrieve the email
 * invite links for.
 * @returns An array of active email invite links for the organization.
 */
export async function retrieveActiveEmailInviteLinksFromDatabaseByOrganizationId(
  organizationId: Organization['id'],
) {
  const now = new Date();
  return prisma.organizationEmailInviteLink.findMany({
    where: { organizationId, expiresAt: { gt: now } },
    orderBy: { createdAt: 'desc' },
    include: { invitedBy: { select: { id: true, name: true } } },
  });
}
