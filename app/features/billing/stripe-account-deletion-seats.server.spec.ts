import { randomUUID } from "node:crypto";
import { HttpResponse, http } from "msw";
import { describe, expect, onTestFinished, test } from "vitest";

import {
  createStripeCustomerSubscriptionCreatedEventFactory,
  createStripeCustomerSubscriptionUpdatedEventFactory,
} from "./stripe-event-factories.server";
import {
  handleStripeCustomerSubscriptionCreatedEvent,
  handleStripeCustomerSubscriptionUpdatedEvent,
} from "./stripe-event-handlers.server";
import { createStripeSubscriptionFactory } from "./stripe-factories.server";
import { processAccountDeletion } from "~/features/user-accounts/deletion/account-deletion.server";
import { stripeHandlers } from "~/test/mocks/handlers/stripe";
import { setupMockServerLifecycle } from "~/test/msw-test-utils";
import { setupUserWithTrialOrgAndAddAsMember } from "~/test/server-test-utils";
import { prisma } from "~/utils/database.server";

const server = setupMockServerLifecycle(...stripeHandlers);

describe("subscription creation after account deletion", () => {
  test("given: two late subscriptions arrive newest first, should: reconcile each subscription before completing its cleanup resource", async () => {
    const { organization, user } = await setupUserWithTrialOrgAndAddAsMember();
    const id = randomUUID();
    onTestFinished(async () => {
      await prisma.accountDeletion.deleteMany({ where: { id } });
    });
    await prisma.accountDeletion.create({
      data: {
        completedAt: new Date(),
        id,
        recoveryTokenHash: "test",
        resources: {
          create: {
            completedAt: new Date(),
            kind: "billingSeats",
            target: organization.id,
          },
        },
        supabaseUserId: randomUUID(),
      },
    });
    const price = await prisma.stripePrice.findFirstOrThrow();
    const older = createStripeSubscriptionFactory({
      metadata: { organizationId: organization.id, purchasedById: user.id },
    });
    const newer = createStripeSubscriptionFactory({
      created: older.created + 60,
      metadata: older.metadata,
    });
    const quantities = new Map<string, number>();
    for (const subscription of [newer, older]) {
      const item = subscription.items.data[0];
      if (!item) throw new Error("Subscription fixture must contain an item");
      item.price.id = price.stripeId;
      item.quantity = 2;
      quantities.set(subscription.id, item.quantity);
      server.use(
        http.get(
          `https://api.stripe.com/v1/subscriptions/${subscription.id}`,
          () => HttpResponse.json(subscription),
        ),
        http.post(
          `https://api.stripe.com/v1/subscriptions/${subscription.id}`,
          async ({ request }) => {
            const parameters = new URLSearchParams(await request.text());
            expect(parameters.get("items[0][id]")).toEqual(item.id);
            item.quantity = Number(parameters.get("items[0][quantity]"));
            quantities.set(subscription.id, item.quantity);
            return HttpResponse.json(subscription);
          },
        ),
      );
      expect(
        (
          await handleStripeCustomerSubscriptionCreatedEvent(
            createStripeCustomerSubscriptionCreatedEventFactory({
              data: { object: subscription },
            }),
          )
        ).status,
      ).toEqual(200);
    }

    await processAccountDeletion(id);

    expect(quantities.get(older.id)).toEqual(1);
    expect(quantities.get(newer.id)).toEqual(1);
    expect(
      await prisma.accountDeletionResource.findMany({
        select: { completedAt: true, target: true },
        where: { deletionId: id, kind: "billingSubscription" },
      }),
    ).toEqual(
      expect.arrayContaining([
        { completedAt: expect.any(Date), target: older.id },
        { completedAt: expect.any(Date), target: newer.id },
      ]),
    );
  });

  test("given: checkout completes after a departing member's seat cleanup, should: durably reconcile the late subscription without reopening completed replay work", async () => {
    const { organization, user } = await setupUserWithTrialOrgAndAddAsMember();
    const id = randomUUID();
    onTestFinished(async () => {
      await prisma.accountDeletion.deleteMany({ where: { id } });
    });
    await prisma.accountDeletion.create({
      data: {
        completedAt: new Date(),
        id,
        recoveryTokenHash: "test",
        resources: {
          create: {
            completedAt: new Date(),
            kind: "billingSeats",
            target: organization.id,
          },
        },
        supabaseUserId: randomUUID(),
      },
    });
    const price = await prisma.stripePrice.findFirstOrThrow();
    const subscription = createStripeSubscriptionFactory({
      metadata: { organizationId: organization.id, purchasedById: user.id },
    });
    const item = subscription.items.data[0];
    if (!item) throw new Error("Subscription fixture must contain an item");
    item.price.id = price.stripeId;
    item.quantity = 2;
    let requestedQuantity: string | null = null;
    server.use(
      http.get(
        `https://api.stripe.com/v1/subscriptions/${subscription.id}`,
        () => HttpResponse.json(subscription),
      ),
      http.post(
        `https://api.stripe.com/v1/subscriptions/${subscription.id}`,
        async ({ request }) => {
          requestedQuantity = new URLSearchParams(await request.text()).get(
            "items[0][quantity]",
          );
          item.quantity = Number(requestedQuantity);
          return HttpResponse.json(subscription);
        },
      ),
    );

    expect(
      (
        await handleStripeCustomerSubscriptionCreatedEvent(
          createStripeCustomerSubscriptionCreatedEventFactory({
            data: { object: subscription },
          }),
        )
      ).status,
    ).toEqual(200);
    expect(
      await prisma.accountDeletion.findUnique({ where: { id } }),
    ).toMatchObject({ completedAt: null });
    expect(
      await prisma.accountDeletionResource.findMany({
        select: { completedAt: true, kind: true, target: true },
        where: { deletionId: id },
      }),
    ).toEqual(
      expect.arrayContaining([
        {
          completedAt: null,
          kind: "billingSubscription",
          target: subscription.id,
        },
      ]),
    );

    await processAccountDeletion(id);
    expect(requestedQuantity).toEqual("1");
    const completed = await prisma.accountDeletion.findUniqueOrThrow({
      where: { id },
    });
    expect(completed.completedAt).toEqual(expect.any(Date));
    expect(
      (
        await handleStripeCustomerSubscriptionUpdatedEvent(
          createStripeCustomerSubscriptionUpdatedEventFactory({
            data: { object: subscription },
          }),
        )
      ).status,
    ).toEqual(200);
    expect(await prisma.accountDeletion.findUnique({ where: { id } })).toEqual(
      completed,
    );
  });
});
