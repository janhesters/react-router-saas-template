import { randomUUID } from "node:crypto";
import { describe, expect, onTestFinished, test, vi } from "vitest";

import { requestAccountDeletion } from "./deletion/account-deletion.server";
import { createPopulatedUserAccount } from "./user-accounts-factories.server";
import { upsertUserAccountInDatabaseBySupabaseUserId } from "./user-accounts-model.server";
import { prisma } from "~/utils/database.server";

async function deletedAccount(completedAt: Date | null) {
  const user = createPopulatedUserAccount();
  onTestFinished(async () => {
    await prisma.userAccount.deleteMany({ where: { email: user.email } });
    await prisma.accountDeletion.deleteMany({ where: { id: user.id } });
  });
  await prisma.accountDeletion.create({
    data: {
      completedAt,
      id: user.id,
      recoveryTokenHash: randomUUID(),
      supabaseUserId: user.supabaseUserId,
    },
  });
  return user;
}

describe("authentication account upserts", () => {
  test("given: a callback while account deletion is committing, should: wait for admission and reject the deleted identity", async () => {
    const user = createPopulatedUserAccount();
    let signalDeletionReady = () => {};
    const deletionReady = new Promise<void>((resolve) => {
      signalDeletionReady = resolve;
    });
    let releaseDeletion = () => {};
    const deletionReleased = new Promise<void>((resolve) => {
      releaseDeletion = resolve;
    });
    onTestFinished(async () => {
      releaseDeletion();
      vi.restoreAllMocks();
      await prisma.accountDeletion.deleteMany({ where: { id: user.id } });
      await prisma.userAccount.deleteMany({ where: { email: user.email } });
    });
    await prisma.userAccount.create({ data: user });
    type Transaction = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
    const runTransaction = prisma.$transaction.bind(prisma);
    vi.spyOn(prisma, "$transaction").mockImplementation((async (
      callback: (transaction: Transaction) => Promise<unknown>,
      options?: Parameters<typeof prisma.$transaction>[1],
    ) =>
      runTransaction(
        (transaction) =>
          callback(
            new Proxy(transaction, {
              get(target, property) {
                if (property !== "userAccount")
                  return Reflect.get(target, property);
                return new Proxy(target.userAccount, {
                  get(delegate, operation) {
                    if (operation !== "delete")
                      return Reflect.get(delegate, operation);
                    return async (
                      args: Parameters<typeof delegate.delete>[0],
                    ) => {
                      signalDeletionReady();
                      await deletionReleased;
                      return delegate.delete(args);
                    };
                  },
                });
              },
            }),
          ),
        options,
      )) as unknown as typeof prisma.$transaction);

    const admission = requestAccountDeletion({
      confirmation: user.email,
      userId: user.id,
    });
    await deletionReady;
    const callback = upsertUserAccountInDatabaseBySupabaseUserId(user).then(
      (account) => ({ account }),
      (error: unknown) => ({ error }),
    );
    releaseDeletion();

    await admission;
    expect(await callback).toMatchObject({ error: { status: 410 } });
    expect(
      await prisma.userAccount.findUnique({
        where: { supabaseUserId: user.supabaseUserId },
      }),
    ).toEqual(null);
  });

  test.each([null, new Date()])(
    "given: an account deletion with completedAt %s, should: reject callbacks from the deleted identity without recreating its account",
    async (completedAt) => {
      const user = await deletedAccount(completedAt);

      await expect(
        upsertUserAccountInDatabaseBySupabaseUserId(user),
      ).rejects.toMatchObject({ status: 410 });
      expect(
        await prisma.userAccount.findUnique({
          where: { supabaseUserId: user.supabaseUserId },
        }),
      ).toEqual(null);
    },
  );

  test("given: a new Supabase identity using a deleted account's email, should: allow a fresh account without reusing deleted data", async () => {
    const deleted = await deletedAccount(new Date());
    const supabaseUserId = randomUUID();

    const actual = await upsertUserAccountInDatabaseBySupabaseUserId({
      email: deleted.email,
      supabaseUserId,
    });

    expect(actual).toMatchObject({ email: deleted.email, supabaseUserId });
    expect(actual.id).not.toEqual(deleted.id);
    expect(actual.name).toEqual("");
  });

  test("given: a repeated callback for an active identity, should: refresh the existing account without replacing its profile", async () => {
    const user = createPopulatedUserAccount();
    onTestFinished(async () => {
      await prisma.userAccount.deleteMany({ where: { id: user.id } });
    });
    await prisma.userAccount.create({ data: user });
    const email = createPopulatedUserAccount().email;

    const actual = await upsertUserAccountInDatabaseBySupabaseUserId({
      email,
      supabaseUserId: user.supabaseUserId,
    });

    expect(actual).toMatchObject({
      email,
      id: user.id,
      imageUrl: user.imageUrl,
      name: user.name,
    });
  });
});
