/* eslint-disable unicorn/no-null */
import type {
  Organization,
  OrganizationMembership,
  Prisma,
  UserAccount,
} from '@prisma/client';
import { OrganizationMembershipRole } from '@prisma/client';
import type Stripe from 'stripe';

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
 * Retrieves an organization by its slug with memberships.
 *
 * @param slug - The slug of the organization to retrieve.
 * @returns The organization with memberships and subscriptions or null if not found.
 */
export async function retrieveOrganizationWithMembershipsAndSubscriptionsFromDatabaseBySlug(
  slug: Organization['slug'],
) {
  return prisma.organization.findUnique({
    where: { slug },
    include: {
      memberships: { include: { member: true } },
      stripeSubscriptions: { include: { items: { include: { price: true } } } },
    },
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

/**
 * Upserts a Stripe subscription (with items and prices) into an organization.
 *
 * @param organizationId - The id of the organization.
 * @param purchasedById - The id of the user who bought the subscription.
 * @param stripeCustomerId - The id of the Stripe customer.
 * @param stripeSubscription - The subscription object from Stripe.
 * @returns The updated organization.
 */
export async function upsertStripeSubscriptionForOrganizationInDatabaseById({
  organizationId,
  purchasedById,
  stripeCustomerId,
  stripeSubscription,
}: {
  organizationId: Organization['id'];
  purchasedById: UserAccount['id'];
  stripeCustomerId: Stripe.Customer['id'];
  stripeSubscription: Stripe.Subscription;
}) {
  return await prisma.organization.update({
    where: { id: organizationId },
    data: {
      stripeCustomerId,
      stripeSubscriptions: {
        upsert: {
          where: { organizationId }, // because StripeSubscription has `organizationId` as `@unique`
          create: {
            stripeId: stripeSubscription.id,
            purchasedById,
            created: new Date(stripeSubscription.created * 1000),
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
            trialEnd: stripeSubscription.trial_end
              ? new Date(stripeSubscription.trial_end * 1000)
              : undefined,
            status: stripeSubscription.status,
            items: {
              create: stripeSubscription.items.data.map(item => ({
                stripeId: item.id,
                currentPeriodStart: new Date(item.current_period_start * 1000),
                currentPeriodEnd: new Date(item.current_period_end * 1000),
                price: {
                  connectOrCreate: {
                    where: { stripeId: item.price.id },
                    create: {
                      stripeId: item.price.id,
                      lookupKey: item.price.lookup_key ?? '',
                      currency: item.price.currency,
                      unitAmount: item.price.unit_amount ?? 0,
                      metadata: item.price.metadata ?? {},
                    },
                  },
                },
              })),
            },
          },
          update: {
            stripeId: stripeSubscription.id,
            purchasedById,
            created: new Date(stripeSubscription.created * 1000),
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
            trialEnd: stripeSubscription.trial_end
              ? new Date(stripeSubscription.trial_end * 1000)
              : undefined,
            status: stripeSubscription.status,
            items: {
              deleteMany: {}, // Delete existing items first (to prevent duplicates)
              create: stripeSubscription.items.data.map(item => ({
                stripeId: item.id,
                currentPeriodStart: new Date(item.current_period_start * 1000),
                currentPeriodEnd: new Date(item.current_period_end * 1000),
                price: {
                  connectOrCreate: {
                    where: { stripeId: item.price.id },
                    create: {
                      stripeId: item.price.id,
                      lookupKey: item.price.lookup_key ?? '',
                      currency: item.price.currency,
                      unitAmount: item.price.unit_amount ?? 0,
                      metadata: item.price.metadata ?? {},
                    },
                  },
                },
              })),
            },
          },
        },
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
