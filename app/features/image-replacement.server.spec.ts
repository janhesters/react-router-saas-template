import { randomUUID } from "node:crypto";
import { HttpResponse, http } from "msw";
import { describe, expect, onTestFinished, test, vi } from "vitest";

import { createPopulatedOrganization } from "./organizations/organizations-factories.server";
import * as organizationModel from "./organizations/organizations-model.server";
import { UPDATE_ORGANIZATION_INTENT } from "./organizations/settings/general/general-settings-constants";
import { UPDATE_USER_ACCOUNT_INTENT } from "./user-accounts/settings/account/account-settings-constants";
import * as userAccountModel from "./user-accounts/user-accounts-model.server";
import { OrganizationMembershipRole } from "~/generated/client";
import { action as organizationAction } from "~/routes/_authenticated-routes+/organizations_+/$organizationSlug+/settings+/general";
import { action as accountAction } from "~/routes/_authenticated-routes+/settings+/account";
import { supabaseHandlers } from "~/test/mocks/handlers/supabase";
import { setupMockServerLifecycle } from "~/test/msw-test-utils";
import { setupUserWithTrialOrgAndAddAsMember } from "~/test/server-test-utils";
import {
  createAuthenticatedRequest,
  createAuthTestContextProvider,
  createOrganizationMembershipTestContextProvider,
} from "~/test/test-utils";
import { prisma } from "~/utils/database.server";
import type { DataWithResponseInit } from "~/utils/http-responses.server";
import { toFormData } from "~/utils/to-form-data";
import { getToast } from "~/utils/toast.server";

const server = setupMockServerLifecycle(...supabaseHandlers);
const publicPrefix = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/app-images/`;
const s3Prefix = `${process.env.STORAGE_ENDPOINT}/app-images/`;
type ImageKind = "avatar" | "organization-logo";

function createGate() {
  let resolve = () => {};
  const promise = new Promise<void>((fulfill) => {
    resolve = fulfill;
  });
  return { promise, resolve };
}

function createStorage() {
  const storage = {
    beforeDelete: undefined as undefined | (() => Promise<void>),
    beforeUpload: undefined as
      | undefined
      | ((key: string, bytes: string) => Promise<void>),
    deleteFails: false,
    deletions: [] as string[],
    objects: new Map<string, string>(),
    uploadFails: false,
    uploads: [] as string[],
  };

  async function remove(keys: string[]) {
    storage.deletions.push(...keys);
    await storage.beforeDelete?.();
    if (storage.deleteFails) {
      return HttpResponse.json(
        { error: "Storage unavailable", message: "Storage unavailable" },
        { status: 503 },
      );
    }
    for (const key of keys) {
      storage.objects.delete(key);
    }
    return HttpResponse.json(keys.map((name) => ({ name })));
  }

  server.use(
    http.put(`${s3Prefix}*`, async ({ request }) => {
      const key = new URL(request.url).pathname.slice(
        new URL(s3Prefix).pathname.length,
      );
      const bytes = await request.text();
      storage.uploads.push(key);
      await storage.beforeUpload?.(key, bytes);
      if (storage.uploadFails) {
        return new HttpResponse(
          "<Error><Code>InvalidRequest</Code><Message>Upload rejected</Message></Error>",
          { headers: { "Content-Type": "application/xml" }, status: 400 },
        );
      }
      storage.objects.set(key, bytes);
      return new HttpResponse(null, {
        headers: { ETag: '"image-etag"' },
        status: 200,
      });
    }),
    http.delete(`${s3Prefix}*`, async ({ request }) =>
      remove([
        new URL(request.url).pathname.slice(new URL(s3Prefix).pathname.length),
      ]),
    ),
    http.delete(
      `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/app-images`,
      async ({ request }) => {
        const { prefixes } = (await request.json()) as { prefixes: string[] };
        return remove(prefixes);
      },
    ),
    http.get(`${publicPrefix}*`, ({ request }) => {
      const key = new URL(request.url).pathname.slice(
        new URL(publicPrefix).pathname.length,
      );
      const bytes = storage.objects.get(key);
      return new HttpResponse(bytes ?? "Missing object", {
        status: bytes === undefined ? 404 : 200,
      });
    }),
  );

  return storage;
}

async function setupImage(
  kind: ImageKind,
  role: OrganizationMembershipRole = OrganizationMembershipRole.owner,
) {
  const { organization, user } = await setupUserWithTrialOrgAndAddAsMember({
    organization: createPopulatedOrganization({
      stripeCustomerId: null,
      trialEnd: new Date(Date.now() + 86_400_000),
    }),
    role,
  });
  const ownerId = kind === "avatar" ? user.id : organization.id;
  const keyPrefix = kind === "avatar" ? "user-avatars" : "organization-logos";
  const oldKey = `${keyPrefix}/${ownerId}.png`;
  const oldUrl = `${publicPrefix}${oldKey}`;
  const storage = createStorage();
  storage.objects.set(oldKey, "old image bytes");

  async function setImageUrl(imageUrl: string) {
    if (kind === "avatar") {
      await prisma.userAccount.update({
        data: { imageUrl },
        where: { id: user.id },
      });
    } else {
      await prisma.organization.update({
        data: { imageUrl },
        where: { id: organization.id },
      });
    }
  }
  await setImageUrl(oldUrl);

  async function readRecord() {
    return kind === "avatar"
      ? prisma.userAccount.findUniqueOrThrow({ where: { id: user.id } })
      : prisma.organization.findUniqueOrThrow({
          where: { id: organization.id },
        });
  }

  async function readPublished() {
    const { imageUrl } = await readRecord();
    const response = await fetch(imageUrl);
    return { bytes: await response.text(), imageUrl, status: response.status };
  }

  const initialName = kind === "avatar" ? user.name : organization.name;
  async function send({
    bytes = "new image bytes",
    extraFields = {} as Record<string, string>,
    filename = "image.png",
    name = initialName,
    type = "image/png",
  } = {}) {
    const formData = toFormData({
      intent:
        kind === "avatar"
          ? UPDATE_USER_ACCOUNT_INTENT
          : UPDATE_ORGANIZATION_INTENT,
      [kind === "avatar" ? "avatar" : "logo"]: new File([bytes], filename, {
        type,
      }),
      name,
      ...extraFields,
    });
    if (kind === "avatar") {
      const pattern = "/settings/account";
      const request = await createAuthenticatedRequest({
        formData,
        method: "POST",
        url: `http://localhost:3000${pattern}`,
        user,
      });
      const params = {};
      return accountAction({
        context: await createAuthTestContextProvider({
          params,
          pattern,
          request,
        }),
        params,
        pattern,
        request,
        url: new URL(request.url),
      });
    }
    const pattern = "/organizations/:organizationSlug/settings/general";
    const params = { organizationSlug: organization.slug };
    const request = await createAuthenticatedRequest({
      formData,
      method: "POST",
      url: `http://localhost:3000/organizations/${organization.slug}/settings/general`,
      user,
    });
    return organizationAction({
      context: await createOrganizationMembershipTestContextProvider({
        params,
        pattern,
        request,
      }),
      params,
      pattern,
      request,
      url: new URL(request.url),
    });
  }

  function failPublication({ afterCommit = false } = {}) {
    if (kind === "avatar") {
      const original = userAccountModel.updateUserAccountInDatabaseById;
      const spy = vi
        .spyOn(userAccountModel, "updateUserAccountInDatabaseById")
        .mockImplementation(async (args) => {
          if (afterCommit) await original(args);
          throw new Error("Database connection interrupted");
        });
      onTestFinished(() => spy.mockRestore());
    } else {
      const original = organizationModel.updateOrganizationInDatabaseById;
      const spy = vi
        .spyOn(organizationModel, "updateOrganizationInDatabaseById")
        .mockImplementation(async (args) => {
          if (afterCommit) await original(args);
          throw new Error("Database connection interrupted");
        });
      onTestFinished(() => spy.mockRestore());
    }
  }

  return {
    failPublication,
    initialName,
    keyPrefix,
    oldKey,
    oldUrl,
    organization,
    ownerId,
    readPublished,
    readRecord,
    send,
    setImageUrl,
    storage,
    user,
  };
}

function statusOf(response: unknown) {
  return response instanceof Response
    ? response.status
    : ((response as DataWithResponseInit<unknown>).init?.status ?? 200);
}

describe.each(["avatar", "organization-logo"] as const)(
  "%s replacement",
  (kind) => {
    test.each([
      { extension: "png", filename: "image.png", type: "image/png" },
      { extension: "jpg", filename: "image.jpeg", type: "image/jpeg" },
    ])(
      "publishes readable $extension bytes before retiring the old image",
      async ({ extension, filename, type }) => {
        const fixture = await setupImage(kind);
        let imageAtCleanup:
          | Awaited<ReturnType<typeof fixture.readPublished>>
          | undefined;
        fixture.storage.beforeDelete = async () => {
          imageAtCleanup = await fixture.readPublished();
        };

        const response = await fixture.send({ filename, type });
        const published = await fixture.readPublished();

        expect(statusOf(response)).toBe(200);
        expect(published).toMatchObject({
          bytes: "new image bytes",
          status: 200,
        });
        expect(published.imageUrl).toMatch(
          new RegExp(
            `/${fixture.keyPrefix}/${fixture.ownerId}/[0-9a-f-]+\\.${extension}$`,
          ),
        );
        expect(imageAtCleanup).toEqual(published);
        expect(fixture.storage.deletions).toEqual([fixture.oldKey]);
        expect(fixture.storage.objects.has(fixture.oldKey)).toBe(false);
      },
    );

    test("repeated uploads with the same filename get different immutable URLs", async () => {
      const fixture = await setupImage(kind);
      await fixture.send({ bytes: "first image bytes" });
      const first = await fixture.readPublished();
      const response = await fixture.send({ bytes: "second image bytes" });
      const second = await fixture.readPublished();

      expect(statusOf(response)).toBe(200);
      expect(first).toMatchObject({ bytes: "first image bytes", status: 200 });
      expect(second).toMatchObject({
        bytes: "second image bytes",
        status: 200,
      });
      expect(second.imageUrl).not.toBe(first.imageUrl);
      expect(fixture.storage.objects.size).toBe(1);
    });

    test.each([false, true])(
      "an upload failure preserves the old image and original name (bytes stored: %s)",
      async (bytesStored) => {
        const fixture = await setupImage(kind);
        fixture.storage.uploadFails = true;
        if (bytesStored) {
          fixture.storage.beforeUpload = async (key, bytes) => {
            fixture.storage.objects.set(key, bytes);
          };
        }

        const response = await fixture.send({ name: "Changed display name" });

        expect(statusOf(response)).toBe(502);
        expect(await fixture.readPublished()).toEqual({
          bytes: "old image bytes",
          imageUrl: fixture.oldUrl,
          status: 200,
        });
        expect((await fixture.readRecord()).name).toBe(fixture.initialName);
        expect(fixture.storage.deletions).toEqual(fixture.storage.uploads);
        expect([...fixture.storage.objects.keys()]).toEqual([fixture.oldKey]);
      },
    );

    test.each([
      { extension: "png", filename: "image.png", type: "image/png" },
      { extension: "jpg", filename: "image.jpeg", type: "image/jpeg" },
    ])(
      "a publication failure for $extension keeps the old image readable and retains bytes for an uncertain commit",
      async ({ extension, filename, type }) => {
        const fixture = await setupImage(kind);
        fixture.failPublication();

        const response = await fixture.send({
          filename,
          name: "Changed display name",
          type,
        });

        expect(statusOf(response)).toBe(500);
        expect(await fixture.readPublished()).toEqual({
          bytes: "old image bytes",
          imageUrl: fixture.oldUrl,
          status: 200,
        });
        expect((await fixture.readRecord()).name).toBe(fixture.initialName);
        expect(fixture.storage.deletions).toEqual([]);
        expect([...fixture.storage.objects.keys()]).toEqual([
          fixture.oldKey,
          ...fixture.storage.uploads,
        ]);
        expect(fixture.storage.uploads).toHaveLength(1);
        expect(fixture.storage.uploads[0]).toMatch(
          new RegExp(`\\.${extension}$`),
        );
      },
    );

    test("submitted owner IDs cannot replace another user's or organization's image", async () => {
      const fixture = await setupImage(kind);
      const victim = await setupUserWithTrialOrgAndAddAsMember();
      const victimId =
        kind === "avatar" ? victim.user.id : victim.organization.id;
      const victimKey = `${fixture.keyPrefix}/${victimId}.png`;
      const victimUrl = `${publicPrefix}${victimKey}`;
      fixture.storage.objects.set(victimKey, "victim image bytes");
      if (kind === "avatar") {
        await prisma.userAccount.update({
          data: { imageUrl: victimUrl },
          where: { id: victimId },
        });
      } else {
        await prisma.organization.update({
          data: { imageUrl: victimUrl },
          where: { id: victimId },
        });
      }

      const response = await fixture.send({
        extraFields: {
          organizationId: victim.organization.id,
          userId: victim.user.id,
        },
      });
      const victimRecord =
        kind === "avatar"
          ? await prisma.userAccount.findUniqueOrThrow({
              where: { id: victimId },
            })
          : await prisma.organization.findUniqueOrThrow({
              where: { id: victimId },
            });

      expect(statusOf(response)).toBe(200);
      expect(await fixture.readPublished()).toMatchObject({
        bytes: "new image bytes",
        status: 200,
      });
      expect(fixture.storage.uploads).toHaveLength(1);
      expect(
        fixture.storage.uploads[0]?.startsWith(
          `${fixture.keyPrefix}/${fixture.ownerId}/`,
        ),
      ).toBe(true);
      expect(victimRecord.imageUrl).toBe(victimUrl);
      expect(await (await fetch(victimUrl)).text()).toBe("victim image bytes");
      expect(fixture.storage.deletions).toEqual([fixture.oldKey]);
    });

    test("a committed update followed by an error never compensates the selected image", async () => {
      const fixture = await setupImage(kind);
      fixture.failPublication({ afterCommit: true });

      const response = await fixture.send();
      const published = await fixture.readPublished();

      expect(statusOf(response)).toBe(500);
      expect(published).toMatchObject({
        bytes: "new image bytes",
        status: 200,
      });
      expect(published.imageUrl).not.toBe(fixture.oldUrl);
      expect(fixture.storage.deletions).not.toContain(
        published.imageUrl.slice(publicPrefix.length),
      );
    });

    test.each(["first", "second"] as const)(
      "the %s request wins when its publication completes first",
      async (winner) => {
        const fixture = await setupImage(kind);
        const started = {
          first: createGate(),
          second: createGate(),
        };
        const release = {
          first: createGate(),
          second: createGate(),
        };
        const keys = new Map<string, string>();
        fixture.storage.beforeUpload = async (key, bytes) => {
          const request = bytes === "first" ? "first" : "second";
          keys.set(request, key);
          started[request].resolve();
          await release[request].promise;
        };
        onTestFinished(() => {
          release.first.resolve();
          release.second.resolve();
        });
        const firstResponse = fixture.send({ bytes: "first" });
        await started.first.promise;
        const secondResponse = fixture.send({ bytes: "second" });
        await started.second.promise;
        const loser = winner === "first" ? "second" : "first";
        const responses = { first: firstResponse, second: secondResponse };
        release[winner].resolve();
        const winningResponse = await responses[winner];
        release[loser].resolve();
        const losingResponse = await responses[loser];

        expect(statusOf(winningResponse)).toBe(200);
        expect(statusOf(losingResponse)).toBe(409);
        expect(await fixture.readPublished()).toEqual({
          bytes: winner,
          imageUrl: `${publicPrefix}${keys.get(winner)}`,
          status: 200,
        });
        expect(keys.get("first")).not.toBe(keys.get("second"));
        expect(fixture.storage.deletions).toEqual([
          fixture.oldKey,
          keys.get(loser),
        ]);
        expect([...fixture.storage.objects.keys()]).toEqual([keys.get(winner)]);
      },
    );

    test("cleanup errors preserve the successful response and readable new image", async () => {
      const fixture = await setupImage(kind);
      fixture.storage.deleteFails = true;

      const response = await fixture.send();
      const published = await fixture.readPublished();
      const { toast } = await getToast(
        new Request("http://localhost:3000", {
          headers: {
            cookie:
              new Headers(
                (response as DataWithResponseInit<unknown>).init?.headers,
              ).get("Set-Cookie") ?? "",
          },
        }),
      );

      expect(statusOf(response)).toBe(200);
      expect(toast?.type).toBe("success");
      expect(published).toMatchObject({
        bytes: "new image bytes",
        status: 200,
      });
      expect(published.imageUrl).not.toBe(fixture.oldUrl);
      expect(fixture.storage.objects.get(fixture.oldKey)).toBe(
        "old image bytes",
      );
    });

    test.each(["malformed", "external", "other-owner"])(
      "does not remove the prior %s reference",
      async (reference) => {
        const fixture = await setupImage(kind);
        const legacyKey =
          reference === "other-owner"
            ? `${fixture.keyPrefix}/${randomUUID()}.png`
            : fixture.oldKey;
        const legacyUrl =
          reference === "malformed"
            ? "not a valid URL"
            : reference === "external"
              ? `https://images.example.com/storage/v1/object/public/app-images/${legacyKey}`
              : `${publicPrefix}${legacyKey}`;
        fixture.storage.objects.set(legacyKey, "unrelated image bytes");
        await fixture.setImageUrl(legacyUrl);

        const response = await fixture.send();

        expect(statusOf(response)).toBe(200);
        expect(await fixture.readPublished()).toMatchObject({
          bytes: "new image bytes",
          status: 200,
        });
        expect(fixture.storage.deletions).toEqual([]);
        expect(fixture.storage.objects.get(legacyKey)).toBe(
          "unrelated image bytes",
        );
      },
    );

    test("a validation error leaves storage and the selected image untouched", async () => {
      const fixture = await setupImage(kind);

      const response = await fixture.send({ name: "x" });

      expect(statusOf(response)).toBe(400);
      expect(fixture.storage.uploads).toEqual([]);
      expect(fixture.storage.deletions).toEqual([]);
      expect(await fixture.readPublished()).toEqual({
        bytes: "old image bytes",
        imageUrl: fixture.oldUrl,
        status: 200,
      });
    });
  },
);

test("an organization rename during upload does not prevent publication by stable organization ID", async () => {
  const fixture = await setupImage("organization-logo");
  const started = createGate();
  const release = createGate();
  fixture.storage.beforeUpload = async () => {
    started.resolve();
    await release.promise;
  };
  onTestFinished(() => release.resolve());
  const responsePromise = fixture.send();
  await started.promise;
  const renamedSlug = `renamed-${fixture.organization.id}`;
  await prisma.organization.update({
    data: { name: "Renamed organization", slug: renamedSlug },
    where: { id: fixture.organization.id },
  });
  release.resolve();

  const response = await responsePromise;
  expect(statusOf(response)).toBe(302);
  expect((response as Response).headers.get("Location")).toBe(
    `/organizations/${renamedSlug}/settings/general`,
  );
  expect(await fixture.readPublished()).toMatchObject({
    bytes: "new image bytes",
    status: 200,
  });
  expect(
    await prisma.organization.findUniqueOrThrow({
      where: { id: fixture.organization.id },
    }),
  ).toMatchObject({ name: "Renamed organization", slug: renamedSlug });
});

test.each([
  OrganizationMembershipRole.member,
  OrganizationMembershipRole.admin,
])("a %s cannot upload or delete an organization logo", async (role) => {
  const fixture = await setupImage("organization-logo", role);

  const response = await fixture.send();

  expect(statusOf(response)).toBe(403);
  expect(fixture.storage.uploads).toEqual([]);
  expect(fixture.storage.deletions).toEqual([]);
  expect(await fixture.readPublished()).toEqual({
    bytes: "old image bytes",
    imageUrl: fixture.oldUrl,
    status: 200,
  });
});
