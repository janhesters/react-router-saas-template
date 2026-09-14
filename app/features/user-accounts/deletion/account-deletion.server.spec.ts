import { createHash, randomUUID } from "node:crypto";
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
  getAccountDeletionForRecovery,
  processAccountDeletion,
  requestAccountDeletion,
} from "./account-deletion.server";
import { cleanupAccountDeletionResource } from "./account-deletion-providers.server";
import {
  recordDeletedOrganizationCustomer,
  requestOrganizationDeletion,
} from "~/features/organizations/deletion/organization-deletion.server";
import { createPopulatedOrganization } from "~/features/organizations/organizations-factories.server";
import { createPopulatedUserAccount } from "~/features/user-accounts/user-accounts-factories.server";
import type {
  AccountDeletionResourceKind,
  OrganizationMembershipRole,
} from "~/generated/client";
import { prisma } from "~/utils/database.server";

vi.mock("./account-deletion-providers.server", () => ({
  cleanupAccountDeletionResource: vi.fn(),
}));
const cleanupResource = vi.mocked(cleanupAccountDeletionResource);
type Transaction = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

beforeEach(() => {
  cleanupResource.mockReset().mockResolvedValue(undefined);
});
afterEach(() => {
  vi.restoreAllMocks();
});

async function setupAccount() {
  const user = createPopulatedUserAccount({ imageUrl: "" });
  const organizationIds: string[] = [];
  const otherUserIds: string[] = [];
  await prisma.userAccount.create({ data: user });
  onTestFinished(async () => {
    await prisma.accountDeletion.deleteMany({ where: { id: user.id } });
    await prisma.organizationDeletion.deleteMany({
      where: { id: { in: organizationIds } },
    });
    await prisma.organization.deleteMany({
      where: { id: { in: organizationIds } },
    });
    await prisma.userAccount.deleteMany({
      where: { id: { in: [user.id, ...otherUserIds] } },
    });
  });
  const addOrganization = async (
    role: OrganizationMembershipRole,
    otherRoles: OrganizationMembershipRole[] = [],
  ) => {
    const organization = createPopulatedOrganization({ imageUrl: "" });
    organizationIds.push(organization.id);
    const others = otherRoles.map(() => createPopulatedUserAccount());
    otherUserIds.push(...others.map(({ id }) => id));
    await prisma.userAccount.createMany({ data: others });
    await prisma.organization.create({
      data: {
        ...organization,
        memberships: {
          create: [
            { memberId: user.id, role },
            ...others.map((other, index) => ({
              memberId: other.id,
              role: otherRoles[index],
            })),
          ],
        },
      },
    });
    return { organization, others };
  };
  return {
    addOrganization,
    requestDeletion: (confirmation = user.email) =>
      requestAccountDeletion({ confirmation, userId: user.id }),
    user,
  };
}

describe("account deletion admission", () => {
  test("given: an account without organizations, should: atomically remove the account and persist Auth and avatar cleanup", async () => {
    const { user, requestDeletion } = await setupAccount();
    const avatarKey = `user-avatars/${user.id}/${randomUUID()}.png`;
    await prisma.userAccount.update({
      data: {
        imageUrl: new URL(
          `/storage/v1/object/public/app-images/${avatarKey}`,
          process.env.VITE_SUPABASE_URL,
        ).href,
      },
      where: { id: user.id },
    });

    const { deletion, recoveryToken } = await requestDeletion();

    expect(
      await prisma.userAccount.findUnique({ where: { id: user.id } }),
    ).toEqual(null);
    expect(deletion.supabaseUserId).toEqual(user.supabaseUserId);
    expect(deletion.recoveryTokenHash).toEqual(
      createHash("sha256").update(recoveryToken).digest("hex"),
    );
    expect(
      await prisma.accountDeletionResource.findMany({
        select: { kind: true, target: true },
        where: { deletionId: user.id },
      }),
    ).toEqual(
      expect.arrayContaining([
        { kind: "authUser", target: user.supabaseUserId },
        { kind: "storageObject", target: `app-images/${avatarKey}` },
      ]),
    );
    expect(cleanupResource).not.toHaveBeenCalled();
  });

  test("given: solely owned and shared organizations, should: delete only the sole organization and retain shared billing", async () => {
    const { user, addOrganization, requestDeletion } = await setupAccount();
    const sole = await addOrganization("owner");
    const shared = await addOrganization("member", ["owner"]);
    const coOwned = await addOrganization("owner", ["owner"]);

    await requestDeletion();

    expect(
      await prisma.organization.findUnique({
        where: { id: sole.organization.id },
      }),
    ).toEqual(null);
    expect(
      await prisma.organizationDeletion.findUnique({
        where: { id: sole.organization.id },
      }),
    ).toMatchObject({ requestedById: user.id });
    expect(
      await prisma.organization.count({
        where: {
          id: { in: [shared.organization.id, coOwned.organization.id] },
        },
      }),
    ).toEqual(2);
    expect(
      await prisma.organizationMembership.count({
        where: { memberId: user.id },
      }),
    ).toEqual(0);
    expect(
      await prisma.accountDeletionResource.findMany({
        select: { kind: true, target: true },
        where: { deletionId: user.id },
      }),
    ).toEqual(
      expect.arrayContaining([
        { kind: "organizationDeletion", target: sole.organization.id },
        { kind: "billingSeats", target: shared.organization.id },
        { kind: "billingSeats", target: coOwned.organization.id },
      ]),
    );
  });

  test("given: the last active owner of a shared organization, should: reject before deleting any account or organization", async () => {
    const { user, addOrganization, requestDeletion } = await setupAccount();
    const sole = await addOrganization("owner");
    const shared = await addOrganization("owner", ["member"]);
    await expect(requestDeletion()).rejects.toMatchObject({
      code: "ownershipRequired",
    });
    expect(await prisma.userAccount.count({ where: { id: user.id } })).toEqual(
      1,
    );
    expect(
      await prisma.organization.count({
        where: { id: { in: [sole.organization.id, shared.organization.id] } },
      }),
    ).toEqual(2);
    expect(
      await prisma.accountDeletion.count({ where: { id: user.id } }),
    ).toEqual(0);
    expect(
      await prisma.organizationDeletion.count({
        where: { id: sole.organization.id },
      }),
    ).toEqual(0);
  });

  test("given: an inactive co-owner and active members, should: require ownership transfer", async () => {
    const { addOrganization, requestDeletion } = await setupAccount();
    const { organization, others } = await addOrganization("owner", [
      "owner",
      "member",
    ]);
    const otherOwner = others[0];
    if (!otherOwner) throw new Error("Expected another owner in the fixture");
    await prisma.organizationMembership.update({
      data: { deactivatedAt: new Date(0) },
      where: {
        memberId_organizationId: {
          memberId: otherOwner.id,
          organizationId: organization.id,
        },
      },
    });
    await expect(requestDeletion()).rejects.toMatchObject({
      code: "ownershipRequired",
    });
  });

  test("given: a mismatched email confirmation, should: leave all account data unchanged", async () => {
    const { user, requestDeletion } = await setupAccount();
    await expect(requestDeletion("wrong@example.com")).rejects.toMatchObject({
      code: "confirmationMismatch",
    });
    expect(await prisma.userAccount.count({ where: { id: user.id } })).toEqual(
      1,
    );
    expect(
      await prisma.accountDeletion.count({ where: { id: user.id } }),
    ).toEqual(0);
  });

  test("given: account deletion fails after organization manifests were written, should: roll back every deletion and manifest", async () => {
    const { user, addOrganization, requestDeletion } = await setupAccount();
    const { organization } = await addOrganization("owner");
    const transaction = prisma.$transaction.bind(prisma);
    vi.spyOn(prisma, "$transaction").mockImplementation(((
      callback: (transaction: Transaction) => Promise<unknown>,
      options: unknown,
    ) =>
      transaction(
        (tx) =>
          callback(
            new Proxy(tx, {
              get(target, property) {
                if (property === "userAccount")
                  return new Proxy(target.userAccount, {
                    get(delegate, method) {
                      if (method === "delete")
                        return () => {
                          throw new Error("database deletion failed");
                        };
                      return Reflect.get(delegate, method);
                    },
                  });
                return Reflect.get(target, property);
              },
            }),
          ),
        options as never,
      )) as typeof prisma.$transaction);

    await expect(requestDeletion()).rejects.toThrow("database deletion failed");
    expect(await prisma.userAccount.count({ where: { id: user.id } })).toEqual(
      1,
    );
    expect(
      await prisma.organization.count({ where: { id: organization.id } }),
    ).toEqual(1);
    expect(
      await prisma.accountDeletion.count({ where: { id: user.id } }),
    ).toEqual(0);
    expect(
      await prisma.organizationDeletion.count({
        where: { id: organization.id },
      }),
    ).toEqual(0);
  });

  test("given: a recovery token for another deletion or a guessed token, should: keep account deletion status private", async () => {
    const first = await setupAccount();
    const second = await setupAccount();
    const firstResult = await first.requestDeletion();
    const secondResult = await second.requestDeletion();
    expect(
      await getAccountDeletionForRecovery({
        deletionId: first.user.id,
        recoveryToken: firstResult.recoveryToken,
      }),
    ).toEqual(firstResult.deletion);
    expect(
      await getAccountDeletionForRecovery({
        deletionId: first.user.id,
        recoveryToken: secondResult.recoveryToken,
      }),
    ).toEqual(null);
    expect(
      await getAccountDeletionForRecovery({
        deletionId: first.user.id,
        recoveryToken: "guessed",
      }),
    ).toEqual(null);
  });

  test("given: concurrent and repeated admissions, should: return the same durable job and recovery token", async () => {
    const { user, requestDeletion } = await setupAccount();
    const results = await Promise.all([
      requestDeletion(),
      requestDeletion(),
      requestDeletion(),
    ]);
    results.push(await requestDeletion());
    expect(
      new Set(results.map(({ recoveryToken }) => recoveryToken)).size,
    ).toEqual(1);
    expect(results.map(({ deletion }) => deletion.id)).toEqual([
      user.id,
      user.id,
      user.id,
      user.id,
    ]);
    expect(
      await prisma.accountDeletion.count({ where: { id: user.id } }),
    ).toEqual(1);
  });

  test("given: a new owned shared membership committed before admission locks the account, should: refresh authorization and reject deletion", async () => {
    const { user, addOrganization, requestDeletion } = await setupAccount();
    const findUser = prisma.userAccount.findUnique.bind(prisma.userAccount);
    vi.spyOn(prisma.userAccount, "findUnique").mockImplementationOnce((async (
      args: Parameters<typeof findUser>[0],
    ) => {
      const candidate = await findUser(args);
      await addOrganization("owner", ["member"]);
      return candidate;
    }) as typeof findUser);
    await expect(requestDeletion()).rejects.toMatchObject({
      code: "ownershipRequired",
    });
    expect(await prisma.userAccount.count({ where: { id: user.id } })).toEqual(
      1,
    );
    expect(
      await prisma.accountDeletion.count({ where: { id: user.id } }),
    ).toEqual(0);
  });

  test("given: an earlier explicit organization deletion, should: retain its cleanup dependency after removing the account", async () => {
    const { user, addOrganization, requestDeletion } = await setupAccount();
    const { organization } = await addOrganization("owner");
    await requestOrganizationDeletion({
      confirmation: organization.name,
      organizationId: organization.id,
      userId: user.id,
    });
    await requestDeletion();
    expect(
      await prisma.accountDeletionResource.findFirst({
        where: {
          deletionId: user.id,
          kind: "organizationDeletion",
          target: organization.id,
        },
      }),
    ).toMatchObject({ completedAt: null });
  });
});

describe("account deletion cleanup", () => {
  async function setupJob(
    resources: { kind: AccountDeletionResourceKind; target: string }[] = [
      { kind: "authUser", target: randomUUID() },
      { kind: "storageObject", target: "app-images/user-avatars/test.png" },
    ],
  ) {
    const id = randomUUID();
    onTestFinished(async () => {
      await prisma.accountDeletion.deleteMany({ where: { id } });
    });
    return prisma.accountDeletion.create({
      data: {
        id,
        recoveryTokenHash: "hashed-token",
        resources: { create: resources },
        supabaseUserId: randomUUID(),
      },
    });
  }

  test("given: Auth succeeded and storage failed, should: retain progress and retry only unfinished resources", async () => {
    const job = await setupJob();
    cleanupResource
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("storage unavailable"));
    await processAccountDeletion(job.id);
    expect(
      await prisma.accountDeletion.findUnique({ where: { id: job.id } }),
    ).toMatchObject({
      attempts: 1,
      completedAt: null,
      lastError: "storage unavailable",
      leaseToken: null,
    });
    expect(
      await prisma.accountDeletionResource.count({
        where: { completedAt: { not: null }, deletionId: job.id },
      }),
    ).toEqual(1);
    cleanupResource.mockClear();
    await processAccountDeletion(job.id);
    expect(cleanupResource).toHaveBeenCalledTimes(1);
    expect(
      await prisma.accountDeletion.findUnique({ where: { id: job.id } }),
    ).toMatchObject({
      attempts: 2,
      completedAt: expect.any(Date),
      lastError: null,
    });
  });

  test("given: concurrent workers, should: allow only one worker to process each resource", async () => {
    const job = await setupJob();
    let release: () => void = () => {};
    let started: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const entered = new Promise<void>((resolve) => {
      started = resolve;
    });
    cleanupResource.mockImplementationOnce(async () => {
      started();
      await gate;
    });
    const first = processAccountDeletion(job.id);
    await entered;
    await processAccountDeletion(job.id);
    expect(cleanupResource).toHaveBeenCalledTimes(1);
    release();
    await first;
    expect(cleanupResource).toHaveBeenCalledTimes(2);
  });

  test("given: a persisted expired lease after a restart, should: resume cleanup and complete the account", async () => {
    const job = await setupJob();
    await prisma.accountDeletion.update({
      data: { leaseExpiresAt: new Date(0), leaseToken: "expired" },
      where: { id: job.id },
    });
    await processAccountDeletion(job.id);
    expect(
      await prisma.accountDeletion.findUnique({ where: { id: job.id } }),
    ).toMatchObject({ completedAt: expect.any(Date), leaseToken: null });
  });

  test("given: Auth cleanup fails, should: still process independent billing and storage cleanup", async () => {
    const job = await setupJob([
      { kind: "authUser", target: randomUUID() },
      { kind: "billingSeats", target: randomUUID() },
      { kind: "storageObject", target: "app-images/user-avatars/test.png" },
    ]);
    cleanupResource.mockRejectedValueOnce(new Error("Auth unavailable"));
    await processAccountDeletion(job.id);
    expect(cleanupResource).toHaveBeenCalledTimes(3);
    expect(
      await prisma.accountDeletionResource.count({
        where: { completedAt: { not: null }, deletionId: job.id },
      }),
    ).toEqual(2);
    expect(
      await prisma.accountDeletion.findUnique({ where: { id: job.id } }),
    ).toMatchObject({ completedAt: null, lastError: "Auth unavailable" });
  });

  test("given: a late customer event after account cleanup completed, should: reopen both organization and account cleanup", async () => {
    const organizationId = randomUUID();
    const job = await setupJob([
      { kind: "organizationDeletion", target: organizationId },
    ]);
    onTestFinished(async () => {
      await prisma.organizationDeletion.deleteMany({
        where: { id: organizationId },
      });
    });
    await prisma.organizationDeletion.create({
      data: {
        completedAt: new Date(),
        id: organizationId,
        organizationName: "Deleted",
        organizationSlug: organizationId,
        requestedById: job.id,
      },
    });
    await processAccountDeletion(job.id);
    expect(
      await prisma.accountDeletion.findUnique({ where: { id: job.id } }),
    ).toMatchObject({ completedAt: expect.any(Date) });
    await recordDeletedOrganizationCustomer({
      customerId: "cus_late_account_deletion",
      organizationId,
    });
    expect(
      await prisma.accountDeletion.findUnique({ where: { id: job.id } }),
    ).toMatchObject({ completedAt: null });
    expect(
      await prisma.accountDeletionResource.findFirst({
        where: { deletionId: job.id, kind: "organizationDeletion" },
      }),
    ).toMatchObject({ completedAt: null });
  });
});
