import { HttpResponse, http } from "msw";
import { describe, expect, onTestFinished, test } from "vitest";

import { teamMembersAction } from "./team-members-action.server";
import { CHANGE_ROLE_INTENT } from "./team-members-constants";
import { createStripeSubscriptionFactory } from "~/features/billing/stripe-factories.server";
import { createStripeSubscriptionInDatabase } from "~/features/billing/stripe-subscription-model.server";
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
  user,
  targetUserId,
  role,
}: {
  organization: Organization;
  user: UserAccount;
  targetUserId: string;
  role: "member" | "admin" | "deactivated";
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
