import { HttpResponse, http } from "msw";
import { describe, expect, onTestFinished, test, vi } from "vitest";

import { teamMembersAction } from "./team-members-action.server";
import { CHANGE_ROLE_INTENT } from "./team-members-constants";
import { createStripeSubscriptionFactory } from "~/features/billing/stripe-factories.server";
import { createStripeSubscriptionInDatabase } from "~/features/billing/stripe-subscription-model.server";
import { withOrganizationMutationLock } from "~/features/organizations/deletion/organization-mutation-lock.server";
import { requestAccountDeletion } from "~/features/user-accounts/deletion/account-deletion.server";
import { createPopulatedUserAccount } from "~/features/user-accounts/user-accounts-factories.server";
import type { Organization, UserAccount } from "~/generated/client";
import { stripeHandlers } from "~/test/mocks/handlers/stripe";
import { supabaseHandlers } from "~/test/mocks/handlers/supabase";
import { setupMockServerLifecycle } from "~/test/msw-test-utils";
import { setupUserWithTrialOrgAndAddAsMember } from "~/test/server-test-utils";
import {
  createAuthenticatedRequest,
  createOrganizationMembershipTestContextProvider,
} from "~/test/test-utils";
import { prisma } from "~/utils/database.server";
import { toFormData } from "~/utils/to-form-data";

const server = setupMockServerLifecycle(...supabaseHandlers, ...stripeHandlers);

async function setupOwners() {
  const { organization, user } = await setupUserWithTrialOrgAndAddAsMember({
    role: "owner",
  });
  const coOwner = createPopulatedUserAccount();
  onTestFinished(async () => {
    await prisma.accountDeletion.deleteMany({ where: { id: user.id } });
    await prisma.userAccount.deleteMany({ where: { id: coOwner.id } });
  });
  await prisma.userAccount.create({
    data: {
      ...coOwner,
      memberships: {
        create: { organizationId: organization.id, role: "owner" },
      },
    },
  });
  return { coOwner, organization, user };
}

async function prepareRoleChange({
  organization,
  role,
  targetUserId,
  user,
}: {
  organization: Organization;
  role: "member" | "admin" | "deactivated";
  targetUserId: string;
  user: UserAccount;
}) {
  const request = await createAuthenticatedRequest({
    formData: toFormData({
      intent: CHANGE_ROLE_INTENT,
      role,
      userId: targetUserId,
    }),
    method: "POST",
    url: `http://localhost:3000/organizations/${organization.slug}/settings/members`,
    user,
  });
  const params = { organizationSlug: organization.slug };
  const pattern = "/organizations/:organizationSlug/settings/members";
  const context = await createOrganizationMembershipTestContextProvider({
    params,
    pattern,
    request,
  });
  return () =>
    teamMembersAction({
      context,
      params,
      pattern,
      request,
      url: new URL(request.url),
    });
}

describe("membership mutations across account deletion", () => {
  test("given: the advisory connection dies while an owner deactivation waits for Stripe, should: reject the resumed callback after the actor deletes their account", async () => {
    const { coOwner, organization, user } = await setupOwners();
    const subscription = createStripeSubscriptionFactory({
      metadata: { organizationId: organization.id, purchasedById: user.id },
    });
    const price = await prisma.stripePrice.findFirstOrThrow();
    for (const item of subscription.items.data) item.price.id = price.stripeId;
    await createStripeSubscriptionInDatabase(subscription);
    const changeRole = await prepareRoleChange({
      organization,
      role: "deactivated",
      targetUserId: coOwner.id,
      user,
    });

    await withOrganizationMutationLock(organization.id, async () => undefined);
    const pool = globalThis.__organizationMutationLockPool;
    if (!pool) throw new Error("Mutation lock pool was not initialized");
    const lockClient = await pool.connect();
    const contender = await pool.connect();
    const { rows } = await lockClient.query<{ pid: number }>(
      "SELECT pg_backend_pid() AS pid",
    );
    const backend = rows[0];
    if (!backend) throw new Error("Expected the lock connection backend");
    const connect = vi
      .spyOn(pool, "connect")
      .mockImplementationOnce((() =>
        Promise.resolve(lockClient)) as typeof pool.connect);
    const disconnected = new Promise<void>((resolve) =>
      lockClient.once("error", () => resolve()),
    );
    server.use(
      http.post(
        `https://api.stripe.com/v1/subscriptions/${subscription.id}`,
        async () => {
          // Terminate only this action's advisory connection. Its application
          // callback is still awaiting Stripe and will resume after deletion.
          await contender.query("SELECT pg_terminate_backend($1)", [
            backend.pid,
          ]);
          await disconnected;
          await requestAccountDeletion({
            confirmation: user.email,
            userId: user.id,
          });
          return HttpResponse.json(subscription);
        },
      ),
    );

    try {
      const result = await Promise.allSettled([changeRole()]);

      expect(
        await prisma.userAccount.findUnique({ where: { id: user.id } }),
      ).toBeNull();
      expect(
        await prisma.organizationMembership.findUniqueOrThrow({
          where: {
            memberId_organizationId: {
              memberId: coOwner.id,
              organizationId: organization.id,
            },
          },
        }),
      ).toMatchObject({ deactivatedAt: null, role: "owner" });
      expect(result).toMatchObject([
        { status: "fulfilled", value: { init: { status: 403 } } },
      ]);
    } finally {
      connect.mockRestore();
      contender.release();
    }
  });

  test("given: overlapping requests deactivate the same active member, should: remove only one billed seat", async () => {
    const { coOwner, organization, user } = await setupOwners();
    const subscription = createStripeSubscriptionFactory({
      metadata: { organizationId: organization.id, purchasedById: user.id },
    });
    const price = await prisma.stripePrice.findFirstOrThrow();
    for (const item of subscription.items.data) item.price.id = price.stripeId;
    await createStripeSubscriptionInDatabase(subscription);
    const changes = await Promise.all(
      [0, 1].map(() =>
        prepareRoleChange({
          organization,
          role: "deactivated",
          targetUserId: coOwner.id,
          user,
        }),
      ),
    );
    const quantities: Array<string | null> = [];
    server.use(
      http.post(
        `https://api.stripe.com/v1/subscriptions/${subscription.id}`,
        async ({ request }) => {
          const body = new URLSearchParams(await request.text());
          quantities.push(body.get("items[0][quantity]"));
          return HttpResponse.json(subscription);
        },
      ),
    );

    await Promise.all(changes.map((change) => change()));

    expect(quantities).toEqual(["1"]);
    expect(
      await prisma.organizationMembership.count({
        where: { deactivatedAt: null, organizationId: organization.id },
      }),
    ).toEqual(1);
  });

  test("given: a member whose deactivation is in the future changes role, should: keep the already counted seat", async () => {
    const { coOwner, organization, user } = await setupOwners();
    await prisma.organizationMembership.update({
      data: { deactivatedAt: new Date(Date.now() + 60_000) },
      where: {
        memberId_organizationId: {
          memberId: coOwner.id,
          organizationId: organization.id,
        },
      },
    });
    const subscription = createStripeSubscriptionFactory({
      metadata: { organizationId: organization.id, purchasedById: user.id },
    });
    const price = await prisma.stripePrice.findFirstOrThrow();
    for (const item of subscription.items.data) item.price.id = price.stripeId;
    await createStripeSubscriptionInDatabase(subscription);
    const changeRole = await prepareRoleChange({
      organization,
      role: "member",
      targetUserId: coOwner.id,
      user,
    });
    const quantities: Array<string | null> = [];
    server.use(
      http.post(
        `https://api.stripe.com/v1/subscriptions/${subscription.id}`,
        async ({ request }) => {
          const body = new URLSearchParams(await request.text());
          quantities.push(body.get("items[0][quantity]"));
          return HttpResponse.json(subscription);
        },
      ),
    );

    await changeRole();

    expect(quantities).toEqual([]);
    expect(
      await prisma.organizationMembership.findUniqueOrThrow({
        where: {
          memberId_organizationId: {
            memberId: coOwner.id,
            organizationId: organization.id,
          },
        },
      }),
    ).toMatchObject({ deactivatedAt: null, role: "member" });
  });

  test("given: another account deleted after middleware counted seats, should: use the remaining membership count when deactivating a member", async () => {
    const { coOwner, organization, user } = await setupOwners();
    const target = createPopulatedUserAccount();
    onTestFinished(async () => {
      await prisma.accountDeletion.deleteMany({ where: { id: coOwner.id } });
      await prisma.userAccount.deleteMany({ where: { id: target.id } });
    });
    await prisma.userAccount.create({
      data: {
        ...target,
        memberships: {
          create: { organizationId: organization.id, role: "member" },
        },
      },
    });
    const subscription = createStripeSubscriptionFactory({
      metadata: { organizationId: organization.id, purchasedById: user.id },
    });
    const price = await prisma.stripePrice.findFirstOrThrow();
    for (const item of subscription.items.data) item.price.id = price.stripeId;
    await createStripeSubscriptionInDatabase(subscription);
    const changeRole = await prepareRoleChange({
      organization,
      role: "deactivated",
      targetUserId: target.id,
      user,
    });
    await requestAccountDeletion({
      confirmation: coOwner.email,
      userId: coOwner.id,
    });
    let quantity: string | null = null;
    server.use(
      http.post(
        `https://api.stripe.com/v1/subscriptions/${subscription.id}`,
        async ({ request }) => {
          const body = new URLSearchParams(await request.text());
          quantity = body.get("items[0][quantity]");
          return HttpResponse.json(subscription);
        },
      ),
    );

    await changeRole();

    expect(quantity).toEqual("1");
    expect(
      await prisma.organizationMembership.count({
        where: { deactivatedAt: null, organizationId: organization.id },
      }),
    ).toEqual(1);
  });

  test.each(["member", "admin", "deactivated"] as const)(
    "given: an owner account deleted after middleware authorized changing a co-owner to %s, should: reject the stale mutation and retain the remaining owner",
    async (role) => {
      const { coOwner, organization, user } = await setupOwners();
      const changeRole = await prepareRoleChange({
        organization,
        role,
        targetUserId: coOwner.id,
        user,
      });
      await requestAccountDeletion({
        confirmation: user.email,
        userId: user.id,
      });

      expect(await changeRole()).toMatchObject({ init: { status: 403 } });
      expect(
        await prisma.organizationMembership.findUniqueOrThrow({
          where: {
            memberId_organizationId: {
              memberId: coOwner.id,
              organizationId: organization.id,
            },
          },
        }),
      ).toMatchObject({ deactivatedAt: null, role: "owner" });
    },
  );

  test.each(["member", "admin", "deactivated"] as const)(
    "given: an owner's membership changed to %s after middleware authorized a demotion, should: recheck current permissions before changing another owner",
    async (status) => {
      const { coOwner, organization, user } = await setupOwners();
      const changeRole = await prepareRoleChange({
        organization,
        role: "member",
        targetUserId: coOwner.id,
        user,
      });
      await prisma.organizationMembership.update({
        data:
          status === "deactivated"
            ? { deactivatedAt: new Date() }
            : { role: status },
        where: {
          memberId_organizationId: {
            memberId: user.id,
            organizationId: organization.id,
          },
        },
      });

      expect(await changeRole()).toMatchObject({ init: { status: 403 } });
      expect(
        await prisma.organizationMembership.findUniqueOrThrow({
          where: {
            memberId_organizationId: {
              memberId: coOwner.id,
              organizationId: organization.id,
            },
          },
        }),
      ).toMatchObject({ deactivatedAt: null, role: "owner" });
    },
  );
});
