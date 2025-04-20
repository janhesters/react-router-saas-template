import type { Prisma, StripeSubscription } from '@prisma/client';

import { prisma } from '~/utils/database.server';

/**
 * Saves a new Stripe subscription to the database.
 *
 * @param subscription - Parameters of the subscription that should be created
 * @returns The newly created subscription
 */
export async function saveStripeSubscriptionToDatabase(
  subscription: Omit<Prisma.StripeSubscriptionCreateInput, 'id'>,
) {
  return await prisma.stripeSubscription.create({ data: subscription });
}

/**
 * Retrieves a Stripe subscription by its id.
 *
 * @param id - The id of the subscription to retrieve
 * @returns The subscription or null if not found
 */
export async function retrieveStripeSubscriptionFromDatabaseById(
  id: StripeSubscription['id'],
) {
  return await prisma.stripeSubscription.findUnique({ where: { id } });
}
