import type { Organization, UserAccount } from '@prisma/client';
import { href } from 'react-router';

import { stripeAdmin } from '~/features/billing/stripe-admin.server';

// TODO: check if no email is provided, that the user can NOT enter their own.
export async function createStripeCheckoutSession({
  baseUrl,
  customerEmail,
  customerId,
  organizationId,
  organizationSlug,
  priceId,
  purchasedById,
  seatsUsed,
}: {
  baseUrl: string;
  customerEmail: Organization['billingEmail'];
  customerId: Organization['stripeCustomerId'];
  organizationId: Organization['id'];
  organizationSlug: Organization['slug'];
  priceId: string;
  purchasedById: UserAccount['id'];
  seatsUsed: number;
}) {
  const hasCustomerId = customerId && customerId !== '';

  const session = await stripeAdmin.checkout.sessions.create({
    automatic_tax: { enabled: true },
    billing_address_collection: 'auto',
    cancel_url: `${baseUrl}${href(
      '/organizations/:organizationSlug/settings/billing',
      { organizationSlug },
    )}`,
    customer: hasCustomerId ? customerId : undefined,
    ...(hasCustomerId && {
      customer_update: { address: 'auto', name: 'auto', shipping: 'auto' },
    }),
    line_items: [{ price: priceId, quantity: seatsUsed }],
    metadata: {
      customerEmail,
      organizationId,
      organizationSlug,
      purchasedById,
    },
    mode: 'subscription',
    saved_payment_method_options: {
      payment_method_save: 'enabled',
    },
    subscription_data: {
      metadata: {
        customerEmail,
        organizationId,
        organizationSlug,
        purchasedById,
      },
    },
    success_url: `${baseUrl}${href(
      '/organizations/:organizationSlug/settings/billing/success',
      { organizationSlug },
    )}?session_id={CHECKOUT_SESSION_ID}`,
    // Show check box to allow purchasing as a business.
    tax_id_collection: { enabled: true },
  });

  return session;
}

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
    return_url: `${baseUrl}${href(
      '/organizations/:organizationSlug/settings/billing',
      { organizationSlug },
    )}`,
  });

  return session;
}

export async function createStripeSwitchPlanSession({
  baseUrl,
  customerId,
  organizationSlug,
  subscriptionId,
  subscriptionItemId,
  newPriceId,
  quantity,
}: {
  baseUrl: string;
  customerId: string;
  organizationSlug: Organization['slug'];
  subscriptionId: string;
  subscriptionItemId: string;
  newPriceId: string;
  /**
   * This MUST be the existing quantity of the subscription item, if you
   * want to preserve the quantity. Otherwise, Stripe will default to 1.
   */
  quantity: number;
}) {
  // This will deep-link straight to the “Confirm this update” page
  const session = await stripeAdmin.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}${href(
      '/organizations/:organizationSlug/settings/billing',
      { organizationSlug },
    )}`,
    flow_data: {
      type: 'subscription_update_confirm',
      subscription_update_confirm: {
        subscription: subscriptionId,
        items: [{ id: subscriptionItemId, price: newPriceId, quantity }],
      },
    },
  });

  return session;
}

export async function updateStripeCustomer({
  customerId,
  customerName,
}: {
  customerId: string;
  customerName: string;
}) {
  const customer = await stripeAdmin.customers.update(customerId, {
    name: customerName,
  });

  return customer;
}
