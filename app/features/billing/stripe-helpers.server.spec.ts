import { HttpResponse, http } from "msw/http";
import { describe, expect, test } from "vitest";

import {
  createStripeCheckoutSessionFactory,
  createStripeCustomerFactory,
  createStripeCustomerPortalSessionFactory,
  createStripeSubscriptionFactory,
  createStripeSubscriptionScheduleFactory,
  createStripeSubscriptionSchedulePhaseFactory,
} from "./stripe-factories.server";
import {
  adjustSeats,
  createStripeCancelSubscriptionSession,
  createStripeCheckoutSession,
  createStripeCustomerPortalSession,
  createStripeSwitchPlanSession,
} from "./stripe-helpers.server";
import { createPopulatedOrganization } from "~/features/organizations/organizations-factories.server";
import { stripeHandlers } from "~/test/mocks/handlers/stripe";
import { setupMockServerLifecycle } from "~/test/msw-test-utils";
import { setupUserWithTrialOrgAndAddAsMember } from "~/test/server-test-utils";
import { prisma } from "~/utils/database.server";

const server = setupMockServerLifecycle(...stripeHandlers);
const stripeUrl = "https://api.stripe.com/v1";
const baseUrl = "https://app.example.com";
const endive = "2026-09-30.endive";

type CapturedRequest = {
  idempotencyKey: string | null;
  method: string;
  parameters: URLSearchParams;
  path: string;
  version: string | null;
};

async function capture(request: Request): Promise<CapturedRequest> {
  return {
    idempotencyKey: request.headers.get("Idempotency-Key"),
    method: request.method,
    parameters: new URLSearchParams(await request.text()),
    path: new URL(request.url).pathname,
    version: request.headers.get("Stripe-Version"),
  };
}

describe("Stripe requests", () => {
  test("given: an organization without a Stripe customer opens checkout, should: send both requests at the pinned API version and keep the checkout parameters", async () => {
    const { organization, user } = await setupUserWithTrialOrgAndAddAsMember({
      organization: createPopulatedOrganization({ stripeCustomerId: null }),
    });
    const requests: CapturedRequest[] = [];
    const customer = createStripeCustomerFactory();
    server.use(
      http.post(`${stripeUrl}/customers`, async ({ request }) => {
        requests.push(await capture(request));
        return HttpResponse.json(customer);
      }),
      http.post(`${stripeUrl}/checkout/sessions`, async ({ request }) => {
        requests.push(await capture(request));
        return HttpResponse.json(
          createStripeCheckoutSessionFactory({ customer: customer.id }),
        );
      }),
    );

    await createStripeCheckoutSession({
      baseUrl,
      organizationId: organization.id,
      priceId: "price_endive",
      purchasedById: user.id,
      seatsUsed: 3,
    });

    const [customerRequest, checkoutRequest] = requests;
    expect(requests).toHaveLength(2);
    expect(customerRequest).toMatchObject({
      idempotencyKey: `organization:${organization.id}:customer`,
      path: "/v1/customers",
      version: endive,
    });
    expect(
      Object.fromEntries(customerRequest?.parameters.entries() ?? []),
    ).toEqual({ "metadata[organizationId]": organization.id });
    expect(checkoutRequest).toMatchObject({
      path: "/v1/checkout/sessions",
      version: endive,
    });
    const billingUrl = `${baseUrl}/organizations/${organization.slug}/settings/billing`;
    const metadata = {
      customerEmail: organization.billingEmail,
      organizationId: organization.id,
      organizationSlug: organization.slug,
      purchasedById: user.id,
    };
    expect(
      Object.fromEntries(checkoutRequest?.parameters.entries() ?? []),
    ).toEqual({
      "automatic_tax[enabled]": "true",
      billing_address_collection: "auto",
      cancel_url: billingUrl,
      customer: customer.id,
      "customer_update[address]": "auto",
      "customer_update[name]": "auto",
      "customer_update[shipping]": "auto",
      "line_items[0][price]": "price_endive",
      "line_items[0][quantity]": "3",
      ...Object.fromEntries(
        Object.entries(metadata).map(([key, value]) => [
          `metadata[${key}]`,
          value,
        ]),
      ),
      mode: "subscription",
      "saved_payment_method_options[payment_method_save]": "enabled",
      ...Object.fromEntries(
        Object.entries(metadata).map(([key, value]) => [
          `subscription_data[metadata][${key}]`,
          value,
        ]),
      ),
      success_url: `${billingUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      "tax_id_collection[enabled]": "true",
    });
    expect(
      await prisma.organization.findUniqueOrThrow({
        select: { stripeCustomerId: true },
        where: { id: organization.id },
      }),
    ).toEqual({ stripeCustomerId: customer.id });
  });

  test("given: portal sessions for invoices, a plan switch, and a cancellation, should: send each at the pinned API version with its flow parameters", async () => {
    const requests: CapturedRequest[] = [];
    server.use(
      http.post(`${stripeUrl}/billing_portal/sessions`, async ({ request }) => {
        requests.push(await capture(request));
        return HttpResponse.json(createStripeCustomerPortalSessionFactory());
      }),
    );
    const customerId = "cus_portal";
    const organizationSlug = "portal-organization";
    const returnUrl = `${baseUrl}/organizations/${organizationSlug}/settings/billing`;

    await createStripeCustomerPortalSession({
      baseUrl,
      customerId,
      organizationSlug,
    });
    await createStripeSwitchPlanSession({
      baseUrl,
      customerId,
      newPriceId: "price_annual",
      organizationSlug,
      quantity: 4,
      subscriptionId: "sub_portal",
      subscriptionItemId: "si_portal",
    });
    await createStripeCancelSubscriptionSession({
      baseUrl,
      customerId,
      organizationSlug,
      subscriptionId: "sub_portal",
    });

    expect(requests.map(({ version }) => version)).toEqual([
      endive,
      endive,
      endive,
    ]);
    expect(
      requests.map(({ parameters }) => Object.fromEntries(parameters)),
    ).toEqual([
      { customer: customerId, return_url: returnUrl },
      {
        customer: customerId,
        "flow_data[subscription_update_confirm][items][0][id]": "si_portal",
        "flow_data[subscription_update_confirm][items][0][price]":
          "price_annual",
        "flow_data[subscription_update_confirm][items][0][quantity]": "4",
        "flow_data[subscription_update_confirm][subscription]": "sub_portal",
        "flow_data[type]": "subscription_update_confirm",
        return_url: returnUrl,
      },
      {
        customer: customerId,
        "flow_data[subscription_cancel][subscription]": "sub_portal",
        "flow_data[type]": "subscription_cancel",
        return_url: returnUrl,
      },
    ]);
  });

  test("given: a seat change on a subscription with a schedule, should: update the subscription and only the future phase quantities at the pinned API version", async () => {
    const now = Math.floor(Date.now() / 1000);
    const day = 86_400;
    const currentPhase = createStripeSubscriptionSchedulePhaseFactory({
      end_date: now + 10 * day,
      start_date: now - 20 * day,
    });
    const futurePhase = createStripeSubscriptionSchedulePhaseFactory({
      end_date: now + 40 * day,
      start_date: now + 10 * day,
    });
    const schedule = createStripeSubscriptionScheduleFactory({
      id: "sub_sched_seats",
      phases: [currentPhase, futurePhase],
    });
    const requests: CapturedRequest[] = [];
    server.use(
      http.post(`${stripeUrl}/subscriptions/sub_seats`, async ({ request }) => {
        requests.push(await capture(request));
        return HttpResponse.json(
          createStripeSubscriptionFactory({ id: "sub_seats" }),
        );
      }),
      http.get(
        `${stripeUrl}/subscription_schedules/${schedule.id}`,
        async ({ request }) => {
          requests.push(await capture(request));
          return HttpResponse.json(schedule);
        },
      ),
      http.post(
        `${stripeUrl}/subscription_schedules/${schedule.id}`,
        async ({ request }) => {
          requests.push(await capture(request));
          return HttpResponse.json(schedule);
        },
      ),
    );

    await adjustSeats({
      newQuantity: 7,
      stripeScheduleId: schedule.id,
      subscriptionId: "sub_seats",
      subscriptionItemId: "si_seats",
    });

    expect(
      requests.map(({ method, path, version }) => ({ method, path, version })),
    ).toEqual([
      { method: "POST", path: "/v1/subscriptions/sub_seats", version: endive },
      {
        method: "GET",
        path: `/v1/subscription_schedules/${schedule.id}`,
        version: endive,
      },
      {
        method: "POST",
        path: `/v1/subscription_schedules/${schedule.id}`,
        version: endive,
      },
    ]);
    expect(Object.fromEntries(requests[0]?.parameters ?? [])).toEqual({
      "items[0][id]": "si_seats",
      "items[0][quantity]": "7",
    });
    expect(Object.fromEntries(requests[2]?.parameters ?? [])).toEqual({
      "phases[0][end_date]": String(currentPhase.end_date),
      "phases[0][items][0][quantity]": String(currentPhase.items[0]?.quantity),
      "phases[0][start_date]": String(currentPhase.start_date),
      "phases[1][end_date]": String(futurePhase.end_date),
      "phases[1][items][0][quantity]": "7",
      "phases[1][start_date]": String(futurePhase.start_date),
    });
  });
});
