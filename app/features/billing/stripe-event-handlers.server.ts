import type { Stripe } from "stripe";

import { recordDeletedOrganizationCustomer } from "../organizations/deletion/organization-deletion.server";
import { withOrganizationMutationLock } from "../organizations/deletion/organization-mutation-lock.server";
import { updateOrganizationInDatabaseById } from "../organizations/organizations-model.server";
import { updateStripeCustomer } from "./stripe-helpers.server";
import {
  deleteStripePriceFromDatabaseById,
  saveStripePriceFromAPIToDatabase,
  updateStripePriceFromAPIInDatabase,
} from "./stripe-prices-model.server";
import {
  deleteStripeProductFromDatabaseById,
  saveStripeProductFromAPIToDatabase,
  updateStripeProductFromAPIInDatabase,
} from "./stripe-product-model.server";
import {
  createStripeSubscriptionInDatabase,
  updateStripeSubscriptionFromAPIInDatabase,
} from "./stripe-subscription-model.server";
import {
  saveStripeSubscriptionScheduleFromAPIToDatabase,
  updateStripeSubscriptionScheduleFromAPIInDatabase,
} from "./stripe-subscription-schedule-model.server";
import { stripeAdmin } from "~/features/billing/stripe-admin.server";
import { recordDeletedAccountsSubscription } from "~/features/user-accounts/deletion/account-deletion.server";
import { prisma } from "~/utils/database.server";
import { getErrorMessage } from "~/utils/get-error-message";

const ok = () => Response.json({ message: "OK" });
const retry = () =>
  Response.json({ message: "Webhook processing failed" }, { status: 500 });

async function withOrganizationCustomer({
  organizationId,
  customerId,
  update,
}: {
  organizationId?: string;
  customerId?: string;
  update: () => Promise<unknown>;
}) {
  if (!organizationId || !customerId) {
    await update();
    return;
  }

  await withOrganizationMutationLock(organizationId, async () => {
    // Persist late-created customers before acknowledging the event. Cleanup
    // remains durable even if this delivery arrives after deletion completed.
    if (
      await recordDeletedOrganizationCustomer({ customerId, organizationId })
    ) {
      return;
    }
    // Historical subscriptions can belong to an older customer. Customer
    // association is handled by checkout/customer events, not subscription sync.
    await update();
  });
}

async function saveSubscription(
  subscription: Stripe.Subscription,
  { preserveExisting = false }: { preserveExisting?: boolean } = {},
) {
  const existing = await prisma.stripeSubscription.findUnique({
    where: { stripeId: subscription.id },
  });
  // A replayed creation event must not roll back a later cancellation or plan.
  const saved =
    existing && preserveExisting
      ? existing
      : existing
        ? await updateStripeSubscriptionFromAPIInDatabase(subscription)
        : await createStripeSubscriptionInDatabase(subscription);
  await recordDeletedAccountsSubscription({
    organizationId: saved.organizationId,
    subscriptionId: saved.stripeId,
  });
  return saved;
}

const prettyPrint = (event: Stripe.Event) => {
  console.log(
    `unhandled Stripe event: ${event.type}`,
    process.env.NODE_ENV === "development"
      ? JSON.stringify(event, null, 2)
      : "event not logged in production mode - look it up in the Stripe Dashboard",
  );
};

export const handleStripeChargeDisputeClosedEvent = async (
  event: Stripe.ChargeDisputeClosedEvent,
) => {
  const dispute = event.data.object;

  // only cancel if the dispute was lost (cardholder won)
  if (dispute.status !== "lost") {
    return ok();
  }

  try {
    // normalize dispute.charge → string ID
    const chargeId =
      typeof dispute.charge === "string" ? dispute.charge : dispute.charge.id;

    // fetch the Charge
    const charge = await stripeAdmin.charges.retrieve(chargeId);

    // extract customer ID
    const customerId =
      typeof charge.customer === "string"
        ? charge.customer
        : charge.customer?.id;
    if (!customerId) {
      console.log("No customer associated with charge", charge.id);
      return ok();
    }

    // list active subscriptions for that customer
    const subsList = await stripeAdmin.subscriptions.list({
      customer: customerId,
      limit: 1, // just need one
      status: "active",
    });

    if (subsList.data.length === 0) {
      console.log(`No active subscriptions for customer ${customerId}`);
      return ok();
    }

    // cancel the first one (or adjust logic if you need something more nuanced)
    const cancelled = await stripeAdmin.subscriptions.cancel(
      // biome-ignore lint/style/noNonNullAssertion: The check above ensures that there is a subscription
      subsList.data[0]!.id,
    );

    console.log(
      "Automatically cancelled subscription due to lost dispute:",
      cancelled.id,
    );
  } catch (error) {
    prettyPrint(event);
    console.error(
      "Error cancelling subscription on dispute.closed",
      getErrorMessage(error),
    );
  }

  return ok();
};

export const handleStripeCheckoutSessionCompletedEvent = async (
  event: Stripe.CheckoutSessionCompletedEvent,
) => {
  try {
    const organizationId = event.data.object.metadata?.organizationId;
    if (organizationId) {
      const customer = event.data.object.customer;
      const customerId = typeof customer === "string" ? customer : customer?.id;
      await withOrganizationCustomer({
        customerId,
        organizationId,
        update: async () => {
          const organization = await updateOrganizationInDatabaseById({
            id: organizationId,
            organization: {
              ...(event.data.object.customer_details?.email && {
                billingEmail: event.data.object.customer_details.email,
              }),
              ...(customerId && {
                stripeCustomerId: customerId,
              }),
              // End the trial now.
              trialEnd: new Date(),
            },
          });

          if (customerId) {
            await updateStripeCustomer({
              customerId,
              customerName: organization.name,
              organizationId: organization.id,
            });
          }
        },
      });
    } else {
      console.error("No organization ID found in checkout session metadata");
      prettyPrint(event);
    }
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error(
      "Error handling Stripe checkout session completed event",
      message,
    );
    return retry();
  }

  return ok();
};

export const handleStripeCustomerCreatedEvent = async (
  event: Stripe.CustomerCreatedEvent,
) => {
  const customer = event.data.object;
  const organizationId = customer.metadata.organizationId;
  if (!organizationId) return ok();
  try {
    await withOrganizationMutationLock(organizationId, async () => {
      if (
        await recordDeletedOrganizationCustomer({
          customerId: customer.id,
          organizationId,
        })
      )
        return;
      // A delayed creation event must not replace a newer billing customer.
      await prisma.organization.updateMany({
        data: { stripeCustomerId: customer.id },
        where: { id: organizationId, stripeCustomerId: null },
      });
    });
    return ok();
  } catch (error) {
    console.error("Error recording Stripe customer", getErrorMessage(error));
    return retry();
  }
};

export const handleStripeCustomerDeletedEvent = async (
  event: Stripe.CustomerDeletedEvent,
) => {
  try {
    const organizationId = event.data.object.metadata?.organizationId;
    if (organizationId) {
      await withOrganizationMutationLock(organizationId, async () => {
        await prisma.organization.updateMany({
          data: { stripeCustomerId: null },
          where: {
            id: organizationId,
            stripeCustomerId: event.data.object.id,
          },
        });
      });
    } else {
      prettyPrint(event);
    }
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error("Error handling Stripe customer deleted event", message);
  }

  return ok();
};

export const handleStripeCustomerSubscriptionCreatedEvent = async (
  event: Stripe.CustomerSubscriptionCreatedEvent,
) => {
  try {
    const subscription = event.data.object;
    await withOrganizationCustomer({
      customerId:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id,
      organizationId: subscription.metadata.organizationId,
      update: () => saveSubscription(subscription, { preserveExisting: true }),
    });
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error("Error creating Stripe subscription", message);
    return retry();
  }

  return ok();
};

export const handleStripeCustomerSubscriptionDeletedEvent = async (
  event: Stripe.CustomerSubscriptionDeletedEvent,
) => {
  try {
    await updateStripeSubscriptionFromAPIInDatabase(event.data.object);
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error("Error updating deleted Stripe subscription", message);
  }

  return ok();
};

export const handleStripeCustomerSubscriptionUpdatedEvent = async (
  event: Stripe.CustomerSubscriptionUpdatedEvent,
) => {
  try {
    const subscription = event.data.object;
    await withOrganizationCustomer({
      customerId:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id,
      organizationId: subscription.metadata.organizationId,
      update: () => saveSubscription(subscription),
    });
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error("Error updating Stripe subscription", message);
    return retry();
  }

  return ok();
};

export const handleStripePriceCreatedEvent = async (
  event: Stripe.PriceCreatedEvent,
) => {
  try {
    await saveStripePriceFromAPIToDatabase(event.data.object);
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error("Error creating Stripe price", message);
  }

  return ok();
};

export const handleStripePriceDeletedEvent = async (
  event: Stripe.PriceDeletedEvent,
) => {
  try {
    await deleteStripePriceFromDatabaseById(event.data.object.id);
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error("Error deleting Stripe price", message);
  }

  return ok();
};

export const handleStripePriceUpdatedEvent = async (
  event: Stripe.PriceUpdatedEvent,
) => {
  try {
    await updateStripePriceFromAPIInDatabase(event.data.object);
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error("Error updating Stripe price", message);
  }

  return ok();
};

export const handleStripeProductCreatedEvent = async (
  event: Stripe.ProductCreatedEvent,
) => {
  try {
    await saveStripeProductFromAPIToDatabase(event.data.object);
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error("Error creating Stripe product", message);
  }

  return ok();
};

export const handleStripeProductDeletedEvent = async (
  event: Stripe.ProductDeletedEvent,
) => {
  try {
    await deleteStripeProductFromDatabaseById(event.data.object.id);
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error("Error deleting Stripe product", message);
  }

  return ok();
};

export const handleStripeProductUpdatedEvent = async (
  event: Stripe.ProductUpdatedEvent,
) => {
  try {
    await updateStripeProductFromAPIInDatabase(event.data.object);
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error("Error updating Stripe product", message);
  }

  return ok();
};

export const handleStripeSubscriptionScheduleCreatedEvent = async (
  event: Stripe.SubscriptionScheduleCreatedEvent,
) => {
  try {
    await saveStripeSubscriptionScheduleFromAPIToDatabase(event.data.object);
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error("Error creating Stripe subscription schedule", message);
  }

  return ok();
};

export const handleStripeSubscriptionScheduleExpiringEvent = async (
  event: Stripe.SubscriptionScheduleExpiringEvent,
) => {
  try {
    await updateStripeSubscriptionScheduleFromAPIInDatabase(event.data.object);
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error("Error updating Stripe subscription schedule", message);
  }

  return ok();
};

export const handleStripeSubscriptionScheduleUpdatedEvent = async (
  event: Stripe.SubscriptionScheduleUpdatedEvent,
) => {
  try {
    await updateStripeSubscriptionScheduleFromAPIInDatabase(event.data.object);
  } catch (error) {
    const message = getErrorMessage(error);
    prettyPrint(event);
    console.error("Error updating Stripe subscription schedule", message);
  }

  return ok();
};
