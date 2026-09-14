import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { faker } from "@faker-js/faker";

import { expect, test } from "../../fixtures";
import {
  expectImageToBeRendered,
  getPath,
  loginAndSaveUserAccountToDatabase,
  setupOrganizationAndLoginAsMember,
} from "../../utils";
import { createPopulatedOrganization } from "~/features/organizations/organizations-factories.server";
import { retrieveOrganizationFromDatabaseById } from "~/features/organizations/organizations-model.server";
import { createPopulatedUserAccount } from "~/features/user-accounts/user-accounts-factories.server";
import { deleteUserAccountFromDatabaseById } from "~/features/user-accounts/user-accounts-model.server";
import { OrganizationMembershipRole } from "~/generated/client";
import { TEST_IMAGE_DATA_URL } from "~/test/test-image";
import {
  createUserWithOrgAndAddAsMember,
  teardownOrganizationAndMember,
} from "~/test/test-utils";
import { prisma } from "~/utils/database.server";

test.describe("general organization settings", () => {
  test("given: a logged out user, should: redirect to login page with redirectTo parameter", async ({
    page,
  }) => {
    const { slug } = createPopulatedOrganization();
    await page.goto(`/organizations/${slug}/settings/general`);

    const searchParameters = new URLSearchParams();
    searchParameters.append(
      "redirectTo",
      `/organizations/${slug}/settings/general`,
    );
    expect(getPath(page)).toEqual(`/login?${searchParameters.toString()}`);
  });

  test("given: a logged in user who is NOT onboarded, should: redirect to the onboarding page", async ({
    page,
  }) => {
    const { slug } = createPopulatedOrganization();
    const { id } = await loginAndSaveUserAccountToDatabase({
      page,
      user: createPopulatedUserAccount({ name: "" }),
    });

    await page.goto(`/organizations/${slug}/settings/general`);

    expect(getPath(page)).toEqual("/onboarding/user-account");

    await deleteUserAccountFromDatabaseById(id);
  });

  test("given: a logged in user who is NOT a member of the organization, should: show a 404 not found page", async ({
    page,
  }) => {
    const { organization, user: otherUser } =
      await createUserWithOrgAndAddAsMember();
    const { organization: otherOrganization, user } =
      await setupOrganizationAndLoginAsMember({ page });

    await page.goto(`/organizations/${organization.slug}/settings/general`);

    await expect(
      page.getByRole("heading", { level: 1, name: /page not found/i }),
    ).toBeVisible();
    await expect(page.getByText(/404/i)).toBeVisible();
    await expect(
      page.getByText(/sorry, we couldn't find the page you're looking for/i),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /return home/i }),
    ).toHaveAttribute("href", "/");
    await expect(page).toHaveTitle(/404|react router saas template/i);

    await teardownOrganizationAndMember({
      organization: otherOrganization,
      user,
    });
    await teardownOrganizationAndMember({ organization, user: otherUser });
  });

  test("given: a logged in user who is onboarded and a member, should: show read-only organization info", async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
      role: OrganizationMembershipRole.member,
    });

    await page.goto(`/organizations/${organization.slug}/settings/general`);

    // Verify page content
    await expect(page).toHaveTitle(/general | react router saas template/i);
    await expect(
      page.getByText(/general settings for this organization/i),
    ).toBeVisible();

    // Verify read-only organization info
    await expect(page.getByText(/organization name/i)).toBeVisible();
    await expect(page.getByText(organization.name).nth(1)).toBeVisible();
    await expect(page.getByText(/organization logo/i)).toBeVisible();
    await expectImageToBeRendered(
      page.getByRole("img", { name: /organization logo/i }),
      TEST_IMAGE_DATA_URL,
    );

    // Verify no edit controls are visible
    await expect(
      page.getByRole("button", { name: /save changes/i }),
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: /delete organization/i }),
    ).not.toBeVisible();

    await teardownOrganizationAndMember({ organization, user });
  });

  test("given: a logged in user who is onboarded and an admin, should: show read-only organization info", async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
      role: OrganizationMembershipRole.admin,
    });

    await page.goto(`/organizations/${organization.slug}/settings/general`);

    // Verify page content
    await expect(page).toHaveTitle(/general | react router saas template/i);
    await expect(
      page.getByText(/general settings for this organization/i),
    ).toBeVisible();

    // Verify read-only organization info
    await expect(page.getByText(/organization name/i)).toBeVisible();
    await expect(page.getByText(organization.name).nth(1)).toBeVisible();
    await expect(page.getByText(/organization logo/i)).toBeVisible();
    await expectImageToBeRendered(
      page.getByRole("img", { name: /organization logo/i }),
      TEST_IMAGE_DATA_URL,
    );

    // Verify no edit controls are visible
    await expect(
      page.getByRole("button", { name: /save changes/i }),
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: /delete organization/i }),
    ).not.toBeVisible();

    await teardownOrganizationAndMember({ organization, user });
  });

  test.describe("given: a logged in user who is onboarded and an owner", () => {
    test("given: valid organization name and logo, should: update organization name and logo", async ({
      page,
    }) => {
      const { organization, user } = await setupOrganizationAndLoginAsMember({
        page,
        role: OrganizationMembershipRole.owner,
      });

      await page.goto(`/organizations/${organization.slug}/settings/general`);

      // Verify page content
      await expect(page).toHaveTitle(/general | react router saas template/i);
      await expect(
        page.getByText(/general settings for this organization/i),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: /team members/i }),
      ).toHaveAttribute(
        "href",
        `/organizations/${organization.slug}/settings/members`,
      );
      await expect(
        page.getByRole("textbox", { name: /organization name/i }),
      ).toBeVisible();
      const logo = page.getByRole("img", { name: /logo preview/i });
      await expectImageToBeRendered(logo, TEST_IMAGE_DATA_URL);

      // Enter organization name first time
      const newName = createPopulatedOrganization().name;
      await page
        .getByRole("textbox", { name: /organization name/i })
        .fill(newName);

      // Test image upload
      await page.setInputFiles(
        'input[type="file"]',
        "playwright/fixtures/200x200.jpg",
      );
      await expect(logo).toHaveAttribute("src", /^blob:/);
      await expectImageToBeRendered(logo);

      // Enter name again to ensure form is ready (sometimes with MSW activated
      // on the server, it takes time for the fields to become available)
      await page.getByRole("textbox", { name: /organization name/i }).clear();
      await page
        .getByRole("textbox", { name: /organization name/i })
        .fill(newName);

      // Upload the image again for the same reason
      await page.setInputFiles(
        'input[type="file"]',
        "playwright/fixtures/200x200.jpg",
      );

      // Save changes
      await page.getByRole("button", { name: /save changes/i }).click();

      // Verify loading state
      await expect(
        page.getByRole("button", { name: /saving changes/i }),
      ).toBeVisible();

      // Verify success toast
      await expect(
        page
          .getByRole("region", { name: /notifications/i })
          .getByText(/organization has been updated/i),
      ).toBeVisible();

      // Verify database update
      const updatedOrganization = await retrieveOrganizationFromDatabaseById(
        organization.id,
      );
      expect(updatedOrganization?.name).toEqual(newName);
      const storedLogoUrl = updatedOrganization?.imageUrl ?? "";
      const logoUrl = new URL(storedLogoUrl);
      expect(logoUrl.origin).toBe(
        new URL(process.env.VITE_SUPABASE_URL).origin,
      );
      expect(logoUrl.pathname).toMatch(
        new RegExp(
          `^/storage/v1/object/public/app-images/organization-logos/${organization.id}/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\\.jpg$`,
        ),
      );

      // Reload to verify persisted Storage bytes, rather than the blob preview.
      const download = page.waitForResponse(storedLogoUrl);
      await page.reload();
      const response = await download;
      expect(response.ok()).toBe(true);
      expect(await response.body()).toEqual(
        await readFile("playwright/fixtures/200x200.jpg"),
      );
      await expectImageToBeRendered(logo, storedLogoUrl);
      await expectImageToBeRendered(
        page.getByRole("img", { exact: true, name: newName }),
        storedLogoUrl,
      );

      await teardownOrganizationAndMember({ organization, user });
    });

    test("given: invalid inputs, should: show validation errors", async ({
      page,
    }) => {
      const { organization, user } = await setupOrganizationAndLoginAsMember({
        page,
        role: OrganizationMembershipRole.owner,
      });

      await page.goto(`/organizations/${organization.slug}/settings/general`);

      // Verify page content
      await expect(page).toHaveTitle(/general | react router saas template/i);
      await expect(
        page.getByText(/general settings for this organization/i),
      ).toBeVisible();
      await expect(
        page.getByText(/your organization's public display name/i),
      ).toBeVisible();

      // Verify form elements
      await expect(
        page.getByRole("textbox", { name: /organization name/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /save changes/i }),
      ).toBeVisible();

      // Test whitespace name
      await page.getByRole("textbox", { name: /organization name/i }).clear();
      await page
        .getByRole("textbox", { name: /organization name/i })
        .fill("   a   ");
      await page.getByRole("button", { name: /save changes/i }).click();
      await expect(
        page.getByText(/organization name must be at least 3 characters long/i),
      ).toBeVisible();

      // Test too long name
      await page
        .getByRole("textbox", { name: /organization name/i })
        .fill(faker.string.alpha(256));
      await page.getByRole("button", { name: /save changes/i }).click();
      await expect(
        page.getByText(
          /organization name must be at most 255 characters long/i,
        ),
      ).toBeVisible();

      await teardownOrganizationAndMember({ organization, user });
    });

    test("given: a confirmed owner, should: delete the organization, show completed cleanup, and preserve the user account", async ({
      page,
    }) => {
      test.setTimeout(40_000);
      const { organization, user } = await setupOrganizationAndLoginAsMember({
        page,
        role: OrganizationMembershipRole.owner,
      });
      try {
        await page.goto(`/organizations/${organization.slug}/settings/general`);
        await page
          .getByRole("button", { name: /^delete organization$/i })
          .click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        await dialog
          .getByRole("textbox", { name: /to confirm, type/i })
          .fill(organization.name);
        await dialog
          .getByRole("button", { name: /delete this organization/i })
          .click();
        await expect(page).toHaveURL(
          `/organization-deletions/${organization.id}`,
        );
        await expect(
          page.getByRole("heading", { name: /^organization deleted$/i }),
        ).toBeVisible({ timeout: 25_000 });
        await expect(page.getByRole("status")).toContainText(
          "Billing and file cleanup are complete.",
        );
        expect(
          await retrieveOrganizationFromDatabaseById(organization.id),
        ).toBeNull();
        expect(
          await prisma.userAccount.findUnique({ where: { id: user.id } }),
        ).not.toBeNull();
        await page.goto("/settings/account");
        await page
          .getByRole("link", { exact: true, name: organization.name })
          .click();
        await expect(page).toHaveURL(
          `/organization-deletions/${organization.id}`,
        );
        await page.reload();
        await expect(
          page.getByRole("heading", { name: /^organization deleted$/i }),
        ).toBeVisible();
        await page
          .getByRole("link", { name: /continue to your organizations/i })
          .click();
        await expect(page).toHaveURL("/onboarding/organization");
      } finally {
        await prisma.organizationDeletion.deleteMany({
          where: { id: organization.id },
        });
        await teardownOrganizationAndMember({ organization, user });
      }
    });

    test("given: an owner bypasses confirmation, should: reject deletion and preserve the organization", async ({
      page,
    }) => {
      const { organization, user } = await setupOrganizationAndLoginAsMember({
        page,
        role: OrganizationMembershipRole.owner,
      });
      const path = `/organizations/${organization.slug}/settings/general`;
      try {
        await page.goto(path);
        for (const confirmation of [undefined, "wrong organization"]) {
          const multipart: Record<string, string> = {
            intent: "delete-organization",
          };
          if (confirmation !== undefined) multipart.confirmation = confirmation;
          const response = await page.request.post(path, {
            maxRedirects: 0,
            multipart,
          });
          expect(response.status()).toBe(400);
          expect(response.headers().location).toBeUndefined();
          expect(response.headers()["set-cookie"] ?? "").not.toContain(
            "__toast=",
          );
        }
        expect(
          await retrieveOrganizationFromDatabaseById(organization.id),
        ).not.toBeNull();
        expect(
          await prisma.organizationDeletion.findUnique({
            where: { id: organization.id },
          }),
        ).toBeNull();
      } finally {
        await teardownOrganizationAndMember({ organization, user });
      }
    });

    test("given: billing cleanup is pending, should: explain the delay without claiming completion", async ({
      page,
    }) => {
      const { organization, user } = await setupOrganizationAndLoginAsMember({
        page,
        role: OrganizationMembershipRole.owner,
      });
      // Simulate a persisted failed provider call; the future retry time keeps
      // the background worker from processing this fixture during assertions.
      await prisma.organizationDeletion.create({
        data: {
          attempts: 1,
          id: organization.id,
          lastError: "Private provider diagnostic",
          nextAttemptAt: new Date(Date.now() + 60 * 60_000),
          organizationName: organization.name,
          organizationSlug: organization.slug,
          requestedById: user.id,
        },
      });
      await prisma.organization.delete({ where: { id: organization.id } });
      try {
        await page.goto(`/organization-deletions/${organization.id}`);
        await expect(
          page.getByRole("heading", { name: /cleanup still in progress/i }),
        ).toBeVisible();
        await expect(page.getByRole("status")).toContainText(
          "We will retry automatically",
        );
        await expect(
          page.getByText("Private provider diagnostic"),
        ).not.toBeVisible();
        await expect(
          page.getByText("Billing and file cleanup are complete.", {
            exact: false,
          }),
        ).not.toBeVisible();
        await page.getByRole("button", { name: /retry cleanup/i }).click();
        await expect(
          page.getByRole("heading", { name: /^organization deleted$/i }),
        ).toBeVisible();
      } finally {
        await prisma.organizationDeletion.deleteMany({
          where: { id: organization.id },
        });
        await teardownOrganizationAndMember({ organization, user });
      }
    });
  });

  test("given: a logged in user who is onboarded and a member of the organization, should: lack any automatically detectable accessibility issues", async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await page.goto(`/organizations/${organization.slug}/settings/general`);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules("color-contrast")
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    await teardownOrganizationAndMember({ organization, user });
  });
});

// TODO: fix bug where when a user corrects spelling (e.g. Strong OFfice => Strong Office) that it still redirects to the right URL.
