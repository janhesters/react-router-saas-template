import { createHash, createHmac, randomUUID } from "node:crypto";

import { AVATAR_PATH_PREFIX, BUCKET_NAME } from "../user-account-constants";
import { cleanupAccountDeletionResource } from "./account-deletion-providers.server";
import { createOrganizationDeletionInTransaction } from "~/features/organizations/deletion/organization-deletion.server";
import type { AccountDeletion, Prisma } from "~/generated/client";
import { prisma } from "~/utils/database.server";
import { getErrorMessage } from "~/utils/get-error-message";
import { notFound } from "~/utils/http-responses.server";
import { getOwnedImageKey } from "~/utils/storage-helpers.server";

const LEASE_DURATION_MS = 5 * 60_000;
const MAX_RETRY_DELAY_MS = 60 * 60_000;
const AVATAR_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

export class AccountDeletionError extends Error {
  constructor(readonly code: "confirmationMismatch" | "ownershipRequired") {
    super(code);
    this.name = "AccountDeletionError";
  }
}

class MembershipsChangedError extends Error {}

function recoveryTokenFor(
  deletion: Pick<AccountDeletion, "id" | "supabaseUserId">,
): string {
  // Stable for concurrent admission responses, without storing the bearer token.
  return createHmac("sha256", process.env.COOKIE_SECRET)
    .update(`account-deletion:${deletion.id}:${deletion.supabaseUserId}`)
    .digest("base64url");
}

function hashRecoveryToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function isRetryableAdmissionError(error: unknown): boolean {
  if (error instanceof MembershipsChangedError) return true;
  if (!(error instanceof Error) || !("code" in error)) return false;
  if (error.code === "P2034") return true;
  return (
    error.code === "P2010" &&
    "meta" in error &&
    typeof error.meta === "object" &&
    error.meta !== null &&
    "code" in error.meta &&
    ["40001", "40P01"].includes(String(error.meta.code))
  );
}

/** Commit every deletion and cleanup obligation before calling any provider. */
export async function requestAccountDeletion({
  confirmation,
  userId,
}: {
  confirmation: string;
  userId: string;
}): Promise<{ deletion: AccountDeletion; recoveryToken: string }> {
  for (let attempt = 0; ; attempt++) {
    const candidate = await prisma.userAccount.findUnique({
      include: { memberships: { select: { organizationId: true } } },
      where: { id: userId },
    });
    if (!candidate) {
      // Only authenticated server code may request admission. Concurrent calls
      // that already authenticated still receive the same recovery capability.
      const deletion = await prisma.accountDeletion.findUnique({
        where: { id: userId },
      });
      if (!deletion) throw notFound();
      return { deletion, recoveryToken: recoveryTokenFor(deletion) };
    }
    const organizationIds = candidate.memberships
      .map(({ organizationId }) => organizationId)
      .sort();
    try {
      const deletion = await prisma.$transaction(
        async (transaction) => {
          await transaction.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${`account:${candidate.supabaseUserId}`}, 0))`;
          const existing = await transaction.accountDeletion.findUnique({
            where: { id: userId },
          });
          if (existing) return existing;

          // Match provider/profile lock ordering. One transaction connection
          // handles all organizations, without nesting the bounded lock pool.
          for (const organizationId of organizationIds) {
            await transaction.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${`organization:${organizationId}`}, 0))`;
            await transaction.$queryRaw`SELECT id FROM "Organization" WHERE id = ${organizationId} FOR UPDATE`;
            await transaction.$queryRaw`SELECT "memberId" FROM "OrganizationMembership" WHERE "organizationId" = ${organizationId} ORDER BY "memberId" FOR UPDATE`;
          }
          // This blocks avatar publication and new memberships via their user FK.
          await transaction.$queryRaw`SELECT id FROM "UserAccount" WHERE id = ${userId} FOR UPDATE`;
          const user = await transaction.userAccount.findUnique({
            include: {
              memberships: {
                include: { organization: { include: { memberships: true } } },
              },
            },
            where: { id: userId },
          });
          if (!user) throw notFound();
          const currentIds = user.memberships
            .map(({ organizationId }) => organizationId)
            .sort();
          if (JSON.stringify(currentIds) !== JSON.stringify(organizationIds))
            throw new MembershipsChangedError();
          if (confirmation !== user.email)
            throw new AccountDeletionError("confirmationMismatch");

          const now = new Date();
          const active = (membership: { deactivatedAt: Date | null }) =>
            !membership.deactivatedAt || membership.deactivatedAt > now;
          const solelyOwned = user.memberships.filter((membership) => {
            if (membership.role !== "owner" || !active(membership))
              return false;
            const remaining = membership.organization.memberships.filter(
              (member) => member.memberId !== user.id && active(member),
            );
            if (remaining.length === 0) return true;
            if (!remaining.some((member) => member.role === "owner"))
              throw new AccountDeletionError("ownershipRequired");
            return false;
          });
          const deletedOrganizationIds = new Set(
            solelyOwned.map(({ organizationId }) => organizationId),
          );
          for (const membership of solelyOwned) {
            await createOrganizationDeletionInTransaction({
              confirmation: membership.organization.name,
              organizationId: membership.organizationId,
              transaction,
              userId,
            });
          }

          const resources: Prisma.AccountDeletionResourceCreateWithoutDeletionInput[] =
            [
              { kind: "authUser", target: user.supabaseUserId },
              ...AVATAR_EXTENSIONS.map((extension) => ({
                kind: "storageObject" as const,
                target: `${BUCKET_NAME}/${AVATAR_PATH_PREFIX}/${user.id}.${extension}`,
              })),
              ...user.memberships
                .filter(
                  ({ organizationId }) =>
                    !deletedOrganizationIds.has(organizationId),
                )
                .map(({ organizationId }) => ({
                  kind: "billingSeats" as const,
                  target: organizationId,
                })),
            ];
          const avatarKey = getOwnedImageKey({
            imageUrl: user.imageUrl,
            kind: "avatar",
            ownerId: user.id,
          });
          if (
            avatarKey &&
            !resources.some(
              ({ target }) => target === `${BUCKET_NAME}/${avatarKey}`,
            )
          ) {
            resources.push({
              kind: "storageObject",
              target: `${BUCKET_NAME}/${avatarKey}`,
            });
          }
          // Include earlier explicit deletion requests so their outstanding
          // billing cleanup remains visible after the requesting account is gone.
          const organizationDeletions =
            await transaction.organizationDeletion.findMany({
              select: { id: true },
              where: { requestedById: userId },
            });
          resources.push(
            ...organizationDeletions.map(({ id }) => ({
              kind: "organizationDeletion" as const,
              target: id,
            })),
          );
          const recoveryToken = recoveryTokenFor(user);
          const job = await transaction.accountDeletion.create({
            data: {
              id: user.id,
              recoveryTokenHash: hashRecoveryToken(recoveryToken),
              resources: { create: resources },
              supabaseUserId: user.supabaseUserId,
            },
          });
          await transaction.userAccount.delete({ where: { id: user.id } });
          return job;
        },
        { timeout: 30_000 },
      );
      return { deletion, recoveryToken: recoveryTokenFor(deletion) };
    } catch (error) {
      if (attempt >= 2 || !isRetryableAdmissionError(error)) throw error;
    }
  }
}

export async function getAccountDeletionForRecovery({
  deletionId,
  recoveryToken,
}: {
  deletionId: string;
  recoveryToken: string;
}): Promise<AccountDeletion | null> {
  return prisma.accountDeletion.findFirst({
    where: {
      id: deletionId,
      recoveryTokenHash: hashRecoveryToken(recoveryToken),
    },
  });
}

/** Persist late checkout seat reconciliation before acknowledging its event. */
export async function recordDeletedAccountsSubscription({
  organizationId,
  subscriptionId,
}: {
  organizationId: string;
  subscriptionId: string;
}): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    const jobs = await transaction.accountDeletion.findMany({
      orderBy: { id: "asc" },
      select: { id: true },
      where: {
        NOT: {
          resources: {
            some: {
              completedAt: { not: null },
              kind: "billingSubscription",
              target: subscriptionId,
            },
          },
        },
        resources: { some: { kind: "billingSeats", target: organizationId } },
      },
    });
    for (const job of jobs) {
      // Serialize reopening with the worker's final completion transaction.
      await transaction.$queryRaw`SELECT id FROM "AccountDeletion" WHERE id = ${job.id} FOR UPDATE`;
      const resource = await transaction.accountDeletionResource.upsert({
        create: {
          deletionId: job.id,
          kind: "billingSubscription",
          target: subscriptionId,
        },
        update: {},
        where: {
          deletionId_kind_target: {
            deletionId: job.id,
            kind: "billingSubscription",
            target: subscriptionId,
          },
        },
      });
      if (!resource.completedAt) {
        await transaction.accountDeletion.update({
          data: { completedAt: null, nextAttemptAt: new Date() },
          where: { id: job.id },
        });
      }
    }
  });
}

/** Lease and checkpoint each provider obligation independently across restarts. */
export async function processAccountDeletion(id: string): Promise<void> {
  const leaseToken = randomUUID();
  const now = new Date();
  const claimed = await prisma.accountDeletion.updateMany({
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
    const resources = await prisma.accountDeletionResource.findMany({
      orderBy: [{ kind: "asc" }, { target: "asc" }],
      where: { completedAt: null, deletionId: id },
    });
    let cleanupError: unknown;
    for (const resource of resources) {
      const renewed = await prisma.accountDeletion.updateMany({
        data: { leaseExpiresAt: new Date(Date.now() + LEASE_DURATION_MS) },
        where: { id, leaseToken },
      });
      if (renewed.count === 0) return;
      try {
        await cleanupAccountDeletionResource(resource);
      } catch (error) {
        // Auth or Storage downtime must not delay cancelling organization
        // billing. Checkpoint independent successes in the same attempt.
        cleanupError ??= error;
        continue;
      }
      const checkpoint = await prisma.accountDeletionResource.updateMany({
        data: { completedAt: new Date() },
        where: { deletion: { leaseToken }, id: resource.id },
      });
      if (checkpoint.count === 0) return;
    }
    if (cleanupError) throw cleanupError;
    await prisma.$transaction(async (transaction) => {
      const owned = await transaction.accountDeletion.updateMany({
        data: { leaseExpiresAt: new Date(Date.now() + LEASE_DURATION_MS) },
        where: { id, leaseToken },
      });
      if (owned.count === 0) return;
      const dependencies = await transaction.accountDeletionResource.findMany({
        select: { target: true },
        where: { deletionId: id, kind: "organizationDeletion" },
      });
      const pendingOrganizations =
        await transaction.organizationDeletion.findMany({
          select: { id: true },
          where: {
            completedAt: null,
            id: { in: dependencies.map(({ target }) => target) },
          },
        });
      await transaction.accountDeletionResource.updateMany({
        data: { completedAt: null },
        where: {
          deletionId: id,
          kind: "organizationDeletion",
          target: { in: pendingOrganizations.map(({ id }) => id) },
        },
      });
      const remaining = await transaction.accountDeletionResource.count({
        where: { completedAt: null, deletionId: id },
      });
      await transaction.accountDeletion.update({
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
    const job = await prisma.accountDeletion.findUnique({ where: { id } });
    const delay = Math.min(
      MAX_RETRY_DELAY_MS,
      5000 * 2 ** Math.min(job?.attempts ?? 1, 10),
    );
    await prisma.accountDeletion.updateMany({
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

export async function processPendingAccountDeletions(): Promise<void> {
  const now = new Date();
  const jobs = await prisma.accountDeletion.findMany({
    orderBy: { nextAttemptAt: "asc" },
    select: { id: true },
    take: 20,
    where: {
      completedAt: null,
      nextAttemptAt: { lte: now },
      OR: [{ leaseExpiresAt: null }, { leaseExpiresAt: { lte: now } }],
    },
  });
  for (const job of jobs) await processAccountDeletion(job.id);
}
