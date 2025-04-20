import { href } from 'react-router';

import { stripeAdmin } from '~/features/billing/stripe-admin.server';

export async function createStripeCustomerPortalSession({
  baseUrl,
  customerId,
  organizationSlug,
}: {
  baseUrl: string;
  customerId: string;
  organizationSlug: string;
}) {
  const session = await stripeAdmin.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}/${href(
      '/organizations/:organizationSlug/settings/billing',
      { organizationSlug },
    )}`,
  });

  return session.url;
}
