import { describe, expect, test } from "vitest";

import {
  setupUserWithOrgAndAddAsMember,
  setupUserWithTrialOrgAndAddAsMember,
} from "./server-test-utils";
import { teardownOrganizationAndMember } from "./test-utils";
import {
  createPopulatedStripeSubscriptionSchedule,
  createPopulatedStripeSubscriptionSchedulePhase,
} from "~/features/billing/billing-factories.server";
import { createPopulatedNotification } from "~/features/notifications/notifications-factories.server";
import {
  createPopulatedOrganizationEmailInviteLink,
  createPopulatedOrganizationInviteLink,
} from "~/features/organizations/organizations-factories.server";
import { deleteOrganizationFromDatabaseById } from "~/features/organizations/organizations-model.server";
import { deleteUserAccountFromDatabaseById } from "~/features/user-accounts/user-accounts-model.server";
import { prisma } from "~/utils/database.server";

describe("teardownOrganizationAndMember()", () => {
  test.each(["organization", "user", "both"])(
    "given: the test deliberately deleted $0, should: remove any remaining target and allow repeated teardown",
    async (deletedTarget) => {
      const { organization, user } =
        await setupUserWithTrialOrgAndAddAsMember();

      if (deletedTarget === "organization" || deletedTarget === "both") {
        await deleteOrganizationFromDatabaseById(organization.id);
      }
      if (deletedTarget === "user" || deletedTarget === "both") {
        await deleteUserAccountFromDatabaseById(user.id);
      }

      await expect(
        teardownOrganizationAndMember({ organization, user }),
      ).resolves.toEqual(undefined);
      await expect(
        teardownOrganizationAndMember({ organization, user }),
      ).resolves.toEqual(undefined);
      expect(
        await prisma.organization.findUnique({
          where: { id: organization.id },
        }),
      ).toEqual(null);
      expect(
        await prisma.userAccount.findUnique({ where: { id: user.id } }),
      ).toEqual(null);
    },
  );

  test("given: related invitations, billing records, and notifications, should: cascade cleanup and retain shared prices and unrelated records", async () => {
    const { organization, subscription, user } =
      await setupUserWithOrgAndAddAsMember();
    const unrelated = await setupUserWithTrialOrgAndAddAsMember();
    // oxlint-disable-next-line typescript/no-non-null-assertion -- This fixture creates a subscription item.
    const priceId = subscription.items[0]!.priceId;

    const invite = await prisma.organizationInviteLink.create({
      data: {
        ...createPopulatedOrganizationInviteLink({
          creatorId: user.id,
          organizationId: organization.id,
        }),
        linkUsages: { create: { userId: user.id } },
      },
    });
    const emailInvite = await prisma.organizationEmailInviteLink.create({
      data: createPopulatedOrganizationEmailInviteLink({
        invitedById: user.id,
        organizationId: organization.id,
      }),
    });
    const notification = await prisma.notification.create({
      data: {
        ...createPopulatedNotification({ organizationId: organization.id }),
        recipients: { create: { userId: user.id } },
      },
    });
    const schedule = await prisma.stripeSubscriptionSchedule.create({
      data: createPopulatedStripeSubscriptionSchedule({
        subscriptionId: subscription.stripeId,
      }),
    });
    await prisma.stripeSubscriptionSchedulePhase.create({
      data: createPopulatedStripeSubscriptionSchedulePhase({
        priceId,
        scheduleId: schedule.stripeId,
      }),
    });

    await teardownOrganizationAndMember({ organization, user });

    const remainingRelatedRows = await Promise.all([
      prisma.organization.count({ where: { id: organization.id } }),
      prisma.userAccount.count({ where: { id: user.id } }),
      prisma.organizationMembership.count({
        where: { organizationId: organization.id },
      }),
      prisma.organizationInviteLink.count({ where: { id: invite.id } }),
      prisma.inviteLinkUse.count({ where: { inviteLinkId: invite.id } }),
      prisma.organizationEmailInviteLink.count({
        where: { id: emailInvite.id },
      }),
      prisma.stripeSubscription.count({
        where: { stripeId: subscription.stripeId },
      }),
      prisma.stripeSubscriptionItem.count({
        where: { stripeSubscriptionId: subscription.stripeId },
      }),
      prisma.stripeSubscriptionSchedule.count({
        where: { stripeId: schedule.stripeId },
      }),
      prisma.stripeSubscriptionSchedulePhase.count({
        where: { scheduleId: schedule.stripeId },
      }),
      prisma.notification.count({ where: { id: notification.id } }),
      prisma.notificationRecipient.count({
        where: { notificationId: notification.id },
      }),
      prisma.notificationPanel.count({
        where: { organizationId: organization.id },
      }),
    ]);
    expect(remainingRelatedRows).toEqual(Array(13).fill(0));
    expect(
      await prisma.stripePrice.count({ where: { stripeId: priceId } }),
    ).toEqual(1);
    expect(
      await prisma.organization.count({
        where: { id: unrelated.organization.id },
      }),
    ).toEqual(1);
    expect(
      await prisma.userAccount.count({ where: { id: unrelated.user.id } }),
    ).toEqual(1);
  });
});
