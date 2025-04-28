import type { StripePrice } from '@prisma/client';

import { prisma } from '~/utils/database.server';

/**
 * Deletes a Stripe price from the database by its Stripe ID.
 *
 * @param stripeId - The Stripe ID of the price to delete.
 * @returns The deleted price.
 */
export async function deleteStripePriceFromDatabaseById(
  stripeId: StripePrice['stripeId'],
) {
  return prisma.stripePrice.delete({ where: { stripeId } });
}
