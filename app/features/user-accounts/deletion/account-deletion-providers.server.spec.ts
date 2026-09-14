import { randomUUID } from "node:crypto";
import { AuthApiError } from "@supabase/supabase-js";
import { HttpResponse, http } from "msw";
import type Stripe from "stripe";
import { afterEach, describe, expect, onTestFinished, test, vi } from "vitest";

import { cleanupAccountDeletionResource } from "./account-deletion-providers.server";
import {
  createStripeSubscriptionFactory,
  createStripeSubscriptionScheduleFactory,
} from "~/features/billing/stripe-factories.server";
import { createPopulatedUserAccount } from "~/features/user-accounts/user-accounts-factories.server";
import { supabaseAdminClient } from "~/features/user-authentication/supabase.server";
import { stripeHandlers } from "~/test/mocks/handlers/stripe";
import { setupMockServerLifecycle } from "~/test/msw-test-utils";
import { setupUserWithTrialOrgAndAddAsMember } from "~/test/server-test-utils";
import { prisma } from "~/utils/database.server";

const server = setupMockServerLifecycle(...stripeHandlers);
const STRIPE_URL = "https://api.stripe.com/v1";
afterEach(() => {
  vi.restoreAllMocks();
});

describe("account provider cleanup", () => {
  test("given: an Auth API failure, should: preserve the failure for durable retry", async () => {
    const error = new AuthApiError(
      "Auth unavailable",
      500,
      "unexpected_failure",
    );
    vi.spyOn(supabaseAdminClient.auth.admin, "deleteUser").mockResolvedValue({
      data: { user: null },
      error,
    });
    await expect(
      cleanupAccountDeletionResource({
        kind: "authUser",
        target: randomUUID(),
      }),
    ).rejects.toEqual(error);
  });

  test("given: an Auth user already deleted by a prior attempt, should: acknowledge cleanup", async () => {
    vi.spyOn(supabaseAdminClient.auth.admin, "deleteUser").mockResolvedValue({
      data: { user: null },
      error: new AuthApiError("User missing", 404, "user_not_found"),
    });
    await expect(
      cleanupAccountDeletionResource({
        kind: "authUser",
        target: randomUUID(),
      }),
    ).resolves.toEqual(undefined);
  });

  test("given: an unrelated Auth 404, should: avoid acknowledging a deletion that was not confirmed", async () => {
    const error = new AuthApiError("Wrong endpoint", 404, "unexpected_failure");
    vi.spyOn(supabaseAdminClient.auth.admin, "deleteUser").mockResolvedValue({
      data: { user: null },
      error,
    });
    await expect(
      cleanupAccountDeletionResource({
        kind: "authUser",
        target: randomUUID(),
      }),
    ).rejects.toEqual(error);
  });

  test("given: an invalid avatar cleanup target, should: reject without sending storage requests", async () => {
    const storage = vi.spyOn(supabaseAdminClient.storage, "from");
    await expect(
      cleanupAccountDeletionResource({
        kind: "storageObject",
        target: "app-images/organization-logos/other.png",
      }),
    ).rejects.toThrow("Invalid account storage target");
    expect(storage).not.toHaveBeenCalled();
  });

  test("given: an avatar still referenced by a live account, should: retain the shared image", async () => {
    const { user } = await setupUserWithTrialOrgAndAddAsMember();
    const target = `app-images/user-avatars/${user.id}/${randomUUID()}.png`;
    await prisma.userAccount.update({
      data: {
        imageUrl: new URL(
          `/storage/v1/render/image/public/${target}?width=64`,
          process.env.VITE_SUPABASE_URL,
        ).href,
      },
      where: { id: user.id },
    });
    const storage = vi.spyOn(supabaseAdminClient.storage, "from");
    await cleanupAccountDeletionResource({ kind: "storageObject", target });
    expect(storage).not.toHaveBeenCalled();
  });

  async function setupBilling() {
    const { user, organization } = await setupUserWithTrialOrgAndAddAsMember();
    const current = createStripeSubscriptionFactory({
      metadata: { organizationId: organization.id, purchasedById: user.id },
    });
    await prisma.stripeSubscription.create({
      data: {
        cancelAtPeriodEnd: false,
        created: new Date(current.created * 1000),
        organizationId: organization.id,
        purchasedById: user.id,
        status: "active",
        stripeId: current.id,
      },
    });
    const updates: URLSearchParams[] = [];
    server.use(
      http.get(`${STRIPE_URL}/subscriptions/${current.id}`, () =>
        HttpResponse.json(current),
      ),
      http.post(
        `${STRIPE_URL}/subscriptions/${current.id}`,
        async ({ request }) => {
          updates.push(new URLSearchParams(await request.text()));
          return HttpResponse.json(current);
        },
      ),
    );
    return { current, organization, updates, user };
  }

  test("given: a retained subscription and memberships changed since admission, should: reconcile the current seat count with the actual subscription item ID", async () => {
    const { organization, current, updates } = await setupBilling();
    const other = createPopulatedUserAccount();
    onTestFinished(async () => {
      await prisma.userAccount.deleteMany({ where: { id: other.id } });
    });
    await prisma.userAccount.create({
      data: {
        ...other,
        memberships: {
          create: { organizationId: organization.id, role: "member" },
        },
      },
    });
    await cleanupAccountDeletionResource({
      kind: "billingSeats",
      target: organization.id,
    });
    expect(updates).toHaveLength(1);
    expect(updates[0]?.get("items[0][id]")).toEqual(current.items.data[0]?.id);
    expect(updates[0]?.get("items[0][quantity]")).toEqual("2");
    expect(
      await prisma.organization.count({ where: { id: organization.id } }),
    ).toEqual(1);
  });

  test("given: scheduled plan changes, should: preserve phase prices while reconciling future seat quantities", async () => {
    const { organization, current, updates } = await setupBilling();
    const now = Math.floor(Date.now() / 1000);
    const schedule = createStripeSubscriptionScheduleFactory({
      status: "active",
    });
    const phase = schedule.phases[0];
    if (!phase) throw new Error("Schedule fixture must contain a phase");
    const phaseItem = phase.items[0];
    if (!phaseItem) throw new Error("Schedule fixture must contain an item");
    const configuredPhase = {
      ...phase,
      collection_method: "send_invoice" as const,
      default_payment_method: "pm_retained",
      default_tax_rates: [{ id: "txr_phase" } as Stripe.TaxRate],
      description: "Keep this phase",
      discounts: [{ coupon: null, discount: "di_phase", promotion_code: null }],
      invoice_settings: {
        account_tax_ids: ["txi_retained"],
        custom_fields: [{ name: "Account", value: "Enterprise" }],
        days_until_due: 14,
        description: "Invoice details",
        footer: "Keep this footer",
        issuer: null,
      },
      metadata: { plan: "retained" },
      proration_behavior: "none" as const,
    };
    const configuredItem = {
      ...phaseItem,
      discounts: [
        { coupon: "coupon_retained", discount: null, promotion_code: null },
      ],
      metadata: { category: "seats" },
      tax_rates: [{ id: "txr_item" } as Stripe.TaxRate],
    };
    schedule.phases = [
      {
        ...configuredPhase,
        end_date: now + 100,
        items: [{ ...configuredItem, price: "price_current", quantity: 4 }],
        start_date: now - 100,
      },
      {
        ...configuredPhase,
        end_date: now + 1000,
        items: [{ ...configuredItem, price: "price_future", quantity: 4 }],
        start_date: now + 100,
        trial_end: now + 200,
      },
    ];
    current.schedule = schedule.id;
    let update: URLSearchParams | undefined;
    server.use(
      http.get(`${STRIPE_URL}/subscription_schedules/${schedule.id}`, () =>
        HttpResponse.json(schedule),
      ),
      http.post(
        `${STRIPE_URL}/subscription_schedules/${schedule.id}`,
        async ({ request }) => {
          update = new URLSearchParams(await request.text());
          return HttpResponse.json(schedule);
        },
      ),
    );
    await cleanupAccountDeletionResource({
      kind: "billingSeats",
      target: organization.id,
    });
    expect(update?.get("phases[0][items][0][price]")).toEqual("price_current");
    expect(update?.get("phases[0][items][0][quantity]")).toEqual("1");
    expect(update?.get("phases[1][items][0][price]")).toEqual("price_future");
    expect(update?.get("phases[1][items][0][quantity]")).toEqual("1");
    expect(updates).toEqual([]);
    for (const index of [0, 1]) {
      expect(update?.get(`phases[${index}][items][0][quantity]`)).toEqual("1");
      expect(update?.get(`phases[${index}][discounts][0][discount]`)).toEqual(
        "di_phase",
      );
      expect(
        update?.get(`phases[${index}][items][0][discounts][0][coupon]`),
      ).toEqual("coupon_retained");
      expect(update?.get(`phases[${index}][metadata][plan]`)).toEqual(
        "retained",
      );
      expect(
        update?.get(`phases[${index}][items][0][metadata][category]`),
      ).toEqual("seats");
      expect(update?.get(`phases[${index}][default_payment_method]`)).toEqual(
        "pm_retained",
      );
      expect(update?.get(`phases[${index}][default_tax_rates][0]`)).toEqual(
        "txr_phase",
      );
      expect(update?.get(`phases[${index}][items][0][tax_rates][0]`)).toEqual(
        "txr_item",
      );
      expect(
        update?.get(`phases[${index}][invoice_settings][account_tax_ids][0]`),
      ).toEqual("txi_retained");
      expect(update?.get(`phases[${index}][invoice_settings][footer]`)).toEqual(
        "Keep this footer",
      );
      expect(update?.get(`phases[${index}][proration_behavior]`)).toEqual(
        "none",
      );
    }
    expect(update?.get("phases[1][trial_end]")).toEqual(String(now + 200));
  });

  test("given: an organization already deleted after the account request, should: leave its Stripe cleanup to the organization job", async () => {
    await expect(
      cleanupAccountDeletionResource({
        kind: "billingSeats",
        target: randomUUID(),
      }),
    ).resolves.toEqual(undefined);
  });
});
