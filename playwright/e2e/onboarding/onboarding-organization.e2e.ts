import AxeBuilder from "@axe-core/playwright";
import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";
import type { Page, Request, Route } from "@playwright/test";

import { expect, test as base } from "../../fixtures";
import {
  getPath,
  loginAndSaveUserAccountToDatabase,
  setupOrganizationAndLoginAsMember,
} from "../../utils";
import { createPopulatedOrganization } from "~/features/organizations/organizations-factories.server";
import { retrieveOrganizationWithMembershipsFromDatabaseBySlug } from "~/features/organizations/organizations-model.server";
import { createPopulatedUserAccount } from "~/features/user-accounts/user-accounts-factories.server";
import { deleteUserAccountFromDatabaseById } from "~/features/user-accounts/user-accounts-model.server";
import { OrganizationMembershipRole } from "~/generated/client";
import { teardownOrganizationAndMember } from "~/test/test-utils";
import { prisma } from "~/utils/database.server";
import { slugify } from "~/utils/slugify.server";

const path = "/onboarding/organization";

/**
 * React Router posts the hydrated form to this data URL. A click before
 * hydration posts natively to the page path instead.
 */
const creationDataPath = `${path}.data`;

type CreationMode = "fast" | "held";

const createDeferred = () => {
  let resolve = () => {};
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

type CreationGate = {
  /** Resolves once the gate holds the creation POST. */
  reached: Promise<void>;
  /** Lets the held creation POST continue unchanged to the real action. */
  release: () => void;
};

type OrganizationCreation = {
  /** Holds the next creation POST. Install it before clicking Continue. */
  hold: () => Promise<CreationGate>;
  /** Deletes these records after the test, also when it fails. */
  removeAfterTest: (records: { slug: string; userId: string }) => void;
};

const test = base.extend<{ organizationCreation: OrganizationCreation }>({
  organizationCreation: async ({ baseURL, page }, provide, testInfo) => {
    const appOrigin = new URL(baseURL ?? "http://localhost:3000").origin;
    const isCreationRequest = (request: Request) => {
      const url = new URL(request.url());
      return (
        request.method() === "POST" &&
        url.origin === appOrigin &&
        (url.pathname === path || url.pathname === creationDataPath)
      );
    };

    // Waiting for each creation POST to finish before deleting records keeps
    // a late action write from outliving the cleanup.
    const creationRequests: Promise<unknown>[] = [];
    const onRequest = (request: Request) => {
      if (isCreationRequest(request)) {
        creationRequests.push(
          request.response().then((response) => response?.finished()),
        );
      }
    };
    page.on("request", onRequest);

    const records: { slug: string; userId: string }[] = [];
    let gate:
      | {
          handled: Promise<void>[];
          handler: (route: Route) => Promise<void>;
          matcher: (url: URL) => boolean;
          release: () => void;
        }
      | undefined;

    await provide({
      hold: async () => {
        const reached = createDeferred();
        const released = createDeferred();
        const handled: Promise<void>[] = [];
        const matcher = (url: URL) =>
          url.origin === appOrigin && url.pathname === creationDataPath;
        const handler = async (route: Route) => {
          if (route.request().method() !== "POST") {
            await route.fallback();
            return;
          }

          const done = createDeferred();
          handled.push(done.promise);
          try {
            reached.resolve();
            await released.promise;
            // Falls back to the shared image guard, which passes it on.
            await route.fallback();
          } finally {
            done.resolve();
          }
        };
        await page.route(matcher, handler);
        gate = { handled, handler, matcher, release: released.resolve };
        return { reached: reached.promise, release: () => released.resolve() };
      },
      removeAfterTest: (record) => {
        records.push(record);
      },
    });

    const cleanupErrors: unknown[] = [];
    const attempt = async (step: () => Promise<unknown>) => {
      try {
        await step();
      } catch (error) {
        cleanupErrors.push(error);
      }
    };

    const heldGate = gate;
    if (heldGate) {
      heldGate.release();
      await attempt(() => Promise.all(heldGate.handled));
      await attempt(() => page.unroute(heldGate.matcher, heldGate.handler));
    }
    await attempt(() => Promise.allSettled(creationRequests));
    page.off("request", onRequest);

    if (testInfo.status !== testInfo.expectedStatus) {
      await attempt(async () => {
        const organizations = await Promise.all(
          records.map(({ slug }) =>
            retrieveOrganizationWithMembershipsFromDatabaseBySlug(slug),
          ),
        );
        await testInfo.attach("organization-creation-database-state", {
          body: JSON.stringify({ organizations, records }, undefined, 2),
          contentType: "application/json",
        });
      });
    }

    await attempt(() =>
      prisma.$transaction([
        prisma.organization.deleteMany({
          where: { slug: { in: records.map(({ slug }) => slug) } },
        }),
        prisma.userAccount.deleteMany({
          where: { id: { in: records.map(({ userId }) => userId) } },
        }),
      ]),
    );

    if (cleanupErrors.length > 0) {
      throw new AggregateError(
        cleanupErrors,
        "Organization creation cleanup failed.",
      );
    }
  },
});

/**
 * Clicks Continue. A fast submission runs at the app's own speed, so its
 * loading state may end before any assertion can see it. A held submission
 * keeps the real creation POST waiting until the loading state was checked,
 * then lets it reach the real action.
 */
async function submitOrganizationCreation({
  mode,
  organizationCreation,
  page,
  slug,
}: {
  mode: CreationMode;
  organizationCreation: OrganizationCreation;
  page: Page;
  slug: string;
}) {
  const continueButton = page.getByRole("button", { name: /continue/i });

  if (mode === "fast") {
    await continueButton.click();
    return;
  }

  // Only the hydrated form shows a loading state. A click before React
  // Router's scroll restoration effect ran would post natively.
  await page.waitForFunction(
    () => globalThis.history.scrollRestoration === "manual",
  );
  const gate = await organizationCreation.hold();
  await continueButton.click();
  await gate.reached;

  // Verify loading state
  const creatingButton = page.getByRole("button", { name: /creating/i });
  await expect(creatingButton).toBeVisible();
  await expect(creatingButton).toBeDisabled();
  expect(
    await retrieveOrganizationWithMembershipsFromDatabaseBySlug(slug),
  ).toBeNull();

  gate.release();
}

test.describe("onboarding organization page", () => {
  test("given: a logged out user, should: redirect to login page with redirectTo parameter", async ({
    page,
  }) => {
    await page.goto(path);

    const searchParameters = new URLSearchParams();
    searchParameters.append("redirectTo", path);
    expect(getPath(page)).toEqual(`/login?${searchParameters.toString()}`);
  });

  test("given: a logged in and onboarded user, should: redirect to organization page", async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await page.goto(path);

    expect(getPath(page)).toEqual(
      `/organizations/${organization.slug}/dashboard`,
    );

    await teardownOrganizationAndMember({ organization, user });
  });

  test("given: a logged in user without name, should: redirect to user account onboarding", async ({
    page,
  }) => {
    const { id } = await loginAndSaveUserAccountToDatabase({
      page,
      user: createPopulatedUserAccount({ name: "" }),
    });

    await page.goto(path);

    expect(getPath(page)).toEqual("/onboarding/user-account");

    await deleteUserAccountFromDatabaseById(id);
  });

  test.describe("organization creation", () => {
    for (const mode of ["fast", "held"] as const) {
      test.describe(`given: a ${mode} creation request`, () => {
        test("given: a logged in user with name but no organization, should: allow organization creation with name and logo and redirect to organization page", async ({
          organizationCreation,
          page,
        }) => {
          const newName = `${createPopulatedOrganization().name} ${createId()}`;
          const newSlug = slugify(newName);
          const user = await loginAndSaveUserAccountToDatabase({ page });
          organizationCreation.removeAfterTest({
            slug: newSlug,
            userId: user.id,
          });

          await page.goto(path);

          // Verify page content
          await expect(page).toHaveTitle(
            /organization | react router saas template/i,
          );
          await expect(
            page.getByRole("heading", {
              level: 1,
              name: /create your organization/i,
            }),
          ).toBeVisible();
          await expect(
            page.getByText(
              /you can invite other users to join your organization later/i,
            ),
          ).toBeVisible();

          // Enter organization name
          await page
            .getByRole("textbox", { name: /organization name/i })
            .fill(newName);

          // Test image upload
          await page.setInputFiles(
            'input[type="file"]',
            "playwright/fixtures/200x200.jpg",
          );

          // Enter name again. Sometimes with MSW activated on the server,
          // it takes time for the fields to become available, so we do it twice
          // to make sure the test isn't flaky.
          await page
            .getByRole("textbox", { name: /organization name/i })
            .clear();
          await page
            .getByRole("textbox", { name: /organization name/i })
            .fill(newName);

          // Upload the image again for the same reason
          await page.setInputFiles(
            'input[type="file"]',
            "playwright/fixtures/200x200.jpg",
          );

          // Create organization
          await submitOrganizationCreation({
            mode,
            organizationCreation,
            page,
            slug: newSlug,
          });

          // Verify redirect and database update
          await expect(
            page.getByRole("heading", { level: 1, name: /dashboard/i }),
          ).toBeVisible();
          expect(getPath(page)).toEqual(`/organizations/${newSlug}/dashboard`);
          const createdOrganization =
            await retrieveOrganizationWithMembershipsFromDatabaseBySlug(
              newSlug,
            );
          expect(createdOrganization).toMatchObject({
            name: newName,
            slug: newSlug,
          });
          expect(createdOrganization?.memberships[0]?.member.id).toEqual(
            user.id,
          );
          expect(createdOrganization?.memberships[0]?.role).toEqual(
            OrganizationMembershipRole.owner,
          );

          // The upload must use the configured origin and a fresh owner-scoped key.
          const imageUrl = new URL(createdOrganization?.imageUrl ?? "");
          expect(imageUrl.origin).toBe(
            new URL(process.env.VITE_SUPABASE_URL).origin,
          );
          expect(imageUrl.pathname).toMatch(
            new RegExp(
              `^/storage/v1/object/public/app-images/organization-logos/${createdOrganization?.id}/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\\.jpg$`,
            ),
          );
        });

        test("given: a logged in user with name but no organization, should: allow organization creation with only name and redirect to organization page", async ({
          organizationCreation,
          page,
        }) => {
          const newName = `${createPopulatedOrganization().name} ${createId()}`;
          const newSlug = slugify(newName);
          const user = await loginAndSaveUserAccountToDatabase({ page });
          organizationCreation.removeAfterTest({
            slug: newSlug,
            userId: user.id,
          });

          await page.goto(path);

          // Verify page content
          await expect(page).toHaveTitle(
            /organization | react router saas template/i,
          );
          await expect(
            page.getByRole("heading", {
              level: 1,
              name: /create your organization/i,
            }),
          ).toBeVisible();
          await expect(
            page.getByText(
              /you can invite other users to join your organization later/i,
            ),
          ).toBeVisible();

          // Verify page content
          await expect(
            page.getByRole("textbox", { name: /organization name/i }),
          ).toBeVisible();
          await expect(
            page.getByRole("button", { name: /continue/i }),
          ).toBeVisible();

          // Enter organization name
          await page
            .getByRole("textbox", { name: /organization name/i })
            .fill(newName);

          // Create organization
          await submitOrganizationCreation({
            mode,
            organizationCreation,
            page,
            slug: newSlug,
          });

          // Verify redirect and database update
          await expect(
            page.getByRole("heading", { level: 1, name: /dashboard/i }),
          ).toBeVisible();
          expect(getPath(page)).toEqual(`/organizations/${newSlug}/dashboard`);
          const createdOrganization =
            await retrieveOrganizationWithMembershipsFromDatabaseBySlug(
              newSlug,
            );
          expect(createdOrganization).toMatchObject({
            name: newName,
            slug: newSlug,
          });
          expect(createdOrganization?.memberships[0]?.member.id).toEqual(
            user.id,
          );
          expect(createdOrganization?.memberships[0]?.role).toEqual(
            OrganizationMembershipRole.owner,
          );
        });
      });
    }

    test("given: a logged in user with name but no organization, should: show validation errors for invalid input", async ({
      page,
    }) => {
      const { id } = await loginAndSaveUserAccountToDatabase({ page });

      await page.goto(path);

      // Verify page content
      await expect(page).toHaveTitle(
        /organization | react router saas template/i,
      );
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: /create your organization/i,
        }),
      ).toBeVisible();
      await expect(
        page.getByText(
          /you can invite other users to join your organization later/i,
        ),
      ).toBeVisible();

      const nameInput = page.getByRole("textbox", {
        name: /organization name/i,
      });
      const saveButton = page.getByRole("button", { name: /continue/i });

      // Test whitespace name
      await nameInput.fill("   a   ");
      await saveButton.click();
      await expect(
        page.getByText(
          /your organization name must be at least 3 characters long./i,
        ),
      ).toBeVisible();

      // Test too long name
      await nameInput.fill(faker.string.alpha(256));
      await saveButton.click();
      await expect(
        page.getByText(
          /your organization name must be at most 72 characters long./i,
        ),
      ).toBeVisible();

      await deleteUserAccountFromDatabaseById(id);
    });
  });

  test("given: an authenticated user that has not completed onboarding, should: lack any automatically detectable accessibility issues", async ({
    page,
  }) => {
    const { id } = await loginAndSaveUserAccountToDatabase({ page });

    await page.goto(path);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules("color-contrast")
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    await deleteUserAccountFromDatabaseById(id);
  });
});
