import { createId } from "@paralleldrive/cuid2";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  createImageStorageKey,
  removeImageFromStorage,
} from "./storage-helpers.server";
import { createPopulatedOrganization } from "~/features/organizations/organizations-factories.server";
import { createPopulatedUserAccount } from "~/features/user-accounts/user-accounts-factories.server";
import { prisma } from "~/utils/database.server";

const { remove } = vi.hoisted(() => ({ remove: vi.fn() }));

vi.mock("~/features/user-authentication/supabase.server", () => ({
  supabaseAdminClient: { storage: { from: () => ({ remove }) } },
}));

const userIds: string[] = [];
const organizationIds: string[] = [];

beforeEach(() => {
  remove.mockReset().mockResolvedValue({ error: null });
});

afterEach(async () => {
  await prisma.userAccount.deleteMany({
    where: { id: { in: userIds.splice(0) } },
  });
  await prisma.organization.deleteMany({
    where: { id: { in: organizationIds.splice(0) } },
  });
});

describe("storage reference lookup", () => {
  test.each(
    ["user", "organization"].flatMap((table) =>
      [
        "encoded-filename",
        "control-character",
        "signed-render",
        "encoded-route",
      ].map((alias) => ({ alias, table })),
    ),
  )(
    "given: a $table stores an $alias alias, should: retain the object until that reference is cleared",
    async ({ alias, table }) => {
      const ownerId = createId();
      const key = createImageStorageKey({
        extension: "png",
        kind: "avatar",
        ownerId,
      });
      const filename = key.slice(key.lastIndexOf("/") + 1);
      const imageUrl = `${process.env.VITE_SUPABASE_URL}/storage/v1/object/public/app-images/${key}`;
      const reference =
        alias === "encoded-filename"
          ? imageUrl.replace(
              filename,
              [...filename]
                .map((character) => `%${character.charCodeAt(0).toString(16)}`)
                .join(""),
            )
          : alias === "control-character"
            ? imageUrl.replace(
                filename,
                `${filename.slice(0, 5)}\t${filename.slice(5)}`,
              )
            : alias === "signed-render"
              ? `${imageUrl.replace("/object/public/", "/render/image/sign/")}?token=valid-token&width=128`
              : imageUrl.replace("/storage/", "/%73torage/");

      const holderId = createId();
      if (table === "user") {
        userIds.push(holderId);
        await prisma.userAccount.create({
          data: createPopulatedUserAccount({
            id: holderId,
            imageUrl: reference,
          }),
        });
      } else {
        organizationIds.push(holderId);
        await prisma.organization.create({
          data: createPopulatedOrganization({
            id: holderId,
            imageUrl: reference,
          }),
        });
      }

      await removeImageFromStorage({ imageUrl, kind: "avatar", ownerId });

      expect(remove).not.toHaveBeenCalled();

      if (table === "user") {
        await prisma.userAccount.update({
          data: { imageUrl: "" },
          where: { id: holderId },
        });
      } else {
        await prisma.organization.update({
          data: { imageUrl: "" },
          where: { id: holderId },
        });
      }

      await removeImageFromStorage({ imageUrl, kind: "avatar", ownerId });

      expect(remove).toHaveBeenCalledExactlyOnceWith([key]);
    },
  );
});
