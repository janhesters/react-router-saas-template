import { describe, expect, test } from "vitest";

import {
  createStripeCustomerSubscriptionCreatedEventFactory,
  createStripeCustomerSubscriptionUpdatedEventFactory,
} from "./stripe-event-factories.server";
import {
  handleStripeCustomerSubscriptionCreatedEvent,
  handleStripeCustomerSubscriptionUpdatedEvent,
} from "./stripe-event-handlers.server";
import { createStripeSubscriptionFactory } from "./stripe-factories.server";
import { createStripeSubscriptionInDatabase } from "./stripe-subscription-model.server";
import { setupUserWithTrialOrgAndAddAsMember } from "~/test/server-test-utils";
import { prisma } from "~/utils/database.server";

describe("subscription events after purchaser account deletion", () => {
  test.each(["created", "updated"] as const)(
    "given: a subscription.%s event naming a deleted purchaser, should: keep organization billing current without recreating the account",
    async (type) => {
      const { organization, user } =
        await setupUserWithTrialOrgAndAddAsMember();
      const price = await prisma.stripePrice.findFirstOrThrow();
      const subscription = createStripeSubscriptionFactory({
        customer: organization.stripeCustomerId ?? undefined,
        metadata: { organizationId: organization.id, purchasedById: user.id },
      });
      for (const item of subscription.items.data)
        item.price.id = price.stripeId;
      if (type === "updated")
        await createStripeSubscriptionInDatabase(subscription);
      await prisma.userAccount.delete({ where: { id: user.id } });
      subscription.status = "past_due";

      const response =
        type === "created"
          ? await handleStripeCustomerSubscriptionCreatedEvent(
              createStripeCustomerSubscriptionCreatedEventFactory({
                data: { object: subscription },
              }),
            )
          : await handleStripeCustomerSubscriptionUpdatedEvent(
              createStripeCustomerSubscriptionUpdatedEventFactory({
                data: { object: subscription },
              }),
            );

      expect(response.status).toEqual(200);
      expect(
        await prisma.stripeSubscription.findUniqueOrThrow({
          where: { stripeId: subscription.id },
        }),
      ).toMatchObject({
        organizationId: organization.id,
        purchasedById: null,
        status: "past_due",
      });
      expect(
        await prisma.organization.findUnique({
          where: { id: organization.id },
        }),
      ).toMatchObject({ stripeCustomerId: organization.stripeCustomerId });
      expect(
        await prisma.userAccount.findUnique({ where: { id: user.id } }),
      ).toEqual(null);
    },
  );
});
