import { createHash, randomBytes } from "node:crypto";
import { createId } from "@paralleldrive/cuid2";
import { describe, expect, onTestFinished, test } from "vitest";

import { action, loader } from "./account-deletions.$deletionId";
import { serializeAccountDeletionRecovery } from "~/features/user-accounts/deletion/account-deletion-recovery.server";
import { createTestContextProvider } from "~/test/test-utils";
import { prisma } from "~/utils/database.server";
import { notFound } from "~/utils/http-responses.server";

const pattern = "/account-deletions/:deletionId";

async function setup() {
  const recoveryToken = randomBytes(32).toString("base64url");
  const deletion = await prisma.accountDeletion.create({
    data: {
      id: createId(),
      recoveryTokenHash: createHash("sha256")
        .update(recoveryToken)
        .digest("hex"),
      supabaseUserId: createId(),
    },
  });
  onTestFinished(async () => {
    await prisma.accountDeletion.deleteMany({ where: { id: deletion.id } });
  });
  const cookie = await serializeAccountDeletionRecovery({
    deletionId: deletion.id,
    recoveryToken,
  });
  return { cookie, deletion };
}

async function args(deletionId: string, cookie?: string, method = "GET") {
  const request = new Request(
    `http://localhost:3000/account-deletions/${deletionId}`,
    { headers: cookie ? { cookie } : {}, method },
  );
  const params = { deletionId };
  return {
    context: await createTestContextProvider({ params, pattern, request }),
    params,
    pattern,
    request,
    url: new URL(request.url),
  };
}

describe("account deletion recovery", () => {
  test.each(["GET", "POST"])(
    "given: no recovery cookie on %s, should: hide the job and deny retry",
    async (method) => {
      const { deletion } = await setup();
      await expect(
        (method === "GET" ? loader : action)(
          await args(deletion.id, undefined, method),
        ),
      ).rejects.toEqual(notFound());
      expect(
        await prisma.accountDeletion.findUnique({ where: { id: deletion.id } }),
      ).toEqual(deletion);
    },
  );

  test.each(["GET", "POST"])(
    "given: another account's cookie on %s, should: keep status and processing private",
    async (method) => {
      const { deletion } = await setup();
      const { cookie } = await setup();
      await expect(
        (method === "GET" ? loader : action)(
          await args(deletion.id, cookie, method),
        ),
      ).rejects.toEqual(notFound());
    },
  );

  test("given: a signed recovery cookie after the account is gone, should: show pending status without running cleanup", async () => {
    const { deletion, cookie } = await setup();
    const response = await loader(await args(deletion.id, cookie));
    expect(response.data).toEqual({
      pageTitle: "Account deletion | React Router SaaS Template",
      status: "pending",
    });
    expect(new Headers(response.init?.headers).get("Cache-Control")).toEqual(
      "private, no-store",
    );
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
    expect(
      await prisma.accountDeletion.findUnique({ where: { id: deletion.id } }),
    ).toEqual(deletion);
  });

  test("given: provider cleanup failed, should: show retry status without identities, recovery secrets, or provider diagnostics", async () => {
    const { deletion, cookie } = await setup();
    await prisma.accountDeletion.update({
      data: { lastError: "Sensitive provider diagnostic" },
      where: { id: deletion.id },
    });
    const response = await loader(await args(deletion.id, cookie));
    expect(response.data.status).toEqual("retrying");
    expect(Object.keys(response.data).sort()).toEqual(["pageTitle", "status"]);
    expect(JSON.stringify(response.data)).not.toContain("Sensitive");
  });

  test("given: a valid recovery cookie retries completed resources, should: show completion without requiring a login", async () => {
    const { deletion, cookie } = await setup();
    await action(await args(deletion.id, cookie, "POST"));
    expect((await loader(await args(deletion.id, cookie))).data.status).toEqual(
      "completed",
    );
  });
});
