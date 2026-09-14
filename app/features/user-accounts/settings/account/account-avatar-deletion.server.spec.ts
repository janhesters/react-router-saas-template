import { randomUUID } from "node:crypto";
import { afterEach, expect, onTestFinished, test, vi } from "vitest";

import { accountSettingsAction } from "./account-settings-action.server";
import { UPDATE_USER_ACCOUNT_INTENT } from "./account-settings-constants";
import * as accountSettingsHelpers from "./account-settings-helpers.server";
import { requestAccountDeletion } from "~/features/user-accounts/deletion/account-deletion.server";
import { createPopulatedUserAccount } from "~/features/user-accounts/user-accounts-factories.server";
import { supabaseHandlers } from "~/test/mocks/handlers/supabase";
import { setupMockServerLifecycle } from "~/test/msw-test-utils";
import {
  createAuthenticatedRequest,
  createAuthTestContextProvider,
} from "~/test/test-utils";
import { prisma } from "~/utils/database.server";
import { toFormData } from "~/utils/to-form-data";

setupMockServerLifecycle(...supabaseHandlers);
afterEach(() => vi.restoreAllMocks());

function deferred() {
  let resolve = () => {};
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

test("given: account deletion overlaps an avatar upload, should: wait for publication and journal the newly published avatar", async () => {
  const user = createPopulatedUserAccount({ imageUrl: "" });
  await prisma.userAccount.create({ data: user });
  const uploadStarted = deferred();
  const finishUpload = deferred();
  let update: Promise<unknown> | undefined;
  let deletion: ReturnType<typeof requestAccountDeletion> | undefined;
  onTestFinished(async () => {
    finishUpload.resolve();
    await Promise.allSettled([update, deletion]);
    await prisma.accountDeletion.deleteMany({ where: { id: user.id } });
    await prisma.userAccount.deleteMany({ where: { id: user.id } });
  });

  const avatarKey = `user-avatars/${user.id}/${randomUUID()}.png`;
  const avatarUrl = new URL(
    `/storage/v1/object/public/app-images/${avatarKey}`,
    process.env.VITE_SUPABASE_URL,
  ).href;
  vi.spyOn(accountSettingsHelpers, "uploadUserAvatar").mockImplementation(
    async () => {
      uploadStarted.resolve();
      await finishUpload.promise;
      return avatarUrl;
    },
  );
  const request = await createAuthenticatedRequest({
    formData: toFormData({
      avatar: new File(["avatar"], "avatar.png", { type: "image/png" }),
      intent: UPDATE_USER_ACCOUNT_INTENT,
      name: user.name,
    }),
    method: "POST",
    url: "http://localhost:3000/settings/account",
    user,
  });
  const params = {};
  const pattern = "/settings/account";
  const context = await createAuthTestContextProvider({
    params,
    pattern,
    request,
  });
  update = accountSettingsAction({
    context,
    params,
    pattern,
    request,
    url: new URL(request.url),
  });
  await uploadStarted.promise;

  let admissionSettled = false;
  deletion = requestAccountDeletion({
    confirmation: user.email,
    userId: user.id,
  }).finally(() => {
    admissionSettled = true;
  });
  // Observe the real database lock, rather than assuming a delayed promise
  // means that admission has reached its serialization boundary.
  const accountLockKey = `account:${user.supabaseUserId}`;
  await vi.waitFor(
    async () => {
      const [lock] = await prisma.$queryRaw<{ waiting: boolean }[]>`
        SELECT EXISTS (
          SELECT 1 FROM pg_locks
          WHERE locktype = 'advisory' AND NOT granted
            AND classid::bigint = ((hashtextextended(${accountLockKey}, 0) >> 32) & 4294967295)
            AND objid::bigint = (hashtextextended(${accountLockKey}, 0) & 4294967295)
        ) AS waiting
      `;
      expect(admissionSettled || lock?.waiting).toEqual(true);
    },
    { timeout: 5000 },
  );
  expect(admissionSettled).toEqual(false);
  expect(
    await prisma.userAccount.findUnique({ where: { id: user.id } }),
  ).not.toEqual(null);

  finishUpload.resolve();
  const updateResult = await update;
  expect(updateResult).toMatchObject({ data: { result: undefined } });
  const admitted = await deletion;
  expect(admitted.deletion.id).toEqual(user.id);
  expect(
    await prisma.userAccount.findUnique({ where: { id: user.id } }),
  ).toEqual(null);
  expect(
    await prisma.accountDeletionResource.findMany({
      select: { kind: true, target: true },
      where: { deletionId: user.id, kind: "storageObject" },
    }),
  ).toContainEqual({
    kind: "storageObject",
    target: `app-images/${avatarKey}`,
  });
});
