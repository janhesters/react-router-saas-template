import { createId } from "@paralleldrive/cuid2";
import { HttpResponse, http } from "msw";
import type Stripe from "stripe";
import { describe, expect, onTestFinished, test, vi } from "vitest";

import {
  createStripeCheckoutSessionCompletedEventFactory,
  createStripeCustomerDeletedEventFactory,
  createStripeCustomerSubscriptionCreatedEventFactory,
  createStripeCustomerSubscriptionDeletedEventFactory,
  createStripeCustomerSubscriptionUpdatedEventFactory,
  createStripeEventFactory,
} from "./stripe-event-factories.server";
import {
  handleStripeCheckoutSessionCompletedEvent,
  handleStripeCustomerCreatedEvent,
  handleStripeCustomerDeletedEvent,
  handleStripeCustomerSubscriptionCreatedEvent,
  handleStripeCustomerSubscriptionDeletedEvent,
  handleStripeCustomerSubscriptionUpdatedEvent,
} from "./stripe-event-handlers.server";
import {
  createStripeCheckoutSessionFactory,
  createStripeCustomerFactory,
  createStripeSubscriptionFactory,
} from "./stripe-factories.server";
import { createStripeCheckoutSession } from "./stripe-helpers.server";
import { requestOrganizationDeletion } from "~/features/organizations/deletion/organization-deletion.server";
import { createPopulatedOrganization } from "~/features/organizations/organizations-factories.server";
import { OrganizationMembershipRole } from "~/generated/client";
import { stripeHandlers } from "~/test/mocks/handlers/stripe";
import { setupMockServerLifecycle } from "~/test/msw-test-utils";
import { setupUserWithTrialOrgAndAddAsMember } from "~/test/server-test-utils";
import { prisma } from "~/utils/database.server";

const server = setupMockServerLifecycle(...stripeHandlers);
const stripeUrl = "https://api.stripe.com/v1";

async function completedDeletion() {
  const id = createId();
  const job = await prisma.organizationDeletion.create({
    data: {
      completedAt: new Date(),
      id,
      organizationName: "Deleted organization",
      organizationSlug: id,
      requestedById: createId(),
    },
  });
  onTestFinished(async () => {
    await prisma.organizationDeletion.deleteMany({ where: { id } });
  });
  return job;
}

describe("Stripe events after organization deletion", () => {
  test("a late checkout records its customer and reopens completed cleanup before acknowledging", async () => {
    const deletion = await completedDeletion();
    const customerId = `cus_${createId()}`;
    const event = createStripeCheckoutSessionCompletedEventFactory({
      data: {
        object: createStripeCheckoutSessionFactory({
          customer: customerId,
          metadata: { organizationId: deletion.id },
        }),
      },
    });

    expect(
      (await handleStripeCheckoutSessionCompletedEvent(event)).status,
    ).toBe(200);
    const stored = await prisma.organizationDeletion.findUniqueOrThrow({
      include: { resources: true },
      where: { id: deletion.id },
    });
    expect(stored.completedAt).toBeNull();
    expect(stored.resources).toMatchObject([
      { completedAt: null, kind: "stripeCustomer", target: customerId },
    ]);
    expect(
      await prisma.organization.findUnique({ where: { id: deletion.id } }),
    ).toBeNull();

    // Duplicate deliveries do not create more resources or reopen cleanup
    // again once that same customer has been permanently deleted.
    await prisma.organizationDeletionResource.updateMany({
      data: { completedAt: new Date() },
      where: { deletionId: deletion.id },
    });
    await prisma.organizationDeletion.update({
      data: { completedAt: new Date() },
      where: { id: deletion.id },
    });
    expect(
      (await handleStripeCheckoutSessionCompletedEvent(event)).status,
    ).toBe(200);
    expect(
      (
        await prisma.organizationDeletion.findUniqueOrThrow({
          where: { id: deletion.id },
        })
      ).completedAt,
    ).not.toBeNull();
    expect(
      await prisma.organizationDeletionResource.count({
        where: { deletionId: deletion.id },
      }),
    ).toBe(1);
  });

  test.each(["created", "updated"] as const)(
    "a late subscription.%s records cleanup without recreating organization data",
    async (type) => {
      const deletion = await completedDeletion();
      const customerId = `cus_${createId()}`;
      const subscription = createStripeSubscriptionFactory({
        customer: customerId,
        metadata: {
          organizationId: deletion.id,
          purchasedById: deletion.requestedById,
        },
      });
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
      expect(response.status).toBe(200);
      expect(
        await prisma.organizationDeletionResource.findFirst({
          where: { deletionId: deletion.id },
        }),
      ).toMatchObject({ target: customerId });
      expect(
        await prisma.stripeSubscription.findUnique({
          where: { stripeId: subscription.id },
        }),
      ).toBeNull();
    },
  );

  test("customer.created recovers provisioning interrupted before the customer ID was saved", async () => {
    const deletion = await completedDeletion();
    const event: Stripe.CustomerCreatedEvent = {
      ...createStripeEventFactory(),
      data: {
        object: createStripeCustomerFactory({
          metadata: { organizationId: deletion.id },
        }),
      },
      type: "customer.created",
    };
    expect((await handleStripeCustomerCreatedEvent(event)).status).toBe(200);
    expect(
      await prisma.organizationDeletionResource.findFirst({
        where: { deletionId: deletion.id },
      }),
    ).toMatchObject({ target: event.data.object.id });
  });

  test("customer.created recovers an active organization's customer without overwriting it on delayed delivery", async () => {
    const { organization } = await setupUserWithTrialOrgAndAddAsMember({
      organization: createPopulatedOrganization({ stripeCustomerId: null }),
    });
    const event: Stripe.CustomerCreatedEvent = {
      ...createStripeEventFactory(),
      data: {
        object: createStripeCustomerFactory({
          metadata: { organizationId: organization.id },
        }),
      },
      type: "customer.created",
    };
    expect((await handleStripeCustomerCreatedEvent(event)).status).toBe(200);
    expect(
      (
        await prisma.organization.findUniqueOrThrow({
          where: { id: organization.id },
        })
      ).stripeCustomerId,
    ).toBe(event.data.object.id);
    await prisma.organization.update({
      data: { stripeCustomerId: "cus_newer" },
      where: { id: organization.id },
    });
    expect((await handleStripeCustomerCreatedEvent(event)).status).toBe(200);
    expect(
      (
        await prisma.organization.findUniqueOrThrow({
          where: { id: organization.id },
        })
      ).stripeCustomerId,
    ).toBe("cus_newer");
  });

  test("given: customer.created arrives after customer.deleted, should: leave the organization unbound to the deleted customer", async () => {
    const customerId = `cus_${createId()}`;
    const { organization } = await setupUserWithTrialOrgAndAddAsMember({
      organization: createPopulatedOrganization({
        stripeCustomerId: customerId,
      }),
    });
    const customer = createStripeCustomerFactory({
      id: customerId,
      metadata: { organizationId: organization.id },
    });
    server.use(
      http.get(`${stripeUrl}/customers/${customerId}`, () =>
        HttpResponse.json({
          deleted: true,
          id: customerId,
          object: "customer",
        }),
      ),
    );
    expect(
      (
        await handleStripeCustomerDeletedEvent(
          createStripeCustomerDeletedEventFactory({
            data: { object: customer },
          }),
        )
      ).status,
    ).toEqual(200);
    expect(
      (
        await handleStripeCustomerCreatedEvent({
          ...createStripeEventFactory(),
          data: { object: customer },
          type: "customer.created",
        })
      ).status,
    ).toEqual(200);
    expect(
      (
        await prisma.organization.findUniqueOrThrow({
          where: { id: organization.id },
        })
      ).stripeCustomerId,
    ).toEqual(null);
  });

  test("given: current customer state cannot be verified, should: retry creation delivery without restoring a customer association", async () => {
    const { organization } = await setupUserWithTrialOrgAndAddAsMember({
      organization: createPopulatedOrganization({ stripeCustomerId: null }),
    });
    const customer = createStripeCustomerFactory({
      metadata: { organizationId: organization.id },
    });
    server.use(
      http.get(`${stripeUrl}/customers/${customer.id}`, () =>
        HttpResponse.json(
          { error: { message: "Stripe unavailable", type: "api_error" } },
          { headers: { "stripe-should-retry": "false" }, status: 503 },
        ),
      ),
    );
    expect(
      (
        await handleStripeCustomerCreatedEvent({
          ...createStripeEventFactory(),
          data: { object: customer },
          type: "customer.created",
        })
      ).status,
    ).toEqual(500);
    expect(
      (
        await prisma.organization.findUniqueOrThrow({
          where: { id: organization.id },
        })
      ).stripeCustomerId,
    ).toEqual(null);
  });

  test("returns a retryable failure if the late customer cannot be persisted", async () => {
    const deletion = await completedDeletion();
    const transaction = vi
      .spyOn(prisma, "$transaction")
      .mockRejectedValueOnce(new Error("database unavailable"));
    onTestFinished(() => transaction.mockRestore());
    const response = await handleStripeCheckoutSessionCompletedEvent(
      createStripeCheckoutSessionCompletedEventFactory({
        data: {
          object: createStripeCheckoutSessionFactory({
            metadata: { organizationId: deletion.id },
          }),
        },
      }),
    );
    expect(response.status).toBe(500);
    expect(
      await prisma.organizationDeletionResource.count({
        where: { deletionId: deletion.id },
      }),
    ).toBe(0);
  });
});

describe("checkout admission during organization deletion", () => {
  test("saves an explicit customer before opening checkout and reuses the persisted customer", async () => {
    const { organization, user } = await setupUserWithTrialOrgAndAddAsMember({
      organization: createPopulatedOrganization({ stripeCustomerId: null }),
    });
    const customerId = `cus_${createId()}`;
    let creations = 0;
    server.use(
      http.post(`${stripeUrl}/customers`, async ({ request }) => {
        creations += 1;
        expect(request.headers.get("idempotency-key")).toBe(
          `organization:${organization.id}:customer`,
        );
        expect(
          new URLSearchParams(await request.text()).get(
            "metadata[organizationId]",
          ),
        ).toBe(organization.id);
        return HttpResponse.json(
          createStripeCustomerFactory({ id: customerId }),
        );
      }),
      http.post(`${stripeUrl}/checkout/sessions`, async ({ request }) => {
        expect(
          (
            await prisma.organization.findUniqueOrThrow({
              where: { id: organization.id },
            })
          ).stripeCustomerId,
        ).toBe(customerId);
        const parameters = new URLSearchParams(await request.text());
        expect(parameters.get("customer")).toBe(customerId);
        for (const prefix of ["metadata", "subscription_data[metadata]"]) {
          expect(parameters.get(`${prefix}[organizationId]`)).toBe(
            organization.id,
          );
          expect(parameters.get(`${prefix}[organizationSlug]`)).toBe(
            organization.slug,
          );
          expect(parameters.get(`${prefix}[purchasedById]`)).toBe(user.id);
          expect(parameters.get(`${prefix}[customerEmail]`)).toBe(
            organization.billingEmail,
          );
        }
        return HttpResponse.json(
          createStripeCheckoutSessionFactory({ customer: customerId }),
        );
      }),
    );
    const checkout = () =>
      createStripeCheckoutSession({
        baseUrl: "https://example.com",
        organizationId: organization.id,
        priceId: "price_test",
        purchasedById: user.id,
        seatsUsed: 1,
      });
    await checkout();
    await checkout();
    expect(creations).toBe(1);
  });

  test("waits for an admitted checkout before deleting and rejects stale checkout requests afterward", async () => {
    const { organization, user } = await setupUserWithTrialOrgAndAddAsMember({
      organization: createPopulatedOrganization({ stripeCustomerId: null }),
      role: OrganizationMembershipRole.owner,
    });
    onTestFinished(async () => {
      await prisma.organizationDeletion.deleteMany({
        where: { id: organization.id },
      });
    });
    let signalStarted = () => {};
    const started = new Promise<void>((resolve) => {
      signalStarted = resolve;
    });
    let releaseCheckout = () => {};
    const release = new Promise<void>((resolve) => {
      releaseCheckout = resolve;
    });
    server.use(
      http.post(`${stripeUrl}/checkout/sessions`, async ({ request }) => {
        signalStarted();
        await release;
        const customer = new URLSearchParams(await request.text()).get(
          "customer",
        );
        return HttpResponse.json(
          createStripeCheckoutSessionFactory({ customer }),
        );
      }),
    );
    const input = {
      baseUrl: "https://example.com",
      organizationId: organization.id,
      priceId: "price_test",
      purchasedById: user.id,
      seatsUsed: 1,
    };
    const checkout = createStripeCheckoutSession(input);
    await started;
    const deletion = requestOrganizationDeletion({
      confirmation: organization.name,
      organizationId: organization.id,
      userId: user.id,
    });
    releaseCheckout();
    const session = await checkout;
    await deletion;
    expect(
      await prisma.organizationDeletionResource.findFirst({
        where: { deletionId: organization.id, kind: "stripeCustomer" },
      }),
    ).toMatchObject({ target: session.customer });
    await expect(createStripeCheckoutSession(input)).rejects.toMatchObject({
      status: 404,
    });
  });
});

describe("subscription event ordering", () => {
  test.each(["cancellation", "plan change"] as const)(
    "given: a creation replay after %s, should: preserve newer subscription state",
    async (change) => {
      const { organization, user } =
        await setupUserWithTrialOrgAndAddAsMember();
      const [originalPrice, changedPrice] = await prisma.stripePrice.findMany({
        take: 2,
      });
      if (!originalPrice || !changedPrice)
        throw new Error("Expected two seeded prices");
      const original = createStripeSubscriptionFactory({
        metadata: { organizationId: organization.id, purchasedById: user.id },
      });
      for (const item of original.items.data)
        item.price.id = originalPrice.stripeId;
      const created = createStripeCustomerSubscriptionCreatedEventFactory({
        data: { object: original },
      });
      expect(
        (await handleStripeCustomerSubscriptionCreatedEvent(created)).status,
      ).toEqual(200);
      const changed = structuredClone(original);
      if (change === "cancellation") {
        changed.status = "canceled";
        expect(
          (
            await handleStripeCustomerSubscriptionDeletedEvent(
              createStripeCustomerSubscriptionDeletedEventFactory({
                data: { object: changed },
              }),
            )
          ).status,
        ).toEqual(200);
      } else {
        for (const item of changed.items.data)
          item.price.id = changedPrice.stripeId;
        expect(
          (
            await handleStripeCustomerSubscriptionUpdatedEvent(
              createStripeCustomerSubscriptionUpdatedEventFactory({
                data: { object: changed },
              }),
            )
          ).status,
        ).toEqual(200);
      }
      const read = () =>
        prisma.stripeSubscription.findUniqueOrThrow({
          include: { items: true },
          where: { stripeId: original.id },
        });
      const newer = await read();
      expect(
        (await handleStripeCustomerSubscriptionCreatedEvent(created)).status,
      ).toEqual(200);
      expect(await read()).toEqual(newer);
    },
  );

  test.each(["created", "updated"] as const)(
    "given: a historical subscription.%s event, should: preserve the current billing customer",
    async (type) => {
      const currentCustomer = `cus_${createId()}`;
      const { organization, user } = await setupUserWithTrialOrgAndAddAsMember({
        organization: createPopulatedOrganization({
          stripeCustomerId: currentCustomer,
        }),
      });
      const price = await prisma.stripePrice.findFirstOrThrow();
      const historical = createStripeSubscriptionFactory({
        customer: `cus_${createId()}`,
        metadata: { organizationId: organization.id, purchasedById: user.id },
      });
      for (const item of historical.items.data) item.price.id = price.stripeId;
      if (type === "updated") {
        expect(
          (
            await handleStripeCustomerSubscriptionCreatedEvent(
              createStripeCustomerSubscriptionCreatedEventFactory({
                data: { object: historical },
              }),
            )
          ).status,
        ).toEqual(200);
      }
      const latest = createStripeSubscriptionFactory({
        created: historical.created + 60,
        customer: currentCustomer,
        metadata: historical.metadata,
      });
      for (const item of latest.items.data) item.price.id = price.stripeId;
      expect(
        (
          await handleStripeCustomerSubscriptionCreatedEvent(
            createStripeCustomerSubscriptionCreatedEventFactory({
              data: { object: latest },
            }),
          )
        ).status,
      ).toEqual(200);
      const response =
        type === "created"
          ? await handleStripeCustomerSubscriptionCreatedEvent(
              createStripeCustomerSubscriptionCreatedEventFactory({
                data: { object: historical },
              }),
            )
          : await handleStripeCustomerSubscriptionUpdatedEvent(
              createStripeCustomerSubscriptionUpdatedEventFactory({
                data: { object: historical },
              }),
            );
      expect(response.status).toEqual(200);
      const stored = await prisma.organization.findUniqueOrThrow({
        include: {
          stripeSubscriptions: { orderBy: { created: "desc" }, take: 1 },
        },
        where: { id: organization.id },
      });
      expect(stored.stripeSubscriptions[0]?.stripeId).toEqual(latest.id);
      expect(stored.stripeCustomerId).toEqual(currentCustomer);
    },
  );
});
