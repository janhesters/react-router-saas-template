import type Stripe from "stripe";

import { stripeAdmin } from "~/features/billing/stripe-admin.server";
import { removeImageFromStorage } from "~/utils/storage-helpers.server";

const stripeRequestOptions = { maxNetworkRetries: 1, timeout: 20_000 };

function isMissingStripeResource(error: unknown) {
  return (
    error instanceof Error &&
    "code" in error &&
    error.code === "resource_missing" &&
    "statusCode" in error &&
    error.statusCode === 404
  );
}

async function customerIsDeleted(customerId: string) {
  try {
    const customer = await stripeAdmin.customers.retrieve(
      customerId,
      {},
      stripeRequestOptions,
    );
    return customer.deleted === true;
  } catch (error) {
    if (isMissingStripeResource(error)) return true;
    throw error;
  }
}

const subscriptionIsTerminal = (status: string) =>
  status === "canceled" || status === "incomplete_expired";

const scheduleIsTerminal = (status: string) =>
  status === "canceled" || status === "completed" || status === "released";

async function deleteStripeCustomer(customerId: string) {
  if (await customerIsDeleted(customerId)) return;

  try {
    // Auto-pagination also covers sessions and schedules created long before
    // the latest subscription stored in our database.
    for await (const session of stripeAdmin.checkout.sessions.list(
      {
        customer: customerId,
        limit: 100,
        status: "open",
      },
      stripeRequestOptions,
    )) {
      try {
        await stripeAdmin.checkout.sessions.expire(
          session.id,
          {},
          stripeRequestOptions,
        );
      } catch (error) {
        if (isMissingStripeResource(error)) continue;
        const current = await stripeAdmin.checkout.sessions.retrieve(
          session.id,
          {},
          stripeRequestOptions,
        );
        if (current.status === "open") throw error;
      }
    }

    for await (const schedule of stripeAdmin.subscriptionSchedules.list(
      {
        customer: customerId,
        limit: 100,
      },
      stripeRequestOptions,
    )) {
      if (scheduleIsTerminal(schedule.status)) continue;
      try {
        await stripeAdmin.subscriptionSchedules.cancel(
          schedule.id,
          {
            invoice_now: false,
            prorate: false,
          },
          stripeRequestOptions,
        );
      } catch (error) {
        if (isMissingStripeResource(error)) continue;
        const current = await stripeAdmin.subscriptionSchedules.retrieve(
          schedule.id,
          {},
          stripeRequestOptions,
        );
        if (!scheduleIsTerminal(current.status)) throw error;
      }
    }

    for await (const subscription of stripeAdmin.subscriptions.list(
      {
        customer: customerId,
        limit: 100,
        status: "all",
      },
      stripeRequestOptions,
    )) {
      if (subscriptionIsTerminal(subscription.status)) continue;
      try {
        await stripeAdmin.subscriptions.cancel(
          subscription.id,
          {
            invoice_now: false,
            prorate: false,
          },
          stripeRequestOptions,
        );
      } catch (error) {
        if (isMissingStripeResource(error)) continue;
        const current = await stripeAdmin.subscriptions.retrieve(
          subscription.id,
          {},
          stripeRequestOptions,
        );
        if (!subscriptionIsTerminal(current.status)) throw error;
      }
    }

    // Removing the dedicated customer also prevents existing billing portal
    // sessions from creating or resuming subscriptions after this sweep.
    const deleted = await stripeAdmin.customers.del(
      customerId,
      {},
      stripeRequestOptions,
    );
    if (!deleted.deleted) throw new Error("Stripe did not delete the customer");
  } catch (error) {
    // Another attempt can finish a provider operation before our response is
    // received. Only a confirmed deleted/missing customer makes that safe.
    if (await customerIsDeleted(customerId)) return;
    throw error;
  }
}

export async function cleanupOrganizationDeletionResource({
  kind,
  target,
}: {
  kind: "stripeCustomer" | "stripeSubscription" | "storageObject";
  target: string;
}): Promise<void> {
  if (kind === "stripeSubscription") {
    let subscription: Stripe.Subscription;
    try {
      subscription = await stripeAdmin.subscriptions.retrieve(
        target,
        {},
        stripeRequestOptions,
      );
    } catch (error) {
      if (isMissingStripeResource(error)) return;
      throw error;
    }
    // Older implicit checkouts could create multiple customers. Recover each
    // customer from its snapshotted subscription before deleting that customer.
    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;
    await deleteStripeCustomer(customerId);
    return;
  }
  if (kind === "stripeCustomer") {
    await deleteStripeCustomer(target);
    return;
  }

  const ownedLogo =
    /^app-images\/organization-logos\/([a-z\d_-]{1,128})(?:\.[a-z\d]{1,16}|\/[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}\.[a-z\d]{1,16})$/i.exec(
      target,
    );
  const ownerId = ownedLogo?.[1];
  if (!ownerId) {
    throw new Error("Invalid organization storage target");
  }
  // Preserve images still referenced by another organization or user, including
  // legacy URL aliases. This helper also propagates Supabase error responses.
  await removeImageFromStorage({
    imageUrl: new URL(
      `/storage/v1/object/public/${target}`,
      process.env.VITE_SUPABASE_URL,
    ).href,
    kind: "organization-logo",
    ownerId,
  });
}
