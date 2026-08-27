import type {
  Organization,
  OrganizationEmailInviteLink,
  OrganizationMembershipRole,
  UserAccount,
} from "~/generated/client";
import { Prisma } from "~/generated/client";
import { prisma } from "~/utils/database.server";
import { emailAddressesMatch } from "~/utils/normalize-email-address";

/**
 * Raised when an email invite can no longer be consumed. Callers must treat
 * this like any other invalid invite and not disclose whether it existed.
 */
export class EmailInviteLinkNotConsumableError extends Error {
  constructor() {
    super("Email invite link is inactive, expired, or missing.");
    this.name = "EmailInviteLinkNotConsumableError";
  }
}

/**
 * Raised when the authenticated identity does not own the invite's current
 * email address. Throwing rolls the invite claim back.
 */
export class EmailInviteLinkEmailMismatchError extends Error {
  constructor() {
    super("Verified email does not match the email invite link.");
    this.name = "EmailInviteLinkEmailMismatchError";
  }
}

/** Raised when accepting an invite would exceed the organization's seat cap. */
export class EmailInviteLinkOrganizationFullError extends Error {
  constructor() {
    super("Organization has no available seats.");
    this.name = "EmailInviteLinkOrganizationFullError";
  }
}

type EmailInviteOrganizationSummary = Pick<
  Organization,
  "id" | "name" | "slug"
>;

type EmailInviteSeatAdjustment = {
  newQuantity: number;
  subscriptionId: string;
  subscriptionItemId: string;
};

export type ConsumeEmailInviteLinkResult =
  | {
      organization: EmailInviteOrganizationSummary;
      outcome: "accepted";
      role: OrganizationMembershipRole;
      seatAdjustment?: EmailInviteSeatAdjustment;
    }
  | {
      organization: EmailInviteOrganizationSummary;
      outcome: "alreadyMember";
    };

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
 * Claims an active email invite and creates its membership in one transaction.
 *
 * The claim returns the invite's current email, organization, and role while
 * the row is locked. Email binding, membership creation, the seat-limit check,
 * and notification setup therefore use only values derived inside the claim
 * transaction. Any validation or write failure rolls the claim back.
 */
export async function consumeEmailInviteLinkAndAddMemberToOrganizationInDatabase({
  emailInviteToken,
  userAccountId,
  verifiedUserEmail,
}: {
  emailInviteToken: OrganizationEmailInviteLink["token"];
  userAccountId: UserAccount["id"];
  verifiedUserEmail: string | undefined;
}): Promise<ConsumeEmailInviteLinkResult> {
  const now = new Date();

  try {
    return await prisma.$transaction(async (transaction) => {
      const claimedInvite =
        await transaction.organizationEmailInviteLink.update({
          data: { deactivatedAt: now },
          select: {
            email: true,
            organization: {
              select: {
                _count: {
                  select: {
                    memberships: {
                      where: {
                        OR: [
                          { deactivatedAt: null },
                          { deactivatedAt: { gt: now } },
                        ],
                      },
                    },
                  },
                },
                id: true,
                name: true,
                slug: true,
                stripeSubscriptions: {
                  orderBy: { created: "desc" },
                  select: {
                    items: {
                      select: {
                        price: {
                          select: {
                            product: { select: { maxSeats: true } },
                          },
                        },
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
            },
            role: true,
          },
          where: {
            deactivatedAt: null,
            expiresAt: { gt: now },
            token: emailInviteToken,
          },
        });

      if (
        !verifiedUserEmail ||
        !emailAddressesMatch(verifiedUserEmail, claimedInvite.email)
      ) {
        throw new EmailInviteLinkEmailMismatchError();
      }

      const organization = {
        id: claimedInvite.organization.id,
        name: claimedInvite.organization.name,
        slug: claimedInvite.organization.slug,
      };
      const { count: membershipsCreated } =
        await transaction.organizationMembership.createMany({
          data: [
            {
              memberId: userAccountId,
              organizationId: organization.id,
              role: claimedInvite.role,
            },
          ],
          skipDuplicates: true,
        });

      if (membershipsCreated === 0) {
        return { organization, outcome: "alreadyMember" };
      }

      const subscription = claimedInvite.organization.stripeSubscriptions[0];
      const subscriptionItem = subscription?.items[0];

      if (subscription) {
        const maxSeats = subscriptionItem?.price.product.maxSeats ?? 25;

        if (claimedInvite.organization._count.memberships >= maxSeats) {
          throw new EmailInviteLinkOrganizationFullError();
        }
      }

      // A panel can survive a deactivated membership, so upsert it when the
      // user rejoins instead of failing the transaction on its unique key.
      await transaction.notificationPanel.upsert({
        create: {
          organizationId: organization.id,
          userId: userAccountId,
        },
        update: {},
        where: {
          userId_organizationId: {
            organizationId: organization.id,
            userId: userAccountId,
          },
        },
      });

      const seatAdjustment =
        subscription && subscription.status !== "canceled" && subscriptionItem
          ? {
              newQuantity: claimedInvite.organization._count.memberships + 1,
              subscriptionId: subscription.stripeId,
              subscriptionItemId: subscriptionItem.stripeId,
            }
          : undefined;

      return {
        organization,
        outcome: "accepted",
        role: claimedInvite.role,
        ...(seatAdjustment ? { seatAdjustment } : {}),
      };
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new EmailInviteLinkNotConsumableError();
    }

    throw error;
  }
}
