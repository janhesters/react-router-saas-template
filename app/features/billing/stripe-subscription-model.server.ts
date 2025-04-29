import type { Organization } from '@prisma/client';
import type Stripe from 'stripe';

import { prisma } from '~/utils/database.server';

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
    include: { items: { include: { price: true } } },
  });
}

/**
 * Upserts a Stripe subscription and its items into our database.
 * Expects organizationId and purchasedById in subscription.metadata.
 *
 * @param stripeSubscription - Stripe.Subscription with metadata: organizationId, purchasedById.
 * @returns The upserted StripeSubscription record.
 */
export async function upsertStripeSubscriptionForOrganizationInDatabaseById(
  stripeSubscription: Stripe.Subscription,
) {
  const { metadata } = stripeSubscription;
  const organizationId = metadata.organizationId;
  const purchasedById = metadata.purchasedById;

  return prisma.stripeSubscription.upsert({
    where: { stripeId: stripeSubscription.id },
    create: {
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
  });
}
