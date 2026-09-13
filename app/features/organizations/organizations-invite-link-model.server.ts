import type {
  Organization,
  OrganizationInviteLink,
  Prisma,
  UserAccount,
} from "~/generated/client";
import { prisma } from "~/utils/database.server";

/** Raised when joining through a reusable link would exceed the seat cap. */
export class InviteLinkOrganizationFullError extends Error {
  constructor() {
    super("Organization has no available seats.");
    this.name = "InviteLinkOrganizationFullError";
  }
}

export type JoinOrganizationWithInviteLinkResult =
  | { outcome: "alreadyMember" }
  | {
      outcome: "accepted";
      seatAdjustment?: {
        newQuantity: number;
        subscriptionId: string;
        subscriptionItemId: string;
      };
    };

/**
 * Creates a membership, notification panel, and reusable-link history together.
 * Existing members return before capacity checks or writes. A concurrent join
 * is recognized by the insert count, without relying on database error text.
 */
export async function joinOrganizationWithInviteLinkInDatabase({
  inviteLinkId,
  organizationId,
  userAccountId,
}: {
  inviteLinkId: OrganizationInviteLink["id"];
  organizationId: Organization["id"];
  userAccountId: UserAccount["id"];
}): Promise<JoinOrganizationWithInviteLinkResult> {
  return prisma.$transaction(async (transaction) => {
    const membership = await transaction.organizationMembership.findUnique({
      where: {
        memberId_organizationId: { memberId: userAccountId, organizationId },
      },
    });
    if (membership) {
      return { outcome: "alreadyMember" };
    }

    const { count } = await transaction.organizationMembership.createMany({
      data: [{ memberId: userAccountId, organizationId, role: "member" }],
      skipDuplicates: true,
    });
    if (count === 0) {
      return { outcome: "alreadyMember" };
    }

    const organization = await transaction.organization.findUniqueOrThrow({
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
        stripeSubscriptions: {
          orderBy: { created: "desc" },
          select: {
            items: {
              select: {
                price: { select: { product: { select: { maxSeats: true } } } },
                stripeId: true,
              },
              take: 1,
            },
            status: true,
            stripeId: true,
          },
          take: 1,
        },
      },
      where: { id: organizationId },
    });
    const subscription = organization.stripeSubscriptions[0];
    const subscriptionItem = subscription?.items[0];

    // The transaction's count includes the new membership. Throwing rolls it
    // back when the organization has no room for this member.
    if (
      subscription &&
      organization._count.memberships >
        (subscriptionItem?.price.product.maxSeats ?? 25)
    ) {
      throw new InviteLinkOrganizationFullError();
    }

    await transaction.notificationPanel.upsert({
      create: { organizationId, userId: userAccountId },
      update: {},
      where: {
        userId_organizationId: { organizationId, userId: userAccountId },
      },
    });
    await transaction.inviteLinkUse.upsert({
      create: { inviteLinkId, userId: userAccountId },
      update: {},
      where: { inviteLinkId_userId: { inviteLinkId, userId: userAccountId } },
    });

    return {
      outcome: "accepted",
      ...(subscription && subscription.status !== "canceled" && subscriptionItem
        ? {
            seatAdjustment: {
              newQuantity: organization._count.memberships,
              subscriptionId: subscription.stripeId,
              subscriptionItemId: subscriptionItem.stripeId,
            },
          }
        : {}),
    };
  });
}

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
  id: OrganizationInviteLink["id"],
) {
  return prisma.organizationInviteLink.findUnique({ where: { id } });
}

/**
 * Retrieves an active organization invite link from the database based on
 * its id.
 *
 * @param id - The id of the organization invite link to get.
 * @returns The organization invite link with a given id or null if it
 * wasn't found or its deactivated or expired.
 */
export async function retrieveActiveOrganizationInviteLinkFromDatabaseByToken(
  token: OrganizationInviteLink["token"],
) {
  return prisma.organizationInviteLink.findUnique({
    include: {
      creator: { select: { id: true, name: true } },
      organization: { select: { id: true, name: true, slug: true } },
    },
    where: { deactivatedAt: null, expiresAt: { gt: new Date() }, token },
  });
}

/**
 * Retrieves an active organization invite link and its associated creator and
 * organization from the database based on the token.
 *
 * @param token - The token of the OrganizationInviteLink to retrieve.
 * @returns An object containing the invite link id, creator details, expiration
 * date, and organization details, or null if no active link was found.
 */
export async function retrieveCreatorAndOrganizationForActiveLinkFromDatabaseByToken(
  token: OrganizationInviteLink["token"],
) {
  return prisma.organizationInviteLink.findUnique({
    select: {
      creator: { select: { id: true, name: true } },
      expiresAt: true,
      id: true,
      organization: { select: { id: true, name: true } },
    },
    where: { deactivatedAt: null, expiresAt: { gt: new Date() }, token },
  });
}

/**
 * Retrieves the latest active invite link for an organization.
 *
 * @param organizationId - The id of the organization to retrieve the invite
 * link for.
 * @returns The latest active invite link or null if not found.
 */
export async function retrieveLatestInviteLinkFromDatabaseByOrganizationId(
  organizationId: OrganizationInviteLink["organizationId"],
) {
  return prisma.organizationInviteLink.findFirst({
    orderBy: { createdAt: "desc" },
    take: 1,
    where: {
      deactivatedAt: null,
      expiresAt: { gt: new Date() },
      organizationId,
    },
  });
}

/**
 * Retrieves an active OrganizationInviteLink record from the database based on
 * its token.
 *
 * @param token - The token of the OrganizationInviteLink to get.
 * @returns The OrganizationInviteLink with a given token or null if it wasn't
 * found or its deactivated or expired.
 */
export async function retrieveActiveInviteLinkFromDatabaseByToken(
  token: OrganizationInviteLink["token"],
) {
  const now = new Date();
  return prisma.organizationInviteLink.findFirst({
    select: {
      creator: { select: { id: true, name: true } },
      deactivatedAt: true,
      expiresAt: true,
      id: true,
      organization: { select: { id: true, name: true, slug: true } },
      token: true,
    },
    where: { deactivatedAt: null, expiresAt: { gt: now }, token },
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
  id: OrganizationInviteLink["id"];
  organizationInviteLink: Prisma.OrganizationInviteLinkUpdateInput;
}) {
  return prisma.organizationInviteLink.update({
    data: organizationInviteLink,
    where: { id },
  });
}
