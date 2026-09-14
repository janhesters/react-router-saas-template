import { randomUUID } from "node:crypto";

import { BUCKET_NAME, LOGO_PATH_PREFIX } from "../organization-constants";
import { cleanupOrganizationDeletionResource } from "./organization-deletion-providers.server";
import { withOrganizationMutationLock } from "./organization-mutation-lock.server";
import type { OrganizationDeletion, Prisma } from "~/generated/client";
import { prisma } from "~/utils/database.server";
import { getErrorMessage } from "~/utils/get-error-message";
import { badRequest, forbidden, notFound } from "~/utils/http-responses.server";
import { getOwnedImageKey } from "~/utils/storage-helpers.server";

const LEASE_DURATION_MS = 5 * 60_000;
const MAX_RETRY_DELAY_MS = 60 * 60_000;
const LOGO_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

/**
 * Commit deletion and its cleanup manifest together, before any provider call.
 * The manifest has no organization/user foreign key and survives their deletion.
 */
export async function requestOrganizationDeletion({
  organizationId,
  userId,
  confirmation,
}: {
  organizationId: string;
  userId: string;
  confirmation: string;
}): Promise<OrganizationDeletion> {
  let committedDeletion: OrganizationDeletion | undefined;
  try {
    return await withOrganizationMutationLock(organizationId, async () => {
      committedDeletion = await prisma.$transaction(async (transaction) => {
        return createOrganizationDeletionInTransaction({
          confirmation,
          organizationId,
          transaction,
          userId,
        });
      });
      return committedDeletion;
    });
  } catch (error) {
    // A lock-connection failure cannot undo an already committed admission.
    // Only acknowledge a transaction whose successful commit we observed.
    if (committedDeletion) return committedDeletion;
    throw error;
  }
}

/** Admission shared by explicit organization deletion and atomic account deletion.
 * Callers must hold the organization advisory lock until their transaction commits.
 */
export async function createOrganizationDeletionInTransaction({
  transaction,
  organizationId,
  userId,
  confirmation,
}: {
  transaction: Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
  organizationId: string;
  userId: string;
  confirmation: string;
}): Promise<OrganizationDeletion> {
  // The advisory lock uses a separate connection. Keep the snapshot and
  // deletion protected by this transaction even if that connection fails.
  await transaction.$queryRaw`
    SELECT id FROM "Organization" WHERE id = ${organizationId} FOR UPDATE
  `;
  const existing = await transaction.organizationDeletion.findUnique({
    where: { id: organizationId },
  });
  if (existing) {
    if (existing.requestedById !== userId) throw notFound();
    if (confirmation !== existing.organizationName) {
      throw badRequest({ message: "Organization name does not match." });
    }
    return existing;
  }

  // Role changes use ordinary membership updates, so the organization
  // advisory lock alone cannot protect this authorization check.
  await transaction.$queryRaw`
    SELECT "memberId" FROM "OrganizationMembership"
    WHERE "memberId" = ${userId} AND "organizationId" = ${organizationId}
    FOR UPDATE
  `;
  const organization = await transaction.organization.findUnique({
    include: {
      memberships: {
        where: {
          memberId: userId,
          OR: [{ deactivatedAt: null }, { deactivatedAt: { gt: new Date() } }],
        },
      },
      stripeSubscriptions: { select: { stripeId: true } },
    },
    where: { id: organizationId },
  });
  if (!organization) throw notFound();
  if (organization.memberships[0]?.role !== "owner") throw forbidden();
  if (confirmation !== organization.name) {
    throw badRequest({ message: "Organization name does not match." });
  }

  // Keep legacy flat keys alongside the current owned image. The URL parser
  // excludes external hosts and images owned by another account or organization.
  const resources: Prisma.OrganizationDeletionResourceCreateWithoutDeletionInput[] =
    LOGO_EXTENSIONS.map((extension) => ({
      kind: "storageObject",
      target: `${BUCKET_NAME}/${LOGO_PATH_PREFIX}/${organization.id}.${extension}`,
    }));
  const currentLogoKey = getOwnedImageKey({
    imageUrl: organization.imageUrl,
    kind: "organization-logo",
    ownerId: organization.id,
  });
  if (
    currentLogoKey &&
    !resources.some(
      (resource) => resource.target === `${BUCKET_NAME}/${currentLogoKey}`,
    )
  ) {
    resources.push({
      kind: "storageObject",
      target: `${BUCKET_NAME}/${currentLogoKey}`,
    });
  }
  if (organization.stripeCustomerId) {
    resources.unshift({
      kind: "stripeCustomer",
      target: organization.stripeCustomerId,
    });
  }
  // Older checkout sessions could have created distinct customers. Keep
  // every known subscription as a route back to its customer in Stripe.
  resources.push(
    ...organization.stripeSubscriptions.map(({ stripeId }) => ({
      kind: "stripeSubscription" as const,
      target: stripeId,
    })),
  );

  const deletion = await transaction.organizationDeletion.create({
    data: {
      id: organization.id,
      organizationName: organization.name,
      organizationSlug: organization.slug,
      requestedById: userId,
      resources: { create: resources },
    },
  });
  await transaction.organization.delete({
    where: { id: organization.id },
  });
  return deletion;
}

export async function getOrganizationDeletionForUser({
  deletionId,
  userId,
}: {
  deletionId: string;
  userId: string;
}): Promise<OrganizationDeletion | null> {
  return prisma.organizationDeletion.findFirst({
    where: { id: deletionId, requestedById: userId },
  });
}

/** Persist late checkout/customer creation before acknowledging the Stripe event. */
export async function recordDeletedOrganizationCustomer({
  organizationId,
  customerId,
}: {
  organizationId: string;
  customerId: string;
}): Promise<boolean> {
  return prisma.$transaction(async (transaction) => {
    // The parent row lock also serializes with worker completion below.
    const rows = await transaction.$queryRaw<{ id: string }[]>`
      SELECT id FROM "OrganizationDeletion" WHERE id = ${organizationId} FOR UPDATE
    `;
    if (rows.length === 0) return false;

    const resource = await transaction.organizationDeletionResource.upsert({
      create: {
        deletionId: organizationId,
        kind: "stripeCustomer",
        target: customerId,
      },
      update: {},
      where: {
        deletionId_kind_target: {
          deletionId: organizationId,
          kind: "stripeCustomer",
          target: customerId,
        },
      },
    });
    // Replayed events for a permanently deleted customer require no more work.
    if (!resource.completedAt) {
      await transaction.organizationDeletion.update({
        data: { completedAt: null, nextAttemptAt: new Date() },
        where: { id: organizationId },
      });
      // Account deletion remains a recovery entry point for organization work
      // that reopens after a late checkout/customer event.
      await transaction.accountDeletionResource.updateMany({
        data: { completedAt: null },
        where: { kind: "organizationDeletion", target: organizationId },
      });
      await transaction.accountDeletion.updateMany({
        data: { completedAt: null, nextAttemptAt: new Date() },
        where: {
          resources: {
            some: { kind: "organizationDeletion", target: organizationId },
          },
        },
      });
    }
    return true;
  });
}

/**
 * Resume a job from its durable resource checkpoints. Lease ownership fences
 * writes from an expired worker; repeating a provider delete is safe if a
 * process stops after the provider succeeds but before a checkpoint is saved.
 */
export async function processOrganizationDeletion(id: string): Promise<void> {
  const leaseToken = randomUUID();
  const now = new Date();
  const claimed = await prisma.organizationDeletion.updateMany({
    data: {
      attempts: { increment: 1 },
      leaseExpiresAt: new Date(now.getTime() + LEASE_DURATION_MS),
      leaseToken,
    },
    where: {
      completedAt: null,
      id,
      OR: [{ leaseExpiresAt: null }, { leaseExpiresAt: { lte: now } }],
    },
  });
  if (claimed.count === 0) return;

  try {
    const resources = await prisma.organizationDeletionResource.findMany({
      orderBy: [{ kind: "asc" }, { target: "asc" }],
      where: { completedAt: null, deletionId: id },
    });
    for (const resource of resources) {
      const renewed = await prisma.organizationDeletion.updateMany({
        data: { leaseExpiresAt: new Date(Date.now() + LEASE_DURATION_MS) },
        where: { id, leaseToken },
      });
      if (renewed.count === 0) return;

      await cleanupOrganizationDeletionResource(resource);
      const checkpoint = await prisma.organizationDeletionResource.updateMany({
        data: { completedAt: new Date() },
        where: { deletion: { leaseToken }, id: resource.id },
      });
      if (checkpoint.count === 0) return;
    }

    await prisma.$transaction(async (transaction) => {
      const owned = await transaction.organizationDeletion.updateMany({
        data: { leaseExpiresAt: new Date(Date.now() + LEASE_DURATION_MS) },
        where: { id, leaseToken },
      });
      if (owned.count === 0) return;

      const remaining = await transaction.organizationDeletionResource.count({
        where: { completedAt: null, deletionId: id },
      });
      await transaction.organizationDeletion.update({
        data: {
          completedAt: remaining === 0 ? new Date() : null,
          lastError: null,
          leaseExpiresAt: null,
          leaseToken: null,
          nextAttemptAt: new Date(),
        },
        where: { id },
      });
    });
  } catch (error) {
    const job = await prisma.organizationDeletion.findUnique({ where: { id } });
    const delay = Math.min(
      MAX_RETRY_DELAY_MS,
      5000 * 2 ** Math.min(job?.attempts ?? 1, 10),
    );
    await prisma.organizationDeletion.updateMany({
      data: {
        lastError: getErrorMessage(error).slice(0, 1000),
        leaseExpiresAt: null,
        leaseToken: null,
        nextAttemptAt: new Date(Date.now() + delay),
      },
      where: { id, leaseToken },
    });
  }
}

/** Pick up persisted work, including leases left behind by interrupted processes. */
export async function processPendingOrganizationDeletions(): Promise<void> {
  const now = new Date();
  const jobs = await prisma.organizationDeletion.findMany({
    orderBy: { nextAttemptAt: "asc" },
    select: { id: true },
    take: 20,
    where: {
      completedAt: null,
      nextAttemptAt: { lte: now },
      OR: [{ leaseExpiresAt: null }, { leaseExpiresAt: { lte: now } }],
    },
  });
  for (const job of jobs) await processOrganizationDeletion(job.id);
}
