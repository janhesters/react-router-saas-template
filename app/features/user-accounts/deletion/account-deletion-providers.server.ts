import { isAuthApiError } from "@supabase/supabase-js";

import { preservePhaseWithSeatQuantity } from "./stripe-seat-schedule.server";
import { stripeAdmin } from "~/features/billing/stripe-admin.server";
import { processOrganizationDeletion } from "~/features/organizations/deletion/organization-deletion.server";
import { withOrganizationMutationLock } from "~/features/organizations/deletion/organization-mutation-lock.server";
import { supabaseAdminClient } from "~/features/user-authentication/supabase.server";
import type { AccountDeletionResourceKind } from "~/generated/client";
import { prisma } from "~/utils/database.server";
import { removeImageFromStorage } from "~/utils/storage-helpers.server";

const STRIPE_REQUEST_OPTIONS = { maxNetworkRetries: 1, timeout: 20_000 };

async function reconcileOrganizationSeats(
  organizationId: string,
): Promise<void> {
  await withOrganizationMutationLock(organizationId, async () => {
    const organization = await prisma.organization.findUnique({
      include: {
        stripeSubscriptions: { orderBy: { created: "desc" }, take: 1 },
      },
      where: { id: organizationId },
    });
    // Organization deletion owns its Stripe cleanup once the row is gone.
    const subscription = organization?.stripeSubscriptions[0];
    if (!subscription) return;
    const current = await stripeAdmin.subscriptions.retrieve(
      subscription.stripeId,
      {},
      STRIPE_REQUEST_OPTIONS,
    );
    if (["canceled", "incomplete_expired"].includes(current.status)) return;
    const item = current.items.data[0];
    if (!item) throw new Error("Subscription has no seat item");

    const membershipWhere = {
      OR: [{ deactivatedAt: null }, { deactivatedAt: { gt: new Date() } }],
      organizationId,
    };
    const quantity = await prisma.organizationMembership.count({
      where: membershipWhere,
    });
    let updatedSchedule = false;
    if (current.schedule) {
      const scheduleId =
        typeof current.schedule === "string"
          ? current.schedule
          : current.schedule.id;
      const schedule = await stripeAdmin.subscriptionSchedules.retrieve(
        scheduleId,
        {},
        STRIPE_REQUEST_OPTIONS,
      );
      if (!["canceled", "completed", "released"].includes(schedule.status)) {
        const now = Math.floor(Date.now() / 1000);
        const phases = schedule.phases
          .filter((phase) => phase.end_date > now)
          .map((phase) => preservePhaseWithSeatQuantity(phase, quantity));
        if (phases.length === 0)
          throw new Error("Schedule has no current or future phases");
        await stripeAdmin.subscriptionSchedules.update(
          schedule.id,
          { phases },
          STRIPE_REQUEST_OPTIONS,
        );
        updatedSchedule = true;
      }
    }
    // Updating the active schedule phase updates its underlying subscription;
    // a direct subscription update can split or overwrite scheduled phases.
    if (!updatedSchedule) {
      await stripeAdmin.subscriptions.update(
        current.id,
        { items: [{ id: item.id, quantity }] },
        STRIPE_REQUEST_OPTIONS,
      );
    }
    // Legacy member edits do not all acquire the advisory lock. A concurrent
    // edit means another durable attempt must reconcile the newer live count.
    if (
      (await prisma.organizationMembership.count({
        where: membershipWhere,
      })) !== quantity
    ) {
      throw new Error("Organization membership changed during seat cleanup");
    }
  });
}

export async function cleanupAccountDeletionResource({
  kind,
  target,
}: {
  kind: AccountDeletionResourceKind;
  target: string;
}): Promise<void> {
  if (kind === "authUser") {
    const { error } = await supabaseAdminClient.auth.admin.deleteUser(target);
    if (
      error &&
      !(
        isAuthApiError(error) &&
        error.status === 404 &&
        error.code === "user_not_found"
      )
    )
      throw error;
    return;
  }
  if (kind === "organizationDeletion") {
    await processOrganizationDeletion(target);
    const deletion = await prisma.organizationDeletion.findUnique({
      where: { id: target },
    });
    if (!deletion?.completedAt)
      throw new Error("Organization cleanup is still pending");
    return;
  }
  if (kind === "billingSeats") {
    await reconcileOrganizationSeats(target);
    return;
  }
  if (kind === "billingSubscription") {
    const subscription = await prisma.stripeSubscription.findUnique({
      select: { organizationId: true },
      where: { stripeId: target },
    });
    if (subscription)
      await reconcileOrganizationSeats(subscription.organizationId);
    return;
  }

  const ownedAvatar =
    /^app-images\/user-avatars\/([a-z\d_-]{1,128})(?:\.[a-z\d]{1,16}|\/[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}\.[a-z\d]{1,16})$/i.exec(
      target,
    );
  const ownerId = ownedAvatar?.[1];
  if (!ownerId) throw new Error("Invalid account storage target");
  await removeImageFromStorage({
    imageUrl: new URL(
      `/storage/v1/object/public/${target}`,
      process.env.VITE_SUPABASE_URL,
    ).href,
    kind: "avatar",
    ownerId,
  });
}
