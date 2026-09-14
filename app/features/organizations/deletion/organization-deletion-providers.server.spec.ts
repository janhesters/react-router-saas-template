import { HttpResponse, http } from "msw";
import type Stripe from "stripe";
import { describe, expect, test } from "vitest";

import { cleanupOrganizationDeletionResource } from "./organization-deletion-providers.server";
import {
  createStripeCheckoutSessionFactory,
  createStripeCustomerFactory,
  createStripeSubscriptionFactory,
  createStripeSubscriptionScheduleFactory,
} from "~/features/billing/stripe-factories.server";
import { stripeHandlers } from "~/test/mocks/handlers/stripe";
import { setupMockServerLifecycle } from "~/test/msw-test-utils";
import { setupUserWithTrialOrgAndAddAsMember } from "~/test/server-test-utils";
import { prisma } from "~/utils/database.server";

const server = setupMockServerLifecycle(...stripeHandlers);
const stripeUrl = "https://api.stripe.com/v1";
const customerId = "cus_organization_deletion";
const cleanupCustomer = () =>
  cleanupOrganizationDeletionResource({
    kind: "stripeCustomer",
    target: customerId,
  });
const listResponse = (url: string, data: unknown[], has_more = false) =>
  HttpResponse.json({ data, has_more, object: "list", url });
const stripeError = (status: number, code: string) =>
  HttpResponse.json(
    {
      error: { code, message: code, type: "invalid_request_error" },
    },
    { headers: { "stripe-should-retry": "false" }, status },
  );

describe("organization provider cleanup", () => {
  test("expires checkouts, cancels every billable status and future schedule across pages, then deletes the customer", async () => {
    const operations: string[] = [];
    const pages: string[] = [];
    const statuses: Stripe.Subscription.Status[] = [
      "active",
      "trialing",
      "past_due",
      "unpaid",
      "paused",
      "incomplete",
      "canceled",
      "incomplete_expired",
    ];
    server.use(
      http.get(`${stripeUrl}/checkout/sessions`, ({ request }) => {
        const after = new URL(request.url).searchParams.get("starting_after");
        expect(new URL(request.url).searchParams.get("status")).toBe("open");
        pages.push(`checkout:${after ?? "first"}`);
        return listResponse(
          "/v1/checkout/sessions",
          [
            createStripeCheckoutSessionFactory({
              id: after ? "cs_second" : "cs_first",
              status: "open",
            }),
          ],
          !after,
        );
      }),
      http.post(`${stripeUrl}/checkout/sessions/:id/expire`, ({ params }) => {
        operations.push(`expire:${String(params.id)}`);
        return HttpResponse.json(
          createStripeCheckoutSessionFactory({
            id: params.id as string,
            status: "expired",
          }),
        );
      }),
      http.get(`${stripeUrl}/subscription_schedules`, ({ request }) => {
        const after = new URL(request.url).searchParams.get("starting_after");
        pages.push(`schedule:${after ?? "first"}`);
        return listResponse(
          "/v1/subscription_schedules",
          after
            ? [
                createStripeSubscriptionScheduleFactory({
                  id: "sched_future",
                  status: "not_started",
                }),
                createStripeSubscriptionScheduleFactory({
                  id: "sched_completed",
                  status: "completed",
                }),
              ]
            : [
                createStripeSubscriptionScheduleFactory({
                  id: "sched_active",
                  status: "active",
                }),
              ],
          !after,
        );
      }),
      http.post(
        `${stripeUrl}/subscription_schedules/:id/cancel`,
        async ({ params, request }) => {
          operations.push(`schedule:${String(params.id)}`);
          expect(
            new URLSearchParams(await request.text()).get("invoice_now"),
          ).toBe("false");
          return HttpResponse.json(
            createStripeSubscriptionScheduleFactory({
              id: params.id as string,
              status: "canceled",
            }),
          );
        },
      ),
      http.get(`${stripeUrl}/subscriptions`, ({ request }) => {
        const query = new URL(request.url).searchParams;
        expect(query.get("status")).toBe("all");
        const after = query.get("starting_after");
        pages.push(`subscription:${after ?? "first"}`);
        return listResponse(
          "/v1/subscriptions",
          (after ? statuses.slice(3) : statuses.slice(0, 3)).map((status) =>
            createStripeSubscriptionFactory({ id: `sub_${status}`, status }),
          ),
          !after,
        );
      }),
      http.delete(`${stripeUrl}/subscriptions/:id`, ({ params }) => {
        operations.push(`subscription:${String(params.id)}`);
        return HttpResponse.json(
          createStripeSubscriptionFactory({
            id: params.id as string,
            status: "canceled",
          }),
        );
      }),
      http.delete(`${stripeUrl}/customers/:id`, ({ params }) => {
        operations.push(`customer:${String(params.id)}`);
        return HttpResponse.json({
          deleted: true,
          id: params.id,
          object: "customer",
        });
      }),
    );

    await cleanupCustomer();

    expect(operations).toEqual([
      "expire:cs_first",
      "expire:cs_second",
      "schedule:sched_active",
      "schedule:sched_future",
      ...statuses.slice(0, 6).map((status) => `subscription:sub_${status}`),
      `customer:${customerId}`,
    ]);
    expect(pages).toEqual([
      "checkout:first",
      "checkout:cs_first",
      "schedule:first",
      "schedule:sched_active",
      "subscription:first",
      "subscription:sub_past_due",
    ]);
  });

  test.each(["deleted", "missing"])(
    "a confirmed %s customer makes repeated cleanup succeed",
    async (state) => {
      server.use(
        http.get(`${stripeUrl}/customers/:id`, () =>
          state === "missing"
            ? stripeError(404, "resource_missing")
            : HttpResponse.json({
                deleted: true,
                id: customerId,
                object: "customer",
              }),
        ),
      );
      await expect(cleanupCustomer()).resolves.toBeUndefined();
    },
  );

  test("recovers a historical customer from its subscription and deletes that customer's resources", async () => {
    const legacyCustomerId = "cus_legacy_organization";
    let deletedCustomer: string | undefined;
    server.use(
      http.get(`${stripeUrl}/subscriptions/sub_legacy`, () =>
        HttpResponse.json(
          createStripeSubscriptionFactory({
            customer: legacyCustomerId,
            id: "sub_legacy",
          }),
        ),
      ),
      http.get(`${stripeUrl}/subscriptions`, ({ request }) => {
        expect(new URL(request.url).searchParams.get("customer")).toBe(
          legacyCustomerId,
        );
        return listResponse("/v1/subscriptions", []);
      }),
      http.delete(`${stripeUrl}/customers/:id`, ({ params }) => {
        deletedCustomer = params.id as string;
        return HttpResponse.json({
          deleted: true,
          id: params.id,
          object: "customer",
        });
      }),
    );
    await cleanupOrganizationDeletionResource({
      kind: "stripeSubscription",
      target: "sub_legacy",
    });
    expect(deletedCustomer).toBe(legacyCustomerId);
  });

  test("a confirmed missing historical subscription succeeds but failed retrieval remains retryable", async () => {
    server.use(
      http.get(`${stripeUrl}/subscriptions/sub_legacy`, () =>
        stripeError(404, "resource_missing"),
      ),
    );
    await expect(
      cleanupOrganizationDeletionResource({
        kind: "stripeSubscription",
        target: "sub_legacy",
      }),
    ).resolves.toBeUndefined();
    server.use(
      http.get(`${stripeUrl}/subscriptions/sub_legacy`, () =>
        stripeError(403, "permission_denied"),
      ),
    );
    await expect(
      cleanupOrganizationDeletionResource({
        kind: "stripeSubscription",
        target: "sub_legacy",
      }),
    ).rejects.toThrow("permission_denied");
  });

  test("does not acknowledge an authorization failure as a missing customer", async () => {
    server.use(
      http.get(`${stripeUrl}/customers/:id`, () =>
        stripeError(403, "permission_denied"),
      ),
    );
    await expect(cleanupCustomer()).rejects.toThrow("permission_denied");
  });

  test("keeps cleanup pending when subscription cancellation fails", async () => {
    let deleted = false;
    server.use(
      http.delete(`${stripeUrl}/subscriptions/:id`, () =>
        stripeError(403, "permission_denied"),
      ),
      http.delete(`${stripeUrl}/customers/:id`, () => {
        deleted = true;
        return HttpResponse.json({
          deleted: true,
          id: customerId,
          object: "customer",
        });
      }),
    );
    await expect(cleanupCustomer()).rejects.toThrow("permission_denied");
    expect(deleted).toBe(false);
  });

  test("retries a cancellation whose earlier successful response was lost", async () => {
    server.use(
      http.delete(`${stripeUrl}/subscriptions/:id`, () =>
        stripeError(400, "already_canceled"),
      ),
      http.get(`${stripeUrl}/subscriptions/:id`, ({ params }) =>
        HttpResponse.json(
          createStripeSubscriptionFactory({
            id: params.id as string,
            status: "canceled",
          }),
        ),
      ),
    );
    await expect(cleanupCustomer()).resolves.toBeUndefined();
  });

  test("does not mark customer deletion complete if the provider fails", async () => {
    server.use(
      http.get(`${stripeUrl}/customers/:id`, () =>
        HttpResponse.json(createStripeCustomerFactory({ id: customerId })),
      ),
      http.delete(`${stripeUrl}/customers/:id`, () =>
        stripeError(403, "permission_denied"),
      ),
    );
    await expect(cleanupCustomer()).rejects.toThrow("permission_denied");
  });

  test("checks Supabase's returned error and accepts successful removal of an already absent object", async () => {
    const path = "app-images/organization-logos/org_1.png";
    const url = `${process.env.VITE_SUPABASE_URL}/storage/v1/object/app-images`;
    server.use(
      http.delete(url, () =>
        HttpResponse.json(
          {
            error: "AccessDenied",
            message: "Access denied",
            statusCode: "403",
          },
          { status: 403 },
        ),
      ),
    );
    await expect(
      cleanupOrganizationDeletionResource({
        kind: "storageObject",
        target: path,
      }),
    ).rejects.toThrow("Access denied");

    server.use(
      http.delete(url, async ({ request }) => {
        expect(await request.json()).toEqual({
          prefixes: ["organization-logos/org_1.png"],
        });
        return HttpResponse.json([]);
      }),
    );
    await expect(
      cleanupOrganizationDeletionResource({
        kind: "storageObject",
        target: path,
      }),
    ).resolves.toBeUndefined();
  });

  test.each(["user", "organization"] as const)(
    "retains a deleted organization's logo referenced by another %s",
    async (reference) => {
      const { organization, user } =
        await setupUserWithTrialOrgAndAddAsMember();
      const target =
        "app-images/organization-logos/deleted_owner/7a4b0ab8-3d45-48b5-aad9-c20119913355.png";
      const imageUrl = `${process.env.VITE_SUPABASE_URL}/storage/v1/render/image/public/${target}?width=80`;
      if (reference === "user") {
        await prisma.userAccount.update({
          data: { imageUrl },
          where: { id: user.id },
        });
      } else {
        await prisma.organization.update({
          data: { imageUrl },
          where: { id: organization.id },
        });
      }
      let removed = false;
      server.use(
        http.delete(
          `${process.env.VITE_SUPABASE_URL}/storage/v1/object/app-images`,
          () => {
            removed = true;
            return HttpResponse.json([]);
          },
        ),
      );
      await cleanupOrganizationDeletionResource({
        kind: "storageObject",
        target,
      });
      expect(removed).toBe(false);
    },
  );
});
