import type { i18n } from "i18next";
import { HttpResponse, http } from "msw";
import { describe, expect, onTestFinished, test } from "vitest";

import {
  createPopulatedOrganizationEmailInviteLink,
  createPopulatedOrganizationInviteLink,
} from "./organizations-factories.server";
import {
  acceptEmailInvite,
  acceptInviteLink,
} from "./organizations-helpers.server";
import { createStripeSubscriptionFactory } from "~/features/billing/stripe-factories.server";
import { requestAccountDeletion } from "~/features/user-accounts/deletion/account-deletion.server";
import { cleanupAccountDeletionResource } from "~/features/user-accounts/deletion/account-deletion-providers.server";
import { createPopulatedUserAccount } from "~/features/user-accounts/user-accounts-factories.server";
import { stripeHandlers } from "~/test/mocks/handlers/stripe";
import { setupMockServerLifecycle } from "~/test/msw-test-utils";
import { setupUserWithOrgAndAddAsMember } from "~/test/server-test-utils";
import { prisma } from "~/utils/database.server";

const server = setupMockServerLifecycle(...stripeHandlers);
const testI18n = { t: (key: string) => key } as unknown as i18n;

function deferred() {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("invite acceptance and account deletion billing", () => {
  test.each(["email", "reusable"] as const)(
    "given: a delayed %s invite seat update overlaps account deletion, should: finish with the current membership quantity",
    async (kind) => {
      const {
        organization,
        subscription,
        user: owner,
      } = await setupUserWithOrgAndAddAsMember({ role: "owner" });
      const departingUser = createPopulatedUserAccount();
      const invitedUser = createPopulatedUserAccount();
      await prisma.userAccount.createMany({
        data: [departingUser, invitedUser],
      });
      await prisma.organizationMembership.create({
        data: {
          memberId: departingUser.id,
          organizationId: organization.id,
          role: "member",
        },
      });
      onTestFinished(async () => {
        await prisma.accountDeletion.deleteMany({
          where: { id: departingUser.id },
        });
        await prisma.userAccount.deleteMany({
          where: { id: { in: [departingUser.id, invitedUser.id] } },
        });
      });

      const emailInvite = createPopulatedOrganizationEmailInviteLink({
        email: invitedUser.email,
        invitedById: owner.id,
        organizationId: organization.id,
      });
      const reusableInvite = createPopulatedOrganizationInviteLink({
        creatorId: owner.id,
        organizationId: organization.id,
      });
      await prisma.organizationEmailInviteLink.create({ data: emailInvite });
      await prisma.organizationInviteLink.create({ data: reusableInvite });

      const inviteWriteStarted = deferred();
      const releaseInviteWrite = deferred();
      let billedQuantity = 2;
      const quantitiesWritten: number[] = [];
      server.use(
        http.post(
          `https://api.stripe.com/v1/subscriptions/${subscription.stripeId}`,
          async ({ request }) => {
            const body = new URLSearchParams(await request.text());
            const quantity = Number(body.get("items[0][quantity]"));
            if (quantity === 3) {
              inviteWriteStarted.resolve();
              await releaseInviteWrite.promise;
            }
            billedQuantity = quantity;
            quantitiesWritten.push(quantity);
            return HttpResponse.json(
              createStripeSubscriptionFactory({
                id: subscription.stripeId,
              }),
            );
          },
        ),
      );
      const request = new Request(
        "http://localhost:3000/organizations/invite-link",
        {
          method: "POST",
        },
      );
      const acceptance =
        kind === "email"
          ? acceptEmailInvite({
              emailInviteToken: emailInvite.token,
              i18n: testI18n,
              request,
              userAccountId: invitedUser.id,
              verifiedUserEmail: invitedUser.email,
            })
          : acceptInviteLink({
              i18n: testI18n,
              inviteLinkId: reusableInvite.id,
              inviteLinkToken: reusableInvite.token,
              organizationId: organization.id,
              request,
              userAccountId: invitedUser.id,
            });
      await inviteWriteStarted.promise;

      let deletionFinished = false;
      const deletion = requestAccountDeletion({
        confirmation: departingUser.email,
        userId: departingUser.id,
      }).then(async () => {
        await cleanupAccountDeletionResource({
          kind: "billingSeats",
          target: organization.id,
        });
        deletionFinished = true;
      });
      try {
        // Release the delayed provider write only when deletion has either
        // finished (the bug) or is demonstrably waiting for this organization's
        // advisory lock. This controls the race without a timing-based sleep.
        await expect
          .poll(async () => {
            if (deletionFinished) return true;
            const [lock] = await prisma.$queryRaw<{ waiting: boolean }[]>`
            SELECT EXISTS (
              SELECT 1 FROM pg_locks
              WHERE locktype = 'advisory' AND NOT granted
                AND classid = (hashtextextended(${`organization:${organization.id}`}, 0) >> 32)::int::oid
                AND objid = (hashtextextended(${`organization:${organization.id}`}, 0) & 4294967295)::oid
            ) AS waiting
          `;
            return lock?.waiting ?? false;
          })
          .toEqual(true);
      } finally {
        releaseInviteWrite.resolve();
        await Promise.all([acceptance, deletion]);
      }

      expect(
        await prisma.organizationMembership.count({
          where: { organizationId: organization.id },
        }),
      ).toEqual(2);
      expect(billedQuantity).toEqual(2);
      expect(quantitiesWritten).toEqual([3, 2]);
    },
  );
});
