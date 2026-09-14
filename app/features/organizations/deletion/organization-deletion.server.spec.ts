import { randomUUID } from "node:crypto";
import { createId } from "@paralleldrive/cuid2";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  onTestFinished,
  test,
  vi,
} from "vitest";

import {
  getOrganizationDeletionForUser,
  processOrganizationDeletion,
  recordDeletedOrganizationCustomer,
  requestOrganizationDeletion,
} from "./organization-deletion.server";
import { cleanupOrganizationDeletionResource } from "./organization-deletion-providers.server";
import { withOrganizationMutationLock } from "./organization-mutation-lock.server";
import { createPopulatedOrganization } from "~/features/organizations/organizations-factories.server";
import { createPopulatedUserAccount } from "~/features/user-accounts/user-accounts-factories.server";
import type {
  Organization,
  OrganizationDeletionResourceKind,
  OrganizationMembershipRole,
} from "~/generated/client";
import { prisma } from "~/utils/database.server";

vi.mock("./organization-deletion-providers.server", () => ({
  cleanupOrganizationDeletionResource: vi.fn(),
}));

const cleanupResource = vi.mocked(cleanupOrganizationDeletionResource);
type Transaction = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

function deferred() {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

beforeEach(() => {
  cleanupResource.mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function setupOrganization({
  organization: overrides = {},
  role = "owner",
  deactivatedAt = null,
}: {
  organization?: Partial<Organization>;
  role?: OrganizationMembershipRole;
  deactivatedAt?: Date | null;
} = {}) {
  const user = createPopulatedUserAccount();
  const organization = createPopulatedOrganization({
    imageUrl: "",
    ...overrides,
  });

  onTestFinished(async () => {
    await prisma.organizationDeletion.deleteMany({
      where: { id: organization.id },
    });
    await prisma.organization.deleteMany({ where: { id: organization.id } });
    await prisma.userAccount.deleteMany({ where: { id: user.id } });
  });

  await prisma.userAccount.create({ data: user });
  await prisma.organization.create({
    data: {
      ...organization,
      memberships: {
        create: { deactivatedAt, memberId: user.id, role },
      },
    },
  });

  const requestDeletion = (confirmation = organization.name) =>
    requestOrganizationDeletion({
      confirmation,
      organizationId: organization.id,
      userId: user.id,
    });

  return { organization, requestDeletion, user };
}

async function setupJob(
  resources: {
    kind: OrganizationDeletionResourceKind;
    target: string;
    completedAt?: Date;
  }[] = [{ kind: "stripeCustomer", target: `cus_${createId()}` }],
) {
  const id = createId();
  onTestFinished(async () => {
    await prisma.organizationDeletion.deleteMany({ where: { id } });
  });
  return prisma.organizationDeletion.create({
    data: {
      id,
      organizationName: "Deleted organization",
      organizationSlug: `deleted-${id}`,
      requestedById: createId(),
      resources: { create: resources },
    },
    include: { resources: true },
  });
}

const retrieveJob = (id: string) =>
  prisma.organizationDeletion.findUniqueOrThrow({
    include: { resources: true },
    where: { id },
  });

async function makeJobDue(id: string) {
  await prisma.organizationDeletion.update({
    data: { nextAttemptAt: new Date(0) },
    where: { id },
  });
}

/** Inject a failed statement inside the real admission transaction. */
function failAdmissionStatement(
  model: "organization" | "organizationDeletion",
) {
  const runTransaction = prisma.$transaction.bind(prisma);
  const failure = new Error(`${model} admission write failed`);
  const fail = vi.fn(async () => {
    throw failure;
  });
  const method = model === "organization" ? "delete" : "create";

  vi.spyOn(prisma, "$transaction").mockImplementation(((
    callback: (transaction: Transaction) => Promise<unknown>,
    options?: Parameters<typeof prisma.$transaction>[1],
  ) =>
    runTransaction(async (transaction) => {
      const failingTransaction = new Proxy(transaction, {
        get(target, property) {
          if (property !== model) {
            return Reflect.get(target, property);
          }
          return new Proxy(target[model], {
            get(delegate, operation) {
              return operation === method
                ? fail
                : Reflect.get(delegate, operation);
            },
          });
        },
      });
      return callback(failingTransaction);
    }, options)) as unknown as typeof prisma.$transaction);

  return { fail, failure };
}

describe("organization deletion admission", () => {
  test("commits resource snapshots and organization cascades before any provider call while retaining the account", async () => {
    const { organization, requestDeletion, user } = await setupOrganization();
    const invite = await prisma.organizationInviteLink.create({
      data: {
        creatorId: user.id,
        expiresAt: new Date(Date.now() + 60_000),
        organizationId: organization.id,
      },
    });
    const emailInvite = await prisma.organizationEmailInviteLink.create({
      data: {
        email: "invitee@example.com",
        expiresAt: new Date(Date.now() + 60_000),
        invitedById: user.id,
        organizationId: organization.id,
      },
    });
    const subscription = await prisma.stripeSubscription.create({
      data: {
        cancelAtPeriodEnd: false,
        created: new Date(),
        organizationId: organization.id,
        purchasedById: user.id,
        status: "active",
        stripeId: `sub_${createId()}`,
      },
    });
    const olderSubscription = await prisma.stripeSubscription.create({
      data: {
        cancelAtPeriodEnd: false,
        created: new Date(0),
        organizationId: organization.id,
        purchasedById: user.id,
        status: "trialing",
        stripeId: `sub_${createId()}`,
      },
    });
    const notification = await prisma.notification.create({
      data: {
        content: {},
        organizationId: organization.id,
        recipients: { create: { userId: user.id } },
      },
    });

    const deletion = await requestDeletion();
    const job = await retrieveJob(deletion.id);

    expect(job).toMatchObject({
      completedAt: null,
      id: organization.id,
      organizationName: organization.name,
      organizationSlug: organization.slug,
      requestedById: user.id,
    });
    expect(job.resources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          completedAt: null,
          kind: "stripeCustomer",
          target: organization.stripeCustomerId,
        }),
        expect.objectContaining({
          completedAt: null,
          kind: "stripeSubscription",
          target: subscription.stripeId,
        }),
        expect.objectContaining({
          completedAt: null,
          kind: "stripeSubscription",
          target: olderSubscription.stripeId,
        }),
      ]),
    );
    expect(cleanupResource).not.toHaveBeenCalled();
    expect(
      await prisma.organization.findUnique({ where: { id: organization.id } }),
    ).toBeNull();
    expect(
      await prisma.organizationMembership.count({
        where: { organizationId: organization.id },
      }),
    ).toBe(0);
    expect(
      await prisma.organizationInviteLink.findUnique({
        where: { id: invite.id },
      }),
    ).toBeNull();
    expect(
      await prisma.organizationEmailInviteLink.findUnique({
        where: { id: emailInvite.id },
      }),
    ).toBeNull();
    expect(
      await prisma.stripeSubscription.findUnique({
        where: { stripeId: subscription.stripeId },
      }),
    ).toBeNull();
    expect(
      await prisma.stripeSubscription.findUnique({
        where: { stripeId: olderSubscription.stripeId },
      }),
    ).toBeNull();
    expect(
      await prisma.notification.findUnique({ where: { id: notification.id } }),
    ).toBeNull();
    expect(
      await prisma.userAccount.findUnique({ where: { id: user.id } }),
    ).toEqual(user);
  });

  test("snapshots every standard logo extension without granting cleanup access to another organization's image", async () => {
    const otherOrganizationId = createId();
    const { organization, requestDeletion } = await setupOrganization({
      organization: {
        imageUrl: `${process.env.VITE_SUPABASE_URL}/storage/v1/object/public/app-images/organization-logos/${otherOrganizationId}.png`,
        stripeCustomerId: null,
      },
    });

    const job = await retrieveJob((await requestDeletion()).id);
    const targets = job.resources.map((resource) => resource.target);

    expect(targets).toEqual(
      expect.arrayContaining(
        ["png", "jpeg", "jpg", "gif", "webp"].map(
          (extension) =>
            `app-images/organization-logos/${organization.id}.${extension}`,
        ),
      ),
    );
    expect(targets.some((target) => target.includes(otherOrganizationId))).toBe(
      false,
    );
    expect(
      job.resources.every((resource) => resource.kind === "storageObject"),
    ).toBe(true);
  });

  test.each(["legacy", "unique"])(
    "snapshots the exact owned %s image key alongside the standard legacy keys",
    async (keyFormat) => {
      const id = createId();
      const key =
        keyFormat === "legacy"
          ? `organization-logos/${id}.PNG`
          : `organization-logos/${id}/${randomUUID()}.png`;
      const { requestDeletion } = await setupOrganization({
        organization: {
          id,
          imageUrl: `${process.env.VITE_SUPABASE_URL}/storage/v1/object/public/app-images/${key}`,
          stripeCustomerId: null,
        },
      });

      const job = await retrieveJob((await requestDeletion()).id);

      expect(job.resources).toHaveLength(6);
      expect(job.resources).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            completedAt: null,
            kind: "storageObject",
            target: `app-images/${key}`,
          }),
        ]),
      );
    },
  );

  test("does not interpret an external-host image URL as storage deletion authority", async () => {
    const id = createId();
    const { requestDeletion } = await setupOrganization({
      organization: {
        id,
        imageUrl: `https://untrusted.example/storage/v1/object/public/app-images/organization-logos/${id}/${randomUUID()}.png`,
        stripeCustomerId: null,
      },
    });

    const job = await retrieveJob((await requestDeletion()).id);

    expect(job.resources).toHaveLength(5);
    expect(
      job.resources.every((resource) =>
        resource.target.startsWith(`app-images/organization-logos/${id}.`),
      ),
    ).toBe(true);
  });

  test.each(["admin", "member"] as const)(
    "rejects a %s without changing the organization or creating a cleanup job",
    async (role) => {
      const { organization, requestDeletion } = await setupOrganization({
        role,
      });

      await expect(requestDeletion()).rejects.toBeDefined();

      expect(
        await prisma.organization.findUnique({
          where: { id: organization.id },
        }),
      ).not.toBeNull();
      expect(
        await prisma.organizationDeletion.findUnique({
          where: { id: organization.id },
        }),
      ).toBeNull();
      expect(cleanupResource).not.toHaveBeenCalled();
    },
  );

  test("rejects a deactivated owner and an identity with no membership", async () => {
    const { organization, requestDeletion } = await setupOrganization({
      deactivatedAt: new Date(),
    });

    await expect(requestDeletion()).rejects.toBeDefined();
    await expect(
      requestOrganizationDeletion({
        confirmation: organization.name,
        organizationId: organization.id,
        userId: createId(),
      }),
    ).rejects.toBeDefined();

    expect(
      await prisma.organization.findUnique({ where: { id: organization.id } }),
    ).not.toBeNull();
    expect(
      await prisma.organizationDeletion.findUnique({
        where: { id: organization.id },
      }),
    ).toBeNull();
    expect(cleanupResource).not.toHaveBeenCalled();
  });

  test("requires the current organization name as confirmation", async () => {
    const { organization, requestDeletion } = await setupOrganization();

    await expect(requestDeletion("wrong name")).rejects.toBeDefined();

    expect(
      await prisma.organization.findUnique({ where: { id: organization.id } }),
    ).not.toBeNull();
    expect(
      await prisma.organizationDeletion.findUnique({
        where: { id: organization.id },
      }),
    ).toBeNull();
    expect(cleanupResource).not.toHaveBeenCalled();
  });

  test("given: a lost advisory connection during admission, should: protect the snapshot and return the committed cleanup job", async () => {
    const { organization, requestDeletion } = await setupOrganization();
    // Initialize the pool, then reserve the exact connection admission will use.
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
    vi.spyOn(pool, "connect").mockImplementationOnce((() =>
      Promise.resolve(lockClient)) as typeof pool.connect);
    const disconnected = new Promise<void>((resolve) =>
      lockClient.once("error", () => resolve()),
    );
    const runTransaction = prisma.$transaction.bind(prisma);
    let updateError: unknown;
    vi.spyOn(prisma, "$transaction").mockImplementation(((
      callback: (transaction: Transaction) => Promise<unknown>,
      options?: Parameters<typeof prisma.$transaction>[1],
    ) =>
      runTransaction(
        async (transaction) =>
          callback(
            new Proxy(transaction, {
              get(target, property) {
                if (property !== "organization")
                  return Reflect.get(target, property);
                return new Proxy(target.organization, {
                  get(delegate, operation) {
                    if (operation !== "findUnique")
                      return Reflect.get(delegate, operation);
                    return async (
                      args: Parameters<typeof delegate.findUnique>[0],
                    ) => {
                      const snapshot = await delegate.findUnique(args);
                      // Kill only this test's dedicated advisory-lock connection. The
                      // Prisma admission transaction remains alive on its own connection.
                      await contender.query("SELECT pg_terminate_backend($1)", [
                        backend.pid,
                      ]);
                      await disconnected;
                      await contender.query("BEGIN");
                      try {
                        await contender.query(
                          "SET LOCAL lock_timeout = '100ms'",
                        );
                        await contender.query(
                          'UPDATE "Organization" SET "imageUrl" = $1 WHERE id = $2',
                          [
                            "https://example.com/replacement.png",
                            organization.id,
                          ],
                        );
                        await contender.query("COMMIT");
                      } catch (error) {
                        updateError = error;
                        await contender.query("ROLLBACK");
                      }
                      return snapshot;
                    };
                  },
                });
              },
            }),
          ),
        options,
      )) as typeof prisma.$transaction);
    try {
      const result = await Promise.allSettled([requestDeletion()]);
      expect(updateError).toMatchObject({ code: "55P03" });
      expect(result).toMatchObject([
        { status: "fulfilled", value: { id: organization.id } },
      ]);
      expect(
        await prisma.organization.findUnique({
          where: { id: organization.id },
        }),
      ).toBeNull();
      expect(
        await prisma.organizationDeletion.findUnique({
          where: { id: organization.id },
        }),
      ).not.toBeNull();
    } finally {
      contender.release();
    }
  });

  test("waits for a concurrent membership demotion before authorizing deletion", async () => {
    const { organization, requestDeletion, user } = await setupOrganization();
    const membershipUpdated = deferred();
    const commitDemotion = deferred();
    const reachedAuthorization = deferred();
    const runTransaction = prisma.$transaction.bind(prisma);
    const demotion = runTransaction(async (transaction) => {
      await transaction.organizationMembership.update({
        data: { role: "member" },
        where: {
          memberId_organizationId: {
            memberId: user.id,
            organizationId: organization.id,
          },
        },
      });
      membershipUpdated.resolve();
      await commitDemotion.promise;
    });
    await membershipUpdated.promise;

    // Release the competing transaction only after admission attempts its
    // authorization read. Without a membership lock, that read sees the old
    // owner role and deletion incorrectly succeeds after demotion commits.
    vi.spyOn(prisma, "$transaction").mockImplementation(((
      callback: (transaction: Transaction) => Promise<unknown>,
      options?: Parameters<typeof prisma.$transaction>[1],
    ) =>
      runTransaction(async (transaction) => {
        const observedTransaction = new Proxy(transaction, {
          get(target, property) {
            if (property === "$queryRaw") {
              return (strings: TemplateStringsArray, ...values: unknown[]) => {
                if (strings.join("").includes('"OrganizationMembership"')) {
                  reachedAuthorization.resolve();
                }
                return target.$queryRaw(strings, ...values);
              };
            }
            if (property === "organization") {
              return new Proxy(target.organization, {
                get(delegate, operation) {
                  if (operation !== "findUnique")
                    return Reflect.get(delegate, operation);
                  return async (
                    args: Parameters<typeof delegate.findUnique>[0],
                  ) => {
                    const result = await delegate.findUnique(args);
                    reachedAuthorization.resolve();
                    return result;
                  };
                },
              });
            }
            return Reflect.get(target, property);
          },
        });
        return callback(observedTransaction);
      }, options)) as unknown as typeof prisma.$transaction);

    const deletion = requestDeletion();
    const outcome = deletion.then(
      () => "deleted",
      () => "rejected",
    );
    try {
      await reachedAuthorization.promise;
    } finally {
      commitDemotion.resolve();
      await demotion;
    }

    expect(await outcome).toBe("rejected");
    expect(
      await prisma.organization.findUnique({ where: { id: organization.id } }),
    ).not.toBeNull();
    expect(
      await prisma.organizationDeletion.findUnique({
        where: { id: organization.id },
      }),
    ).toBeNull();
    expect(cleanupResource).not.toHaveBeenCalled();
  });

  test.each(["organizationDeletion", "organization"] as const)(
    "rolls all admission writes back when the %s statement fails",
    async (model) => {
      const { organization, requestDeletion } = await setupOrganization();
      const { fail, failure } = failAdmissionStatement(model);

      await expect(requestDeletion()).rejects.toThrow(failure.message);

      expect(fail).toHaveBeenCalledOnce();
      expect(
        await prisma.organization.findUnique({
          where: { id: organization.id },
        }),
      ).not.toBeNull();
      expect(
        await prisma.organizationMembership.count({
          where: { organizationId: organization.id },
        }),
      ).toBe(1);
      expect(
        await prisma.organizationDeletion.findUnique({
          where: { id: organization.id },
        }),
      ).toBeNull();
      expect(cleanupResource).not.toHaveBeenCalled();
    },
  );

  test("returns one durable job for duplicate and concurrent owner requests", async () => {
    const { organization, requestDeletion } = await setupOrganization();

    const jobs = await Promise.all([
      requestDeletion(),
      requestDeletion(),
      requestDeletion(),
    ]);
    const retry = await requestDeletion();

    expect(jobs.map((job) => job.id)).toEqual([
      organization.id,
      organization.id,
      organization.id,
    ]);
    expect(retry.id).toBe(organization.id);
    expect(
      await prisma.organizationDeletion.count({
        where: { id: organization.id },
      }),
    ).toBe(1);
    expect(cleanupResource).not.toHaveBeenCalled();
  });

  test("only lets the requesting owner inspect or repeat deletion after organization removal", async () => {
    const { organization, requestDeletion, user } = await setupOrganization();
    const job = await requestDeletion();
    const unrelatedUserId = createId();

    expect(
      await getOrganizationDeletionForUser({
        deletionId: job.id,
        userId: user.id,
      }),
    ).toMatchObject({ id: job.id });
    expect(
      await getOrganizationDeletionForUser({
        deletionId: job.id,
        userId: unrelatedUserId,
      }),
    ).toBeNull();
    await expect(
      requestOrganizationDeletion({
        confirmation: organization.name,
        organizationId: organization.id,
        userId: unrelatedUserId,
      }),
    ).rejects.toBeDefined();

    await prisma.userAccount.delete({ where: { id: user.id } });
    expect(await retrieveJob(job.id)).toMatchObject({
      id: job.id,
      requestedById: user.id,
    });
  });

  test("waits for an existing organization mutation and snapshots the committed profile", async () => {
    const { organization, requestDeletion } = await setupOrganization();
    const entered = deferred();
    const release = deferred();
    const imageUrl = `${process.env.VITE_SUPABASE_URL}/storage/v1/object/public/app-images/organization-logos/${organization.id}.png`;
    const newName = `Renamed ${organization.name}`;
    const mutation = withOrganizationMutationLock(organization.id, async () => {
      entered.resolve();
      await release.promise;
      await prisma.organization.update({
        data: { imageUrl, name: newName },
        where: { id: organization.id },
      });
    });
    await entered.promise;
    const deletion = requestDeletion(newName);

    try {
      expect(
        await prisma.organizationDeletion.findUnique({
          where: { id: organization.id },
        }),
      ).toBeNull();
    } finally {
      release.resolve();
      await mutation;
    }
    const job = await retrieveJob((await deletion).id);

    expect(job.organizationName).toBe(newName);
    expect(job.resources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "storageObject",
          target: `app-images/organization-logos/${organization.id}.png`,
        }),
      ]),
    );
    expect(
      await prisma.organization.findUnique({ where: { id: organization.id } }),
    ).toBeNull();
  });

  test("allows two shared mutations concurrently but keeps deletion exclusive until both finish", async () => {
    const organizationId = createId();
    const firstEntered = deferred();
    const secondEntered = deferred();
    const releaseFirst = deferred();
    const releaseSecond = deferred();
    let exclusiveRan = false;
    const first = withOrganizationMutationLock(
      organizationId,
      async () => {
        firstEntered.resolve();
        await releaseFirst.promise;
      },
      { shared: true },
    );
    const second = withOrganizationMutationLock(
      organizationId,
      async () => {
        secondEntered.resolve();
        await releaseSecond.promise;
      },
      { shared: true },
    );

    try {
      await Promise.all([firstEntered.promise, secondEntered.promise]);
      const exclusive = withOrganizationMutationLock(
        organizationId,
        async () => {
          exclusiveRan = true;
        },
      );
      releaseFirst.resolve();
      await first;
      expect(exclusiveRan).toBe(false);
      releaseSecond.resolve();
      await second;
      await exclusive;

      expect(exclusiveRan).toBe(true);
    } finally {
      releaseFirst.resolve();
      releaseSecond.resolve();
      await Promise.allSettled([first, second]);
    }
  });

  test("bounds simultaneous lock holders while keeping application database queries available", async () => {
    const organizationId = createId();
    let active = 0;
    let maximumActive = 0;

    const results = await Promise.all(
      Array.from({ length: 12 }, () =>
        withOrganizationMutationLock(
          organizationId,
          async () => {
            active += 1;
            maximumActive = Math.max(maximumActive, active);
            try {
              const rows = await prisma.$queryRaw<
                { value: number }[]
              >`SELECT 1 AS value`;
              return rows[0]?.value;
            } finally {
              active -= 1;
            }
          },
          { shared: true },
        ),
      ),
    );

    expect(results).toEqual(Array.from({ length: 12 }, () => 1));
    expect(maximumActive).toBeLessThanOrEqual(4);
    expect(active).toBe(0);
  });
});

describe("durable organization cleanup", () => {
  test("checkpoints successful cleanup and makes completed retries harmless", async () => {
    const job = await setupJob();

    await processOrganizationDeletion(job.id);
    await processOrganizationDeletion(job.id);

    const completed = await retrieveJob(job.id);
    expect(cleanupResource).toHaveBeenCalledOnce();
    expect(completed.completedAt).toBeInstanceOf(Date);
    expect(
      completed.resources.every(
        (resource) => resource.completedAt instanceof Date,
      ),
    ).toBe(true);
    expect(completed).toMatchObject({
      lastError: null,
      leaseExpiresAt: null,
      leaseToken: null,
    });
  });

  test("records a provider failure, keeps its resource pending, and retries it when due", async () => {
    const job = await setupJob();
    cleanupResource.mockRejectedValueOnce(
      new Error("Stripe is temporarily unavailable"),
    );
    const before = Date.now();

    await expect(processOrganizationDeletion(job.id)).resolves.toBeUndefined();

    const failed = await retrieveJob(job.id);
    expect(failed).toMatchObject({
      completedAt: null,
      leaseExpiresAt: null,
      leaseToken: null,
    });
    expect(failed.lastError).toBeTruthy();
    expect(failed.nextAttemptAt.getTime()).toBeGreaterThan(before);
    expect(failed.attempts).toBeGreaterThan(0);
    expect(
      failed.resources.every((resource) => resource.completedAt === null),
    ).toBe(true);

    await makeJobDue(job.id);
    await processOrganizationDeletion(job.id);

    expect(cleanupResource).toHaveBeenCalledTimes(2);
    expect((await retrieveJob(job.id)).completedAt).toBeInstanceOf(Date);
  });

  test("preserves earlier checkpoints when a later resource fails", async () => {
    const job = await setupJob([
      { kind: "stripeCustomer", target: `cus_${createId()}` },
      {
        kind: "storageObject",
        target: `app-images/organization-logos/${createId()}.png`,
      },
    ]);
    cleanupResource
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("Storage is unavailable"));

    await processOrganizationDeletion(job.id);

    const failed = await retrieveJob(job.id);
    const finished = failed.resources.find(
      (resource) => resource.completedAt !== null,
    );
    expect(finished).toBeDefined();
    expect(
      failed.resources.filter((resource) => resource.completedAt === null),
    ).toHaveLength(1);
    expect(failed.completedAt).toBeNull();
    cleanupResource.mockClear();
    await makeJobDue(job.id);
    await processOrganizationDeletion(job.id);

    expect(cleanupResource).toHaveBeenCalledOnce();
    expect(cleanupResource).not.toHaveBeenCalledWith(
      expect.objectContaining({ target: finished?.target }),
    );
    expect((await retrieveJob(job.id)).completedAt).toBeInstanceOf(Date);
  });

  test("repeats an idempotent provider operation if recording its success failed", async () => {
    const job = await setupJob();
    const completedProviderTargets = new Set<string>();
    cleanupResource.mockImplementation(async ({ target }) => {
      completedProviderTargets.add(target);
    });
    const checkpoint = vi
      .spyOn(prisma.organizationDeletionResource, "updateMany")
      .mockRejectedValueOnce(
        new Error("Database disconnected before checkpoint"),
      );

    await processOrganizationDeletion(job.id).catch(() => undefined);
    checkpoint.mockRestore();

    const interrupted = await retrieveJob(job.id);
    expect(completedProviderTargets.size).toBe(1);
    expect(interrupted.completedAt).toBeNull();
    expect(
      interrupted.resources.every((resource) => resource.completedAt === null),
    ).toBe(true);
    await prisma.organizationDeletion.update({
      data: { leaseExpiresAt: new Date(0), nextAttemptAt: new Date(0) },
      where: { id: job.id },
    });
    await processOrganizationDeletion(job.id);

    expect(cleanupResource).toHaveBeenCalledTimes(2);
    expect(completedProviderTargets.size).toBe(1);
    expect((await retrieveJob(job.id)).completedAt).toBeInstanceOf(Date);
  });

  test("allows only one worker to process a job with a live lease", async () => {
    const job = await setupJob();
    const entered = deferred();
    const release = deferred();
    cleanupResource.mockImplementationOnce(async () => {
      entered.resolve();
      await release.promise;
    });
    const firstWorker = processOrganizationDeletion(job.id);
    await entered.promise;

    try {
      await processOrganizationDeletion(job.id);
      expect(cleanupResource).toHaveBeenCalledOnce();
      expect((await retrieveJob(job.id)).completedAt).toBeNull();
    } finally {
      release.resolve();
      await firstWorker;
    }

    expect((await retrieveJob(job.id)).completedAt).toBeInstanceOf(Date);
  });

  test("recovers an abandoned expired lease using the persisted resource list", async () => {
    const job = await setupJob();
    await prisma.organizationDeletion.update({
      data: { leaseExpiresAt: new Date(0), leaseToken: "abandoned-worker" },
      where: { id: job.id },
    });

    await processOrganizationDeletion(job.id);

    expect(cleanupResource).toHaveBeenCalledOnce();
    expect(await retrieveJob(job.id)).toMatchObject({
      completedAt: expect.any(Date),
      leaseExpiresAt: null,
      leaseToken: null,
    });
  });

  test("does not let an expired worker checkpoint work after another worker acquires its lease", async () => {
    const job = await setupJob();
    const entered = deferred();
    const release = deferred();
    cleanupResource.mockImplementationOnce(async () => {
      entered.resolve();
      await release.promise;
    });
    const firstWorker = processOrganizationDeletion(job.id);
    await entered.promise;

    try {
      await prisma.organizationDeletion.update({
        data: {
          leaseExpiresAt: new Date(Date.now() + 60_000),
          leaseToken: "replacement-worker",
        },
        where: { id: job.id },
      });
    } finally {
      release.resolve();
      await firstWorker;
    }

    const pending = await retrieveJob(job.id);
    expect(pending.completedAt).toBeNull();
    expect(pending.leaseToken).toBe("replacement-worker");
    expect(
      pending.resources.every((resource) => resource.completedAt === null),
    ).toBe(true);
  });
});

describe("late Stripe events for deleted organizations", () => {
  test("ignores unknown organizations without creating deletion work", async () => {
    const organizationId = createId();

    expect(
      await recordDeletedOrganizationCustomer({
        customerId: `cus_${createId()}`,
        organizationId,
      }),
    ).toBe(false);
    expect(
      await prisma.organizationDeletion.findUnique({
        where: { id: organizationId },
      }),
    ).toBeNull();
    expect(cleanupResource).not.toHaveBeenCalled();
  });

  test("persists a new late customer and reopens a completed job before attempting external cleanup", async () => {
    const job = await setupJob();
    await processOrganizationDeletion(job.id);
    cleanupResource.mockClear();
    const customerId = `cus_${createId()}`;

    expect(
      await recordDeletedOrganizationCustomer({
        customerId,
        organizationId: job.id,
      }),
    ).toBe(true);

    const reopened = await retrieveJob(job.id);
    expect(reopened.completedAt).toBeNull();
    expect(reopened.resources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          completedAt: null,
          kind: "stripeCustomer",
          target: customerId,
        }),
      ]),
    );
    expect(cleanupResource).not.toHaveBeenCalled();
    await processOrganizationDeletion(job.id);

    expect(cleanupResource).toHaveBeenCalledOnce();
    expect(cleanupResource).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "stripeCustomer", target: customerId }),
    );
    expect((await retrieveJob(job.id)).completedAt).toBeInstanceOf(Date);
  });

  test("does not reopen an already deleted customer for duplicate late events", async () => {
    const customerId = `cus_${createId()}`;
    const job = await setupJob([
      { kind: "stripeCustomer", target: customerId },
    ]);
    await processOrganizationDeletion(job.id);
    cleanupResource.mockClear();

    await Promise.all([
      recordDeletedOrganizationCustomer({ customerId, organizationId: job.id }),
      recordDeletedOrganizationCustomer({ customerId, organizationId: job.id }),
    ]);
    await processOrganizationDeletion(job.id);

    const completed = await retrieveJob(job.id);
    expect(completed.completedAt).toBeInstanceOf(Date);
    expect(completed.resources).toHaveLength(1);
    expect(cleanupResource).not.toHaveBeenCalled();
  });

  test("cannot mark a job complete while a late customer is waiting for cleanup", async () => {
    const job = await setupJob();
    const entered = deferred();
    const release = deferred();
    const lateCustomerId = `cus_${createId()}`;
    cleanupResource.mockImplementationOnce(async () => {
      entered.resolve();
      await release.promise;
    });
    const worker = processOrganizationDeletion(job.id);
    await entered.promise;

    try {
      await recordDeletedOrganizationCustomer({
        customerId: lateCustomerId,
        organizationId: job.id,
      });
    } finally {
      release.resolve();
      await worker;
    }

    const afterWorker = await retrieveJob(job.id);
    const lateResource = afterWorker.resources.find(
      (resource) => resource.target === lateCustomerId,
    );
    expect(lateResource).toBeDefined();
    if (lateResource?.completedAt === null) {
      expect(afterWorker.completedAt).toBeNull();
    }
    await makeJobDue(job.id);
    await processOrganizationDeletion(job.id);

    expect((await retrieveJob(job.id)).completedAt).toBeInstanceOf(Date);
    expect(cleanupResource).toHaveBeenCalledWith(
      expect.objectContaining({ target: lateCustomerId }),
    );
  });
});
