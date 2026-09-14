import { createId } from "@paralleldrive/cuid2";
import { describe, expect, onTestFinished, test } from "vitest";

import { action, loader } from "./organization-deletions.$deletionId";
import { createPopulatedUserAccount } from "~/features/user-accounts/user-accounts-factories.server";
import { saveUserAccountToDatabase } from "~/features/user-accounts/user-accounts-model.server";
import type { UserAccount } from "~/generated/client";
import { supabaseHandlers } from "~/test/mocks/handlers/supabase";
import { setupMockServerLifecycle } from "~/test/msw-test-utils";
import {
  createAuthenticatedRequest,
  createAuthTestContextProvider,
} from "~/test/test-utils";
import { prisma } from "~/utils/database.server";
import { notFound } from "~/utils/http-responses.server";

const pattern = "/organization-deletions/:deletionId";
setupMockServerLifecycle(...supabaseHandlers);

async function setup() {
  const user = await saveUserAccountToDatabase(createPopulatedUserAccount());
  const deletion = await prisma.organizationDeletion.create({
    data: {
      id: createId(),
      organizationName: "Acme Studio",
      organizationSlug: "acme-studio",
      requestedById: user.id,
    },
  });
  onTestFinished(async () => {
    await prisma.organizationDeletion.deleteMany({
      where: { id: deletion.id },
    });
    await prisma.userAccount.deleteMany({ where: { id: user.id } });
  });
  return { deletion, user };
}

async function createArgs({
  deletionId,
  method = "GET",
  user,
}: {
  deletionId: string;
  method?: string;
  user?: UserAccount;
}) {
  const url = `http://localhost:3000/organization-deletions/${deletionId}`;
  const request = user
    ? await createAuthenticatedRequest({ method, url, user })
    : new Request(url, { method });
  const params = { deletionId };
  return {
    context: await createAuthTestContextProvider({ params, pattern, request }),
    params,
    pattern,
    request,
    url: new URL(url),
  };
}

describe("/organization-deletions/:deletionId", () => {
  test("given: a logged out visitor, should: redirect to login", async () => {
    const deletionId = createId();
    await expect(createArgs({ deletionId }).then(loader)).rejects.toMatchObject(
      { status: 302 },
    );
  });

  test.each(["GET", "POST"])(
    "given: another account sends %s, should: hide the deletion job and prevent processing",
    async (method) => {
      const { deletion } = await setup();
      const user = await saveUserAccountToDatabase(
        createPopulatedUserAccount(),
      );
      onTestFinished(async () => {
        await prisma.userAccount.deleteMany({ where: { id: user.id } });
      });
      const args = await createArgs({ deletionId: deletion.id, method, user });
      await expect(
        method === "GET" ? loader(args) : action(args),
      ).rejects.toEqual(notFound());
      expect(
        await prisma.organizationDeletion.findUnique({
          where: { id: deletion.id },
        }),
      ).toEqual(deletion);
    },
  );

  test("given: a requester without any remaining organization, should: show pending status without running cleanup", async () => {
    const { deletion, user } = await setup();
    const result = await loader(
      await createArgs({ deletionId: deletion.id, user }),
    );
    expect(result).toEqual({
      organizationName: "Acme Studio",
      pageTitle: "Organization deletion | React Router SaaS Template",
      status: "pending",
    });
    expect(
      await prisma.organizationDeletion.findUnique({
        where: { id: deletion.id },
      }),
    ).toEqual(deletion);
  });

  test("given: failed cleanup, should: expose a retrying status without internal errors or lease details", async () => {
    const { deletion, user } = await setup();
    await prisma.organizationDeletion.update({
      data: { attempts: 1, lastError: "Provider secret diagnostic" },
      where: { id: deletion.id },
    });
    const result = await loader(
      await createArgs({ deletionId: deletion.id, user }),
    );
    expect(result.status).toBe("retrying");
    expect(Object.keys(result).sort()).toEqual([
      "organizationName",
      "pageTitle",
      "status",
    ]);
    expect(JSON.stringify(result)).not.toContain("Provider secret diagnostic");
  });

  test("given: the requester retries, should: finish pending cleanup and report completion", async () => {
    const { deletion, user } = await setup();
    const response = await action(
      await createArgs({ deletionId: deletion.id, method: "POST", user }),
    );
    expect(response).toEqual({ result: undefined });
    const result = await loader(
      await createArgs({ deletionId: deletion.id, user }),
    );
    expect(result.status).toBe("completed");
    expect(
      await prisma.organizationDeletion.findUnique({
        where: { id: deletion.id },
      }),
    ).toMatchObject({ completedAt: expect.any(Date) });
  });
});
