import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  createImageStorageKey,
  reclaimImageFromStorage,
  removeImageFromStorage,
} from "./storage-helpers.server";

const { from, remove, findUsers, findOrganizations } = vi.hoisted(() => ({
  findOrganizations: vi.fn<() => Promise<{ imageUrl: string }[]>>(),
  findUsers: vi.fn<() => Promise<{ imageUrl: string }[]>>(),
  from: vi.fn(),
  remove: vi.fn<(keys: string[]) => Promise<{ error: Error | null }>>(),
}));

vi.mock("~/features/user-authentication/supabase.server", () => ({
  supabaseAdminClient: { storage: { from } },
}));

vi.mock("~/utils/database.server", () => ({
  prisma: {
    organization: { findMany: findOrganizations },
    userAccount: { findMany: findUsers },
  },
}));

const origin = "https://storage.example.com";
const ownerId = "test-owner";
const uuid = "a9873bb2-b617-4f8d-9b5d-bdb2161fa476";
const avatarKey = `user-avatars/${ownerId}/${uuid}.png`;
const logoKey = `organization-logos/${ownerId}/${uuid}.png`;
const storage = new Map<string, string>();
const publicUrl = (key: string) =>
  `${origin}/storage/v1/object/public/app-images/${key}`;
const avatar = {
  imageUrl: publicUrl(avatarKey),
  kind: "avatar" as const,
  ownerId,
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("VITE_SUPABASE_URL", origin);
  storage.clear();
  storage.set(avatarKey, "committed avatar bytes");
  storage.set(logoKey, "committed logo bytes");
  findUsers.mockResolvedValue([]);
  findOrganizations.mockResolvedValue([]);
  from.mockReturnValue({ remove });
  remove.mockImplementation(async (keys) => {
    for (const key of keys) {
      storage.delete(key);
    }
    return { error: null };
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("createImageStorageKey()", () => {
  test.each([
    { kind: "avatar", prefix: "user-avatars" },
    { kind: "organization-logo", prefix: "organization-logos" },
  ] as const)(
    "given: repeated $kind uploads, should: create unique owner-scoped keys",
    ({ kind, prefix }) => {
      const keys = Array.from({ length: 20 }, () =>
        createImageStorageKey({ extension: "PNG", kind, ownerId }),
      );

      expect(new Set(keys).size).toEqual(keys.length);
      for (const key of keys) {
        expect(key).toMatch(
          new RegExp(
            `^${prefix}/${ownerId}/[a-f\\d]{8}-[a-f\\d]{4}-4[a-f\\d]{3}-[89ab][a-f\\d]{3}-[a-f\\d]{12}\\.png$`,
          ),
        );
      }
    },
  );

  test.each([
    { extension: "../png", ownerId },
    { extension: "png/other", ownerId },
    { extension: "", ownerId },
    { extension: "x".repeat(17), ownerId },
    { extension: "png", ownerId: "../another-owner" },
    { extension: "png", ownerId: "" },
  ])(
    "given: invalid key parts $ownerId / $extension, should: reject the key",
    (parts) => {
      expect(() => createImageStorageKey({ ...parts, kind: "avatar" })).toThrow(
        "Invalid image storage owner or extension",
      );
    },
  );
});

describe("removeImageFromStorage()", () => {
  test.each([
    { key: avatarKey, kind: "avatar" },
    { key: logoKey, kind: "organization-logo" },
    { key: `user-avatars/${ownerId}.PNG`, kind: "avatar" },
    { key: `organization-logos/${ownerId}.jpeg`, kind: "organization-logo" },
  ] as const)(
    "given: an unreferenced owned key $key, should: delete only that object",
    async ({ key, kind }) => {
      storage.set(key, "old bytes");
      storage.set("unrelated", "unrelated bytes");

      await removeImageFromStorage({
        imageUrl: publicUrl(key),
        kind,
        ownerId,
      });

      expect(from).toHaveBeenCalledWith("app-images");
      expect(remove).toHaveBeenCalledExactlyOnceWith([key]);
      expect(storage.has(key)).toEqual(false);
      expect(storage.get("unrelated")).toEqual("unrelated bytes");
    },
  );

  test("given: an unreferenced render URL, should: remove its owned object", async () => {
    await removeImageFromStorage({
      ...avatar,
      imageUrl: `${avatar.imageUrl.replace("/object/", "/render/image/")}?width=128`,
    });

    expect(remove).toHaveBeenCalledExactlyOnceWith([avatarKey]);
    expect(storage.has(avatarKey)).toEqual(false);
  });

  test.each([
    "not a URL",
    "",
    publicUrl(avatarKey).replace(origin, "https://oauth.example.com"),
    publicUrl(avatarKey).replace(origin, `${origin}.attacker.example.com`),
    publicUrl(avatarKey).replace("app-images", "private-files"),
    publicUrl(avatarKey).replace(ownerId, `${ownerId}-other`),
    publicUrl(avatarKey).replace("user-avatars", "organization-logos"),
    publicUrl(avatarKey).replace(uuid, "unmanaged-filename"),
    publicUrl(avatarKey).replace(`${uuid}.png`, `${uuid}.png/extra`),
    publicUrl(avatarKey).replace(ownerId, `${ownerId}%2Fother`),
    publicUrl(avatarKey).replace("user-avatars/", "user-avatars/other/../"),
    publicUrl(avatarKey).replace("user-avatars/", "user-avatars/other/%2e%2e/"),
    publicUrl(avatarKey).replace("/storage/", "/other/storage/"),
    publicUrl(avatarKey).replace("https://", "https://credentials@"),
    `${publicUrl(avatarKey)}#fragment`,
    ` ${publicUrl(avatarKey)}`,
    publicUrl(avatarKey).replace("user-avatars/", "user-avatars\\"),
  ])(
    "given: an unsafe candidate %s, should: leave storage untouched",
    async (imageUrl) => {
      await removeImageFromStorage({ ...avatar, imageUrl });

      expect(findUsers).not.toHaveBeenCalled();
      expect(findOrganizations).not.toHaveBeenCalled();
      expect(from).not.toHaveBeenCalled();
      expect(storage.get(avatarKey)).toEqual("committed avatar bytes");
      expect(storage.get(logoKey)).toEqual("committed logo bytes");
    },
  );

  test.each([
    { reference: publicUrl(avatarKey), table: "user" },
    { reference: publicUrl(avatarKey), table: "organization" },
    {
      reference: `${publicUrl(avatarKey)}?download=avatar.png`,
      table: "user",
    },
    {
      reference: `${publicUrl(avatarKey).replace("/object/", "/render/image/")}?width=128`,
      table: "organization",
    },
    {
      reference: publicUrl(avatarKey).replace("test-owner", "test%2Downer"),
      table: "user",
    },
    {
      reference: `${publicUrl(avatarKey)}#avatar`,
      table: "organization",
    },
    {
      reference: publicUrl(avatarKey).replace("/storage/", "/%73torage/"),
      table: "user",
    },
    {
      reference: `${publicUrl(avatarKey).replace("/object/public/", "/object/sign/")}?token=valid-token`,
      table: "organization",
    },
    {
      reference: `${publicUrl(avatarKey).replace("/object/public/", "/render/image/sign/")}?token=valid-token&width=128`,
      table: "user",
    },
    {
      reference: publicUrl(avatarKey).replace("/public/", "/authenticated/"),
      table: "organization",
    },
    {
      reference: publicUrl(avatarKey).replace(uuid, `%61${uuid.slice(1)}`),
      table: "user",
    },
    {
      reference: publicUrl(avatarKey).replace(uuid, `a\t${uuid.slice(1)}`),
      table: "organization",
    },
    {
      reference: publicUrl(avatarKey).replace(uuid, `ignored%2F..%2F${uuid}`),
      table: "user",
    },
  ])(
    "given: a live $table reference $reference, should: preserve the readable object",
    async ({ reference, table }) => {
      const findReferences = table === "user" ? findUsers : findOrganizations;
      findReferences.mockResolvedValue([{ imageUrl: reference }]);

      await removeImageFromStorage(avatar);

      expect(findUsers).toHaveBeenCalledOnce();
      expect(findOrganizations).toHaveBeenCalledOnce();
      expect(remove).not.toHaveBeenCalled();
      expect(storage.get(avatarKey)).toEqual("committed avatar bytes");
    },
  );

  test("given: other live images, should: reclaim the unreferenced candidate and preserve their bytes", async () => {
    const currentKey = `user-avatars/${ownerId}.jpg`;
    storage.set(currentKey, "current bytes");
    findUsers.mockResolvedValue([
      { imageUrl: publicUrl(currentKey) },
      { imageUrl: "not a URL" },
      {
        imageUrl: publicUrl(avatarKey).replace(
          origin,
          "https://oauth.example.com",
        ),
      },
    ]);
    findOrganizations.mockResolvedValue([{ imageUrl: publicUrl(logoKey) }]);

    await removeImageFromStorage(avatar);

    expect(storage.has(avatarKey)).toEqual(false);
    expect(storage.get(currentKey)).toEqual("current bytes");
    expect(storage.get(logoKey)).toEqual("committed logo bytes");
  });

  test.each(["user", "organization"])(
    "given: too many ambiguous %s references, should: retain the object for later cleanup",
    async (table) => {
      const findReferences = table === "user" ? findUsers : findOrganizations;
      findReferences.mockResolvedValue(
        Array.from({ length: 101 }, () => ({
          imageUrl: "https://external.example.com/encoded%20image.png",
        })),
      );

      await removeImageFromStorage(avatar);

      expect(remove).not.toHaveBeenCalled();
      expect(storage.get(avatarKey)).toEqual("committed avatar bytes");
    },
  );

  test("given: reference lookup fails, should: preserve the object and surface the failure", async () => {
    const error = new Error("database unavailable");
    findOrganizations.mockRejectedValue(error);

    await expect(removeImageFromStorage(avatar)).rejects.toBe(error);

    expect(remove).not.toHaveBeenCalled();
    expect(storage.get(avatarKey)).toEqual("committed avatar bytes");
  });

  test("given: storage returns an error, should: surface the failure", async () => {
    const error = new Error("storage unavailable");
    remove.mockResolvedValue({ error });

    await expect(removeImageFromStorage(avatar)).rejects.toBe(error);

    expect(storage.get(avatarKey)).toEqual("committed avatar bytes");
  });
});

describe("reclaimImageFromStorage()", () => {
  test.each(["storage-result", "storage-rejection", "database"])(
    "given: cleanup fails in %s, should: log the failure without failing publication",
    async (failure) => {
      const error = new Error("cleanup unavailable");
      const log = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      if (failure === "database") {
        findUsers.mockRejectedValue(error);
      } else if (failure === "storage-result") {
        remove.mockResolvedValue({ error });
      } else {
        remove.mockRejectedValue(error);
      }

      await expect(reclaimImageFromStorage(avatar)).resolves.toBeUndefined();

      expect(log).toHaveBeenCalledWith("Failed to reclaim image from storage", {
        error,
        kind: "avatar",
        ownerId,
      });
      expect(storage.get(avatarKey)).toEqual("committed avatar bytes");
    },
  );
});
