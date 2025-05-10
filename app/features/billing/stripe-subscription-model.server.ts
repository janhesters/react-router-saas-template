import type { Organization } from '@prisma/client';
import type Stripe from 'stripe';

import { prisma } from '~/utils/database.server';

/* CREATE */

/**
 * Creates a new Stripe subscription and its items in our database.
 * Expects organizationId and purchasedById in subscription.metadata.
 *
 * @param stripeSubscription - Stripe.Subscription with metadata: organizationId, purchasedById.
 * @returns The created StripeSubscription record.
 */
export async function createStripeSubscriptionInDatabase(
  stripeSubscription: Stripe.Subscription,
) {
  const { metadata } = stripeSubscription;
  const organizationId = metadata.organizationId;
  const purchasedById = metadata.purchasedById;

  return prisma.stripeSubscription.create({
    data: {
      stripeId: stripeSubscription.id,
      organization: { connect: { id: organizationId } },
      purchasedBy: { connect: { id: purchasedById } },
      created: new Date(stripeSubscription.created * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      status: stripeSubscription.status,
      items: {
        create: stripeSubscription.items.data.map(item => ({
          stripeId: item.id,
          currentPeriodStart: new Date(item.current_period_start * 1000),
          currentPeriodEnd: new Date(item.current_period_end * 1000),
          price: { connect: { stripeId: item.price.id } },
        })),
      },
    },
  });
}

/* READ */

/**
 * Retrieves the latest Stripe subscription for an organization, regardless of
 * status.
 * Orders by creation date to ensure we get the most recent subscription.
 *
 * @param organizationId - The ID of the organization to retrieve the
 * subscription for
 * @returns The most recent Stripe subscription for the organization,
 * including subscription items and prices. Returns null if no subscription
 * exists.
 */
export async function retrieveLatestStripeSubscriptionByOrganizationId(
  organizationId: Organization['id'],
) {
  return await prisma.stripeSubscription.findFirst({
    where: { organizationId },
    orderBy: { created: 'desc' },
    include: {
      items: { include: { price: true } },
      schedules: { include: { phases: { include: { price: true } } } },
    },
  });
}

/* UPDATE */

/**
 * Updates an existing Stripe subscription and its items in our database.
 * Expects organizationId and purchasedById in subscription.metadata.
 *
 * @param stripeSubscription - Stripe.Subscription with metadata: organizationId, purchasedById.
 * @returns The updated StripeSubscription record.
 */
export async function updateStripeSubscriptionInDatabase(
  stripeSubscription: Stripe.Subscription,
) {
  const { metadata } = stripeSubscription;
  const purchasedById = metadata.purchasedById;

  return prisma.stripeSubscription.update({
    where: { stripeId: stripeSubscription.id },
    data: {
      purchasedBy: { connect: { id: purchasedById } },
      created: new Date(stripeSubscription.created * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      status: stripeSubscription.status,
      items: {
        deleteMany: {},
        create: stripeSubscription.items.data.map(item => ({
          stripeId: item.id,
          currentPeriodStart: new Date(item.current_period_start * 1000),
          currentPeriodEnd: new Date(item.current_period_end * 1000),
          price: { connect: { stripeId: item.price.id } },
        })),
      },
    },
  });
}

/* DELETE */

// No delete operations currently implemented
