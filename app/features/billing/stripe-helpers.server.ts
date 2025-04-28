import type { Organization, UserAccount } from '@prisma/client';
import { href } from 'react-router';
import type { Stripe } from 'stripe';

import { stripeAdmin } from '~/features/billing/stripe-admin.server';

import { pricesByLookupKey } from './billing-constants';

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

export async function createStripeCustomer({
  billingEmail,
  createdById,
  organizationId,
  organizationName,
}: {
  billingEmail: UserAccount['email'];
  createdById: UserAccount['id'];
  organizationId: Organization['id'];
  organizationName: Organization['name'];
}) {
  const customer = await stripeAdmin.customers.create({
    email: billingEmail,
    metadata: { organizationId, createdById },
    name: organizationName,
  });

  return customer;
}

export async function createStripeTrialSubscription({
  customerId,
  organizationId,
  purchasedById,
}: {
  customerId: Stripe.Customer['id'];
  organizationId: Organization['id'];
  purchasedById: UserAccount['id'];
}) {
  const subscription = await stripeAdmin.subscriptions.create({
    customer: customerId,
    items: [{ price: pricesByLookupKey.businessAnnual.id, quantity: 1 }],
    metadata: { organizationId, purchasedById },
    trial_period_days: 14,
    trial_settings: { end_behavior: { missing_payment_method: 'pause' } },
  });

  return subscription;
}
