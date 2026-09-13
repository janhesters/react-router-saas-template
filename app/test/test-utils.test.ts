import { beforeEach, describe, expect, test, vi } from "vitest";

import { teardownOrganizationAndMember } from "./test-utils";
import { createPopulatedOrganization } from "~/features/organizations/organizations-factories.server";
import { createPopulatedUserAccount } from "~/features/user-accounts/user-accounts-factories.server";
import { Prisma } from "~/generated/client";

const { prisma } = vi.hoisted(() => ({
  prisma: {
    $transaction: (queries: Promise<unknown>[]) => Promise.all(queries),
    organization: { delete: vi.fn(), deleteMany: vi.fn() },
    userAccount: { delete: vi.fn(), deleteMany: vi.fn() },
  },
}));

vi.mock("~/utils/database.server", () => ({ prisma }));

describe("teardownOrganizationAndMember()", () => {
  beforeEach(() => {
    for (const model of [prisma.organization, prisma.userAccount]) {
      model.delete.mockReset().mockResolvedValue({});
      model.deleteMany.mockReset().mockResolvedValue({ count: 1 });
    }
  });

  test.each([
    { code: "P1001", model: "organization" },
    { code: "P2003", model: "organization" },
    { code: "P1001", model: "userAccount" },
    { code: "P2003", model: "userAccount" },
  ] as const)(
    "given: $model deletion fails with $code, should: surface the database error",
    async ({ code, model }) => {
      const error =
        code === "P1001"
          ? new Prisma.PrismaClientInitializationError(
              "Database unavailable",
              "test",
              code,
            )
          : new Prisma.PrismaClientKnownRequestError(
              "Unexpected foreign-key constraint failure",
              { clientVersion: "test", code },
            );
      prisma[model].delete.mockRejectedValueOnce(error);
      prisma[model].deleteMany.mockRejectedValueOnce(error);

      await expect(
        teardownOrganizationAndMember({
          organization: createPopulatedOrganization(),
          user: createPopulatedUserAccount(),
        }),
      ).rejects.toEqual(error);
    },
  );
});
