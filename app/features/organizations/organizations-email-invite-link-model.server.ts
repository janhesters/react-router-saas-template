import type {
  Organization,
  OrganizationEmailInviteLink,
  Prisma,
} from "~/generated/client";
import { prisma } from "~/utils/database.server";

/**
 * Raised when an email invite can no longer be consumed. Callers must treat
 * this like any other invalid invite and not disclose whether it existed.
 */
export class EmailInviteLinkNotConsumableError extends Error {
  constructor(emailInviteLinkId: OrganizationEmailInviteLink["id"]) {
    super(
      `Email invite link ${emailInviteLinkId} is inactive, expired, or missing.`,
    );
    this.name = "EmailInviteLinkNotConsumableError";
  }
}

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
 * Retrieves an organization email invite link from the database by its ID.
 *
 * @param id - The ID of the email invite link to retrieve.
 * @returns The email invite link or null if not found.
 */
export async function retrieveEmailInviteLinkFromDatabaseById(
  id: OrganizationEmailInviteLink["id"],
) {
  return prisma.organizationEmailInviteLink.findUnique({
    where: { id },
  });
}

/**
 * Retrieves an active organization email invite link from the database based on
 * its token.
 *
 * @param token - The token of the email invite link to get.
 * @returns The email invite link with a given token or null if it wasn't found
 * or has expired.
 */
export async function retrieveActiveEmailInviteLinkFromDatabaseByToken(
  token: OrganizationEmailInviteLink["token"],
) {
  const now = new Date();
  return prisma.organizationEmailInviteLink.findUnique({
    include: {
      invitedBy: { select: { id: true, name: true } },
      organization: { select: { id: true, name: true, slug: true } },
    },
    where: { deactivatedAt: null, expiresAt: { gt: now }, token },
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
  organizationId: Organization["id"],
) {
  const now = new Date();
  return prisma.organizationEmailInviteLink.findMany({
    include: { invitedBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    where: { deactivatedAt: null, expiresAt: { gt: now }, organizationId },
  });
}

/* UPDATE */

/**
 * Updates an email invite link in the database.
 *
 * @param id - The id of the email invite link to update.
 * @param emailInviteLink - The email invite link to update.
 * @returns The updated email invite link.
 */
export async function updateEmailInviteLinkInDatabaseById({
  id,
  emailInviteLink,
}: {
  id: OrganizationEmailInviteLink["id"];
  emailInviteLink: Prisma.OrganizationEmailInviteLinkUncheckedUpdateInput;
}) {
  return prisma.organizationEmailInviteLink.update({
    data: emailInviteLink,
    where: { id },
  });
}

/**
 * Consumes an email invite only while it is active and unexpired.
 *
 * The conditional update is the exclusive claim: concurrent consumers cannot
 * both change the same active invite.
 */
export async function consumeEmailInviteLinkInDatabaseById(
  id: OrganizationEmailInviteLink["id"],
) {
  const now = new Date();
  const { count } = await prisma.organizationEmailInviteLink.updateMany({
    data: { deactivatedAt: now },
    where: { deactivatedAt: null, expiresAt: { gt: now }, id },
  });

  return count === 1;
}

/**
 * Claims an active email invite and creates its membership in one transaction.
 * A failed claim or membership write rolls the entire operation back.
 */
export async function consumeEmailInviteLinkAndAddMemberToOrganizationInDatabase({
  emailInviteLinkId,
  organizationId,
  role,
  userAccountId,
}: {
  emailInviteLinkId: OrganizationEmailInviteLink["id"];
  organizationId: Organization["id"];
  role: OrganizationEmailInviteLink["role"];
  userAccountId: string;
}) {
  const now = new Date();

  return prisma.$transaction(async (transaction) => {
    const { count } = await transaction.organizationEmailInviteLink.updateMany({
      data: { deactivatedAt: now },
      where: {
        deactivatedAt: null,
        expiresAt: { gt: now },
        id: emailInviteLinkId,
      },
    });

    if (count !== 1) {
      throw new EmailInviteLinkNotConsumableError(emailInviteLinkId);
    }

    const membership = await transaction.organizationMembership.createMany({
      data: [{ memberId: userAccountId, organizationId, role }],
      skipDuplicates: true,
    });

    if (membership.count === 1) {
      // A panel can survive a deactivated membership, so upsert it when the
      // user rejoins instead of failing the transaction on its unique key.
      await transaction.notificationPanel.upsert({
        create: {
          organization: { connect: { id: organizationId } },
          user: { connect: { id: userAccountId } },
        },
        update: {},
        where: {
          userId_organizationId: { organizationId, userId: userAccountId },
        },
      });
    }

    return { membershipCreated: membership.count === 1 };
  });
}
