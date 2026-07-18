import AxeBuilder from "@axe-core/playwright";
import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

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
import { slugify } from "~/utils/slugify.server";

const path = "/onboarding/organization";

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
    const { user, organization } = await setupOrganizationAndLoginAsMember({
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
    test("given: a logged in user with name but no organization, should: allow organization creation with name and logo and redirect to organization page", async ({
      page,
    }) => {
      const user = await loginAndSaveUserAccountToDatabase({ page });

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
      const { name: newName } = createPopulatedOrganization();
      const newSlug = slugify(newName);
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
      await page.getByRole("textbox", { name: /organization name/i }).clear();
      await page
        .getByRole("textbox", { name: /organization name/i })
        .fill(newName);

      // Upload the image again for the same reason
      await page.setInputFiles(
        'input[type="file"]',
        "playwright/fixtures/200x200.jpg",
      );

      // Create organization
      await page.getByRole("button", { name: /continue/i }).click();

      // Verify loading state
      await expect(
        page.getByRole("button", { name: /creating/i }),
      ).toBeVisible();

      // Verify redirect and database update
      await expect(
        page.getByRole("heading", { level: 1, name: /dashboard/i }),
      ).toBeVisible();
      expect(getPath(page)).toEqual(`/organizations/${newSlug}/dashboard`);
      const createdOrganization =
        await retrieveOrganizationWithMembershipsFromDatabaseBySlug(newSlug);
      expect(createdOrganization).toMatchObject({
        name: newName,
        slug: newSlug,
      });
      expect(createdOrganization?.memberships[0]?.member.id).toEqual(user.id);
      expect(createdOrganization?.memberships[0]?.role).toEqual(
        OrganizationMembershipRole.owner,
      );

      // Verify logo URL is in the correct Supabase storage format
      const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
      expect(createdOrganization?.imageUrl).toMatch(
        new RegExp(
          `${supabaseUrl}/storage/v1/object/public/app-images/organization-logos/${createdOrganization?.id}\\.jpg$`,
        ),
      );

      await deleteUserAccountFromDatabaseById(user.id);
    });

    test("given: a logged in user with name but no organization, should: allow organization creation with only name and redirect to organization page", async ({
      page,
    }) => {
      const user = await loginAndSaveUserAccountToDatabase({ page });

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
      const { name: newName } = createPopulatedOrganization();
      const newSlug = slugify(newName);
      await page
        .getByRole("textbox", { name: /organization name/i })
        .fill(newName);

      // Create organization
      await page.getByRole("button", { name: /continue/i }).click();

      // Verify loading state
      await expect(
        page.getByRole("button", { name: /creating/i }),
      ).toBeVisible();

      // Verify redirect and database update
      await expect(
        page.getByRole("heading", { level: 1, name: /dashboard/i }),
      ).toBeVisible();
      expect(getPath(page)).toEqual(`/organizations/${newSlug}/dashboard`);
      const createdOrganization =
        await retrieveOrganizationWithMembershipsFromDatabaseBySlug(newSlug);
      expect(createdOrganization).toMatchObject({
        name: newName,
        slug: newSlug,
      });
      expect(createdOrganization?.memberships[0]?.member.id).toEqual(user.id);
      expect(createdOrganization?.memberships[0]?.role).toEqual(
        OrganizationMembershipRole.owner,
      );

      await deleteUserAccountFromDatabaseById(user.id);
    });

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
