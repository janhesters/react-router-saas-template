import { createId } from "@paralleldrive/cuid2";
import { http } from "msw/http";
import { afterEach, describe, expect, onTestFinished, test, vi } from "vitest";

import { action, loader } from "./stripe.webhooks";
import {
  STRIPE_API_VERSION,
  stripeAdmin,
} from "~/features/billing/stripe-admin.server";
import {
  createStripeCheckoutSessionCompletedEventFactory,
  createStripeCustomerCreatedEventFactory,
  createStripeCustomerDeletedEventFactory,
  createStripeCustomerSubscriptionCreatedEventFactory,
  createStripeCustomerSubscriptionUpdatedEventFactory,
  createStripeEventFactory,
  createStripeProductCreatedEventFactory,
  PREVIOUS_STRIPE_API_VERSION,
  toPreviousApiCheckoutSession,
  toPreviousApiEvent,
  toPreviousApiProduct,
  toPreviousApiSubscription,
} from "~/features/billing/stripe-event-factories.server";
import {
  createStripeCheckoutSessionFactory,
  createStripeCustomerFactory,
  createStripePriceFactory,
  createStripeProductFactory,
  createStripeSubscriptionFactory,
  createStripeSubscriptionItemFactory,
} from "~/features/billing/stripe-factories.server";
import { createPopulatedOrganization } from "~/features/organizations/organizations-factories.server";
import { captureConsole } from "~/test/console-test-utils";
import {
  interruptedStripeResponse,
  stripeHandlers,
} from "~/test/mocks/handlers/stripe";
import { setupMockServerLifecycle } from "~/test/msw-test-utils";
import { setupUserWithTrialOrgAndAddAsMember } from "~/test/server-test-utils";
import { createTestContextProvider } from "~/test/test-utils";
import { prisma } from "~/utils/database.server";

const server = setupMockServerLifecycle(...stripeHandlers);
const url = "http://localhost:3000/api/v1/stripe/webhooks";
const pattern = "/api/v1/stripe/webhooks";
const stripeUrl = "https://api.stripe.com/v1";
const signingSecret = "whsec_route_test_secret";

function signedRequest({
  payload,
  secret = signingSecret,
  timestamp,
}: {
  payload: string;
  secret?: string;
  timestamp?: number;
}) {
  return new Request(url, {
    body: payload,
    headers: {
      // Stripe signs the raw JSON body, so the route must verify that text.
      "stripe-signature": stripeAdmin.webhooks.generateTestHeaderString({
        payload,
        secret,
        timestamp,
      }),
    },
    method: "POST",
  });
}

async function sendWebhook(request: Request) {
  const params = {};
  return await action({
    context: await createTestContextProvider({ params, pattern, request }),
    params,
    pattern,
    request,
    url: new URL(request.url),
  });
}

async function saveProductWithPrice() {
  const product = createStripeProductFactory({
    metadata: { max_seats: "5" },
  });
  const price = createStripePriceFactory({ product: product.id });
  await prisma.stripeProduct.create({
    data: {
      active: true,
      maxSeats: 5,
      name: product.name,
      stripeId: product.id,
    },
  });
  await prisma.stripePrice.create({
    data: {
      active: true,
      currency: price.currency,
      interval: "month",
      lookupKey: price.lookup_key ?? createId(),
      productId: product.id,
      stripeId: price.id,
      unitAmount: price.unit_amount ?? 0,
    },
  });
  onTestFinished(async () => {
    await prisma.stripeProduct.deleteMany({ where: { stripeId: product.id } });
  });
  return { price, product };
}

async function createSubscriptionFixture({
  quantity = 2,
}: { quantity?: number } = {}) {
  const { organization, user } = await setupUserWithTrialOrgAndAddAsMember();
  const { price } = await saveProductWithPrice();
  const id = `sub_${createId()}`;
  const subscription = createStripeSubscriptionFactory({
    customer: organization.stripeCustomerId ?? undefined,
    id,
    items: {
      data: [
        createStripeSubscriptionItemFactory({
          price,
          quantity,
          subscription: id,
        }),
      ],
      has_more: false,
      object: "list",
      url: `/v1/subscription_items?subscription=${id}`,
    },
    metadata: { organizationId: organization.id, purchasedById: user.id },
  });
  return { organization, price, subscription, user };
}

const retrieveSubscription = (stripeId: string) =>
  prisma.stripeSubscription.findUnique({
    include: { items: true },
    where: { stripeId },
  });

// Invented customer and payment details which must never reach a log.
const privateDetails = {
  cardFingerprint: "fp_SentinelCardFingerprint",
  city: "Sentinelburg",
  clientSecret: "pi_sentinel_secret_SentinelClientSecret",
  email: "ada.sentinel@example.com",
  line1: "17 Sentinel Lane",
  metadataSecret: "sentinel-metadata-secret",
  name: "Ada Sentinel",
};

// The route has no case for this event type, so it reaches the default branch.
const createUnhandledPaymentFailedEvent = () => {
  const address = {
    city: privateDetails.city,
    country: "CH",
    line1: privateDetails.line1,
    line2: null,
    postal_code: "8000",
    state: null,
  };
  return {
    ...createStripeEventFactory(),
    data: {
      object: {
        amount: 4900,
        client_secret: privateDetails.clientSecret,
        currency: "chf",
        customer: `cus_${createId()}`,
        id: `pi_${createId()}`,
        last_payment_error: {
          code: "card_declined",
          payment_method: {
            billing_details: {
              address,
              email: privateDetails.email,
              name: privateDetails.name,
            },
            card: {
              brand: "visa",
              exp_month: 4,
              exp_year: 2031,
              fingerprint: privateDetails.cardFingerprint,
              last4: "4242",
            },
            id: `pm_${createId()}`,
            object: "payment_method",
          },
        },
        metadata: { internalNote: privateDetails.metadataSecret },
        object: "payment_intent",
        receipt_email: privateDetails.email,
        shipping: { address, name: privateDetails.name },
        status: "requires_payment_method",
      },
    },
    type: "payment_intent.payment_failed",
  };
};

// Pretty-printed like a hand-written body, so a re-serialized body would no
// longer match its signature.
const formatted = (event: object) => JSON.stringify(event, null, 2);

const expectNoPrivateDetails = (output: string) => {
  for (const value of Object.values(privateDetails)) {
    expect(output).not.toContain(value);
  }
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe(`${pattern} route action`, () => {
  describe("signature verification", () => {
    test("given: a request signed with the configured secret, should: process the Endive event and save its product", async () => {
      vi.stubEnv("STRIPE_WEBHOOK_SECRET", signingSecret);
      const product = createStripeProductFactory({
        metadata: { max_seats: "3" },
        name: "Endive Plan",
        tax_details: { performance_location: null, tax_code: "txcd_10103001" },
      });
      onTestFinished(async () => {
        await prisma.stripeProduct.deleteMany({
          where: { stripeId: product.id },
        });
      });
      const event = createStripeProductCreatedEventFactory({
        data: { object: product },
      });

      const response = await sendWebhook(
        signedRequest({ payload: JSON.stringify(event) }),
      );

      expect(event.api_version).toEqual(STRIPE_API_VERSION);
      expect(response.status).toEqual(200);
      expect(await response.json()).toEqual({ message: "OK" });
      expect(
        await prisma.stripeProduct.findUnique({
          where: { stripeId: product.id },
        }),
      ).toEqual({
        active: true,
        maxSeats: 3,
        name: "Endive Plan",
        stripeId: product.id,
      });
    });

    test.each([
      {
        expected: "No signatures found matching the expected signature",
        name: "a request signed with another secret",
        request: (payload: string) =>
          signedRequest({ payload, secret: "whsec_someone_else" }),
        secret: signingSecret,
      },
      {
        expected: "No signatures found matching the expected signature",
        name: "a body changed after signing",
        request: (payload: string) => {
          const signed = signedRequest({ payload });
          return new Request(url, {
            body: payload.replace("Private Plan", "Altered Plan"),
            headers: signed.headers,
            method: "POST",
          });
        },
        secret: signingSecret,
      },
      {
        expected: "Timestamp outside the tolerance zone",
        name: "a signature older than the default five-minute tolerance",
        request: (payload: string) =>
          signedRequest({
            payload,
            timestamp: Math.floor(Date.now() / 1000) - 310,
          }),
        secret: signingSecret,
      },
      {
        expected: "No webhook secret value was provided",
        name: "a missing signing secret",
        request: (payload: string) => signedRequest({ payload }),
        secret: undefined,
      },
      {
        expected: "No webhook secret value was provided",
        name: "an empty signing secret",
        request: (payload: string) => signedRequest({ payload, secret: "" }),
        secret: "",
      },
      {
        expected: "No webhook secret value was provided",
        name: "a whitespace-only signing secret matching the signature",
        request: (payload: string) =>
          signedRequest({ payload, secret: " \n\t " }),
        secret: " \n\t ",
      },
    ])(
      "given: $name, should: reject it with a 400 without processing or logging it",
      async ({ expected, request, secret }) => {
        vi.stubEnv("STRIPE_WEBHOOK_SECRET", secret);
        const logs = [
          vi.spyOn(console, "error"),
          vi.spyOn(console, "info"),
          vi.spyOn(console, "log"),
          vi.spyOn(console, "warn"),
        ];
        const product = createStripeProductFactory({
          metadata: { max_seats: "1" },
          name: "Private Plan",
        });
        const payload = JSON.stringify(
          createStripeProductCreatedEventFactory({ data: { object: product } }),
        );

        const response = await sendWebhook(request(payload));

        expect(response.status).toEqual(400);
        const body: unknown = await response.json();
        expect(body).toEqual({
          error: expect.stringContaining(expected),
          message: "Bad Request",
        });
        expect(JSON.stringify(body)).not.toContain(signingSecret);
        expect(JSON.stringify(body)).not.toContain(product.id);
        expect(
          await prisma.stripeProduct.findUnique({
            where: { stripeId: product.id },
          }),
        ).toBeNull();
        for (const log of logs) expect(log).not.toHaveBeenCalled();
      },
    );

    test("given: a signature four minutes old, should: still accept it", async () => {
      vi.stubEnv("STRIPE_WEBHOOK_SECRET", signingSecret);
      const product = createStripeProductFactory({
        metadata: { max_seats: "1" },
      });
      onTestFinished(async () => {
        await prisma.stripeProduct.deleteMany({
          where: { stripeId: product.id },
        });
      });
      const payload = JSON.stringify(
        createStripeProductCreatedEventFactory({ data: { object: product } }),
      );

      const response = await sendWebhook(
        signedRequest({
          payload,
          timestamp: Math.floor(Date.now() / 1000) - 240,
        }),
      );

      expect(response.status).toEqual(200);
      expect(
        await prisma.stripeProduct.count({ where: { stripeId: product.id } }),
      ).toEqual(1);
    });

    test("given: no stripe-signature header, should: reject it with a 400 without logging it", async () => {
      vi.stubEnv("STRIPE_WEBHOOK_SECRET", signingSecret);
      const logs = captureConsole();
      const payload = formatted(createUnhandledPaymentFailedEvent());

      const response = await sendWebhook(
        new Request(url, { body: payload, method: "POST" }),
      );

      expect(response.status).toEqual(400);
      expect(await response.json()).toEqual({
        message: "Missing stripe-signature header",
      });
      expect(logs.calls).toEqual([]);
    });

    test("given: a correctly signed body which is not JSON, should: reject it with a 400 without logging it", async () => {
      vi.stubEnv("STRIPE_WEBHOOK_SECRET", signingSecret);
      const logs = captureConsole();

      const response = await sendWebhook(
        signedRequest({ payload: "{ not json" }),
      );

      expect(response.status).toEqual(400);
      expect(await response.json()).toEqual({
        error: expect.stringContaining("Webhook Error: "),
        message: "Bad Request",
      });
      expect(logs.calls).toEqual([]);
    });

    test.each(["DELETE", "PUT"])(
      "given: a %s request, should: return a 405",
      async (method) => {
        const response = await sendWebhook(new Request(url, { method }));

        expect(response.status).toEqual(405);
        expect(await response.json()).toEqual({
          message: "Method Not Allowed",
        });
      },
    );

    test("given: a GET request, should: return a 405", async () => {
      const response = loader();

      expect(response.status).toEqual(405);
      expect(await response.json()).toEqual({ message: "Method Not Allowed" });
    });
  });

  describe("diagnostic logging", () => {
    test("given: a correctly signed unhandled event with customer and payment details, should: log only its ID and type", async () => {
      vi.stubEnv("STRIPE_WEBHOOK_SECRET", signingSecret);
      const logs = captureConsole();
      const event = createUnhandledPaymentFailedEvent();
      const payload = formatted(event);
      const request = signedRequest({ payload });
      const signature = request.headers.get("stripe-signature") ?? "";

      const response = await sendWebhook(request);

      expect(response.status).toEqual(200);
      expect(await response.json()).toEqual({
        message: "Unhandled event type: payment_intent.payment_failed",
      });
      const output = logs.output();
      expectNoPrivateDetails(output);
      expect(output).not.toContain(event.data.object.id);
      expect(output).not.toContain(signature);
      expect(output).not.toContain(signingSecret);
      expect(logs.calls).toEqual([
        [
          "log",
          "Stripe webhook unhandled event:",
          { id: event.id, type: "payment_intent.payment_failed" },
        ],
      ]);
    });

    test("given: a correctly signed event whose ID is an object and whose type is missing, should: log neither and still answer with a 200", async () => {
      vi.stubEnv("STRIPE_WEBHOOK_SECRET", signingSecret);
      const logs = captureConsole();
      const { type: _type, ...event } = createUnhandledPaymentFailedEvent();
      const payload = formatted({
        ...event,
        id: { nested: privateDetails.metadataSecret },
      });

      const response = await sendWebhook(signedRequest({ payload }));

      expect(response.status).toEqual(200);
      expect(await response.json()).toEqual({
        message: "Unhandled event type: undefined",
      });
      expectNoPrivateDetails(logs.output());
      expect(logs.calls).toEqual([
        ["log", "Stripe webhook unhandled event:", {}],
      ]);
    });

    test("given: a correctly signed event the route ignores, should: answer OK without logging it", async () => {
      vi.stubEnv("STRIPE_WEBHOOK_SECRET", signingSecret);
      const logs = captureConsole();
      const payload = formatted({
        ...createUnhandledPaymentFailedEvent(),
        type: "payment_intent.succeeded",
      });

      const response = await sendWebhook(signedRequest({ payload }));

      expect(response.status).toEqual(200);
      expect(await response.json()).toEqual({ message: "OK" });
      expect(logs.calls).toEqual([]);
    });

    test("given: a correctly signed 'customer.deleted' event without an organization, should: pass it to its handler, which logs only its ID and type", async () => {
      vi.stubEnv("STRIPE_WEBHOOK_SECRET", signingSecret);
      const logs = captureConsole();
      const event = createStripeCustomerDeletedEventFactory({
        data: {
          object: createStripeCustomerFactory({
            email: privateDetails.email,
            metadata: { internalNote: privateDetails.metadataSecret },
            name: privateDetails.name,
          }),
        },
      });

      const response = await sendWebhook(
        signedRequest({ payload: formatted(event) }),
      );

      expect(response.status).toEqual(200);
      expect(await response.json()).toEqual({ message: "OK" });
      expectNoPrivateDetails(logs.output());
      expect(logs.calls).toEqual([
        [
          "log",
          "unhandled Stripe event:",
          { id: event.id, type: "customer.deleted" },
        ],
      ]);
    });
  });

  describe("Endive events", () => {
    test("given: the same 'customer.subscription.created' event delivered twice, should: store the subscription once and keep a later update", async () => {
      vi.stubEnv("STRIPE_WEBHOOK_SECRET", signingSecret);
      const { organization, price, subscription, user } =
        await createSubscriptionFixture();
      const created = JSON.stringify(
        createStripeCustomerSubscriptionCreatedEventFactory({
          data: { object: subscription },
        }),
      );
      const updated = JSON.stringify(
        createStripeCustomerSubscriptionUpdatedEventFactory({
          data: {
            object: { ...subscription, cancel_at_period_end: true },
            previous_attributes: { cancel_at_period_end: false },
          },
        }),
      );

      const responses = [
        await sendWebhook(signedRequest({ payload: created })),
        await sendWebhook(signedRequest({ payload: updated })),
        await sendWebhook(signedRequest({ payload: created })),
      ];

      expect(responses.map(({ status }) => status)).toEqual([200, 200, 200]);
      expect(
        await prisma.stripeSubscription.count({
          where: { organizationId: organization.id },
        }),
      ).toEqual(1);
      expect(await retrieveSubscription(subscription.id)).toMatchObject({
        cancelAtPeriodEnd: true,
        items: [
          {
            currentPeriodEnd: new Date(
              (subscription.items.data[0]?.current_period_end ?? 0) * 1000,
            ),
            currentPeriodStart: new Date(
              (subscription.items.data[0]?.current_period_start ?? 0) * 1000,
            ),
            priceId: price.id,
            stripeId: subscription.items.data[0]?.id,
          },
        ],
        organizationId: organization.id,
        purchasedById: user.id,
        status: "active",
      });
    });

    test("given: a 'customer.subscription.created' event for a trial offer, should: save it with its item periods", async () => {
      vi.stubEnv("STRIPE_WEBHOOK_SECRET", signingSecret);
      const { organization, subscription } = await createSubscriptionFixture();
      const item = subscription.items.data[0];
      if (!item) throw new Error("Subscription fixture must contain an item");
      item.current_trial = {
        end_date: item.current_period_end,
        start_date: item.current_period_start,
        trial_offer: "trialoffer_endive",
      };
      subscription.status = "trialing";
      subscription.trial_settings = {
        end_behavior: {
          billing_cycle_anchor: "unchanged",
          missing_payment_method: "pause",
        },
      };

      const response = await sendWebhook(
        signedRequest({
          payload: JSON.stringify(
            createStripeCustomerSubscriptionCreatedEventFactory({
              data: { object: subscription },
            }),
          ),
        }),
      );

      expect(response.status).toEqual(200);
      expect(await retrieveSubscription(subscription.id)).toMatchObject({
        items: [{ stripeId: item.id }],
        organizationId: organization.id,
        status: "trialing",
      });
    });

    test("given: a 'customer.subscription.updated' event for a paused subscription, should: record the paused status", async () => {
      vi.stubEnv("STRIPE_WEBHOOK_SECRET", signingSecret);
      const { subscription } = await createSubscriptionFixture();
      const created = createStripeCustomerSubscriptionCreatedEventFactory({
        data: { object: subscription },
      });
      const paused = createStripeCustomerSubscriptionUpdatedEventFactory({
        data: {
          object: {
            ...subscription,
            status: "paused",
            status_details: {
              paused: {
                subscription: { type: "trial_end_without_payment_method" },
                transitioned_at: Math.floor(Date.now() / 1000),
                type: "subscription",
              },
            },
          },
          previous_attributes: { status: "active" },
        },
      });

      await sendWebhook(signedRequest({ payload: JSON.stringify(created) }));
      const response = await sendWebhook(
        signedRequest({ payload: JSON.stringify(paused) }),
      );

      expect(response.status).toEqual(200);
      expect(await retrieveSubscription(subscription.id)).toMatchObject({
        status: "paused",
      });
    });

    test("given: Stripe cuts off its customer response while a 'customer.created' event is handled, should: ask Stripe to retry without saving the customer", async () => {
      vi.stubEnv("STRIPE_WEBHOOK_SECRET", signingSecret);
      const logError = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      const retrieveCustomer = vi.spyOn(stripeAdmin.customers, "retrieve");
      const { organization } = await setupUserWithTrialOrgAndAddAsMember({
        organization: createPopulatedOrganization({ stripeCustomerId: null }),
      });
      const customer = createStripeCustomerFactory({
        metadata: { organizationId: organization.id },
      });
      server.use(
        http.get(
          `${stripeUrl}/customers/${customer.id}`,
          interruptedStripeResponse,
        ),
      );
      const event = createStripeCustomerCreatedEventFactory({
        data: { object: customer },
      });

      const response = await sendWebhook(
        signedRequest({ payload: JSON.stringify(event) }),
      );

      expect(response.status).toEqual(500);
      expect(await response.json()).toEqual({
        message: "Webhook processing failed",
      });
      // Stripe 23 reports a cut-off body as a connection failure, not as an
      // API error, so the handler cannot mistake it for a provider answer.
      await expect(
        retrieveCustomer.mock.results[0]?.value,
      ).rejects.toMatchObject({ type: "StripeConnectionError" });
      expect(logError).toHaveBeenCalledWith("Error recording Stripe customer", {
        id: event.id,
        type: "customer.created",
      });
      expect(
        await prisma.organization.findUniqueOrThrow({
          select: { stripeCustomerId: true },
          where: { id: organization.id },
        }),
      ).toEqual({ stripeCustomerId: null });
    });
  });

  describe(`events from the previous API version (${PREVIOUS_STRIPE_API_VERSION})`, () => {
    test("given: a 'product.created' event without tax details, should: save the product", async () => {
      vi.stubEnv("STRIPE_WEBHOOK_SECRET", signingSecret);
      const product = createStripeProductFactory({
        metadata: { max_seats: "25" },
        name: "Business Plan",
      });
      onTestFinished(async () => {
        await prisma.stripeProduct.deleteMany({
          where: { stripeId: product.id },
        });
      });
      const event = toPreviousApiEvent(
        createStripeProductCreatedEventFactory(),
        toPreviousApiProduct(product),
      );

      const response = await sendWebhook(
        signedRequest({ payload: JSON.stringify(event) }),
      );

      expect(event.api_version).toEqual(PREVIOUS_STRIPE_API_VERSION);
      expect(event.data.object).not.toHaveProperty("tax_details");
      expect(response.status).toEqual(200);
      expect(
        await prisma.stripeProduct.findUnique({
          where: { stripeId: product.id },
        }),
      ).toEqual({
        active: true,
        maxSeats: 25,
        name: "Business Plan",
        stripeId: product.id,
      });
    });

    test("given: subscription events without trial offers or trial anchors, should: create and then update the subscription", async () => {
      vi.stubEnv("STRIPE_WEBHOOK_SECRET", signingSecret);
      const { organization, price, subscription, user } =
        await createSubscriptionFixture({ quantity: 3 });
      const created = toPreviousApiEvent(
        createStripeCustomerSubscriptionCreatedEventFactory(),
        toPreviousApiSubscription(subscription),
      );
      const updated = toPreviousApiEvent(
        createStripeCustomerSubscriptionUpdatedEventFactory(),
        toPreviousApiSubscription({
          ...subscription,
          cancel_at_period_end: true,
        }),
      );

      const responses = [
        await sendWebhook(signedRequest({ payload: JSON.stringify(created) })),
        await sendWebhook(signedRequest({ payload: JSON.stringify(updated) })),
      ];

      expect(created.data.object.items.data[0]).not.toHaveProperty(
        "current_trial",
      );
      expect(created.data.object.trial_settings?.end_behavior).toEqual({
        missing_payment_method: "create_invoice",
      });
      expect(responses.map(({ status }) => status)).toEqual([200, 200]);
      expect(await retrieveSubscription(subscription.id)).toMatchObject({
        cancelAtPeriodEnd: true,
        items: [
          { priceId: price.id, stripeId: subscription.items.data[0]?.id },
        ],
        organizationId: organization.id,
        purchasedById: user.id,
        status: "active",
      });
    });

    test("given: a 'checkout.session.completed' event without allowed payment method types, should: link the customer and end the trial", async () => {
      vi.stubEnv("STRIPE_WEBHOOK_SECRET", signingSecret);
      const { organization } = await setupUserWithTrialOrgAndAddAsMember({
        organization: createPopulatedOrganization({ stripeCustomerId: null }),
      });
      const session = createStripeCheckoutSessionFactory({
        customer: `cus_${createId()}`,
        metadata: { organizationId: organization.id },
      });
      const event = toPreviousApiEvent(
        createStripeCheckoutSessionCompletedEventFactory(),
        toPreviousApiCheckoutSession(session),
      );

      const response = await sendWebhook(
        signedRequest({ payload: JSON.stringify(event) }),
      );

      expect(event.data.object).not.toHaveProperty(
        "allowed_payment_method_types",
      );
      expect(response.status).toEqual(200);
      const saved = await prisma.organization.findUniqueOrThrow({
        where: { id: organization.id },
      });
      expect(saved).toMatchObject({
        billingEmail: session.customer_details?.email,
        stripeCustomerId: session.customer,
      });
      expect(saved.trialEnd.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });
});
