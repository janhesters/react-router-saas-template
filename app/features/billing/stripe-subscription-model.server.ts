import type { Organization } from '@prisma/client';

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
