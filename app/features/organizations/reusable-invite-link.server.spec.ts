import { createId } from "@paralleldrive/cuid2";
import type { i18n } from "i18next";
import { describe, expect, onTestFinished, test } from "vitest";

import { createPopulatedOrganizationInviteLink } from "./organizations-factories.server";
import { acceptInviteLink } from "./organizations-helpers.server";
import {
  createPopulatedStripePrice,
  createPopulatedStripeProduct,
} from "~/features/billing/billing-factories.server";
import { createPopulatedUserAccount } from "~/features/user-accounts/user-accounts-factories.server";
import { stripeHandlers } from "~/test/mocks/handlers/stripe";
import { setupMockServerLifecycle } from "~/test/msw-test-utils";
import { setupUserWithOrgAndAddAsMember } from "~/test/server-test-utils";
import { prisma } from "~/utils/database.server";

const testI18n = { t: (key: string) => key } as unknown as i18n;
const server = setupMockServerLifecycle(...stripeHandlers);

async function setup(maxSeats: number) {
  const { organization, subscription, user } =
    await setupUserWithOrgAndAddAsMember({ role: "admin" });
  const product = createPopulatedStripeProduct({ maxSeats });
  const price = createPopulatedStripePrice({ productId: product.stripeId });
  await prisma.stripeProduct.create({ data: product });
  await prisma.stripePrice.create({ data: price });
  await prisma.stripeSubscriptionItem.updateMany({
    data: { priceId: price.stripeId },
    where: { stripeSubscriptionId: subscription.stripeId },
  });
  onTestFinished(async () => {
    await prisma.stripeProduct.deleteMany({
      where: { stripeId: product.stripeId },
    });
  });
  const link = createPopulatedOrganizationInviteLink({
    creatorId: user.id,
    organizationId: organization.id,
  });
  await prisma.organizationInviteLink.create({ data: link });
  const seatUpdates: Promise<string>[] = [];
  const captureSeatUpdate = ({ request }: { request: Request }) => {
    if (
      request.method === "POST" &&
      /^\/v1\/subscriptions\/[^/]+$/.test(new URL(request.url).pathname)
    ) {
      seatUpdates.push(request.clone().text());
    }
  };
  server.events.on("request:start", captureSeatUpdate);
  onTestFinished(() =>
    server.events.removeListener("request:start", captureSeatUpdate),
  );

  const accept = (userAccountId = user.id, inviteLinkId = link.id) =>
    acceptInviteLink({
      i18n: testI18n,
      inviteLinkId,
      inviteLinkToken: link.token,
      organizationId: organization.id,
      request: new Request(
        `http://localhost:3000/organizations/invite-link?token=${link.token}`,
        { method: "POST" },
      ),
      userAccountId,
    });
  const snapshot = async (memberId = user.id) => ({
    membership: await prisma.organizationMembership.findUnique({
      where: {
        memberId_organizationId: { memberId, organizationId: organization.id },
      },
    }),
    panel: await prisma.notificationPanel.findUnique({
      where: {
        userId_organizationId: {
          organizationId: organization.id,
          userId: memberId,
        },
      },
    }),
    uses: await prisma.inviteLinkUse.findMany({
      where: { inviteLinkId: link.id, userId: memberId },
    }),
  });
  return { accept, link, organization, seatUpdates, snapshot, user };
}

async function createInvitedUser() {
  const user = await prisma.userAccount.create({
    data: createPopulatedUserAccount(),
  });
  onTestFinished(async () => {
    await prisma.userAccount.deleteMany({ where: { id: user.id } });
  });
  return user;
}

describe("acceptInviteLink()", () => {
  test("given: an existing admin in a full organization, should: preserve membership, panel, use history, and Stripe seats on repeated acceptance", async () => {
    const { accept, link, seatUpdates, snapshot, user } = await setup(1);
    await prisma.inviteLinkUse.create({
      data: { inviteLinkId: link.id, userId: user.id },
    });
    const before = await snapshot();

    expect(await accept()).toEqual({ outcome: "alreadyMember" });
    expect(await accept()).toEqual({ outcome: "alreadyMember" });

    expect(await snapshot()).toEqual(before);
    expect(seatUpdates).toEqual([]);
  });

  test("given: concurrent acceptance for one new member and the last seat, should: join once and adjust Stripe seats once", async () => {
    const { accept, seatUpdates, snapshot } = await setup(2);
    const user = await createInvitedUser();

    const results = await Promise.all([accept(user.id), accept(user.id)]);

    expect(results.map((result) => result.outcome).sort()).toEqual([
      "accepted",
      "alreadyMember",
    ]);
    const joined = await snapshot(user.id);
    expect(joined.membership?.role).toEqual("member");
    expect(joined.panel).not.toBeNull();
    expect(joined.uses).toHaveLength(1);
    expect(seatUpdates).toHaveLength(1);
    expect(
      new URLSearchParams(await seatUpdates[0]).get("items[0][quantity]"),
    ).toEqual("2");

    expect(await accept(user.id)).toEqual({ outcome: "alreadyMember" });
    expect(await snapshot(user.id)).toEqual(joined);
    expect(seatUpdates).toHaveLength(1);
  });

  test("given: a full organization and a new member, should: reject without leaving a membership, panel, or invite use", async () => {
    const { accept, seatUpdates, snapshot } = await setup(1);
    const user = await createInvitedUser();

    await expect(accept(user.id)).rejects.toMatchObject({ status: 302 });

    expect(await snapshot(user.id)).toEqual({
      membership: null,
      panel: null,
      uses: [],
    });
    expect(seatUpdates).toEqual([]);
  });

  test("given: an invite-use write failure, should: roll back membership and panel creation and leave Stripe seats unchanged", async () => {
    const { accept, seatUpdates, snapshot } = await setup(2);
    const user = await createInvitedUser();

    await expect(accept(user.id, createId())).rejects.toThrow();

    expect(await snapshot(user.id)).toEqual({
      membership: null,
      panel: null,
      uses: [],
    });
    expect(seatUpdates).toEqual([]);
  });

  test("given: a removed member with a surviving panel and invite use, should: rejoin without duplicating or resetting either record", async () => {
    const { accept, organization, seatUpdates, snapshot } = await setup(2);
    const user = await createInvitedUser();
    await accept(user.id);
    const before = await snapshot(user.id);
    await prisma.organizationMembership.delete({
      where: {
        memberId_organizationId: {
          memberId: user.id,
          organizationId: organization.id,
        },
      },
    });

    expect(await accept(user.id)).toEqual({ outcome: "accepted" });

    const after = await snapshot(user.id);
    expect(after.membership?.role).toEqual("member");
    expect(after.panel).toEqual(before.panel);
    expect(after.uses).toEqual(before.uses);
    expect(seatUpdates).toHaveLength(2);
  });
});
