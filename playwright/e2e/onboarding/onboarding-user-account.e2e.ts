import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { createPopulatedUserAccount } from '~/features/user-accounts/user-accounts-factories.server';
import {
  deleteUserAccountFromDatabaseById,
  retrieveUserAccountFromDatabaseById,
} from '~/features/user-accounts/user-accounts-model.server';
import { teardownOrganizationAndMember } from '~/test/test-utils';

import {
  getPath,
  loginAndSaveUserAccountToDatabase,
  setupOrganizationAndLoginAsMember,
} from '../../utils';

const path = '/onboarding/user-account';

test.describe('onboarding user account page', () => {
  test('given: a logged out user, should: redirect to login page with redirectTo parameter', async ({
    page,
  }) => {
    await page.goto(path);

    const searchParameters = new URLSearchParams();
    searchParameters.append('redirectTo', path);
    expect(getPath(page)).toEqual(`/login?${searchParameters.toString()}`);
  });

  test('given: a logged in and onboarded user, should: redirect to organization page', async ({
    page,
  }) => {
    const { user, organization } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await page.goto(path);

    expect(getPath(page)).toEqual(`/organizations/${organization.slug}`);

    await teardownOrganizationAndMember({ user, organization });
  });

  test('given: a logged in user with name but no organization, should: redirect to organization onboarding', async ({
    page,
  }) => {
    const { id } = await loginAndSaveUserAccountToDatabase({
      user: createPopulatedUserAccount(),
      page,
    });

    await page.goto(path);

    expect(getPath(page)).toEqual('/onboarding/organization');

    await deleteUserAccountFromDatabaseById(id);
  });

  test.describe('user profile creation', () => {
    test('given: a logged in user without name and no organization, should: allow name creation and redirect to organization onboarding', async ({
      page,
    }) => {
      const { id } = await loginAndSaveUserAccountToDatabase({
        user: createPopulatedUserAccount({ name: '' }),
        page,
      });

      await page.goto(path);

      // Verify page content
      await expect(page).toHaveTitle(
        /user account | react router saas template/i,
      );
      await expect(
        page.getByRole('heading', { name: /onboarding/i, level: 1 }),
      ).toBeVisible();
      await expect(page.getByText(/create your account/i)).toBeVisible();
      await expect(
        page.getByText(
          /welcome to the react router saas template! please create your user account to get started./i,
        ),
      ).toBeVisible();

      // Verify onboarding steps
      await expect(
        page.getByRole('navigation', { name: /onboarding progress/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: /user account/i }),
      ).toHaveAttribute('aria-current', 'step');

      // Create profile
      const newName = createPopulatedUserAccount().name;
      await page.getByRole('textbox', { name: /name/i }).fill(newName);
      await page.getByRole('button', { name: /save/i }).click();

      // Verify loading state
      await expect(page.getByRole('button', { name: /saving/i })).toBeVisible();

      // Verify redirect and database update
      await expect(page.getByText(/create your organization/i)).toBeVisible();
      const updatedUser = await retrieveUserAccountFromDatabaseById(id);
      expect(updatedUser?.name).toEqual(newName);

      await deleteUserAccountFromDatabaseById(id);
    });

    test('given: a logged in user without name but with organization, should: allow name creation and redirect to organization page', async ({
      page,
    }) => {
      const { user, organization } = await setupOrganizationAndLoginAsMember({
        page,
        user: createPopulatedUserAccount({ name: '' }),
      });

      await page.goto(path);

      // Verify page content
      await expect(page).toHaveTitle(
        /user account | react router saas template/i,
      );
      await expect(
        page.getByRole('heading', { name: /onboarding/i, level: 1 }),
      ).toBeVisible();
      await expect(page.getByText(/create your account/i)).toBeVisible();
      await expect(
        page.getByText(
          /welcome to the react router saas template! please create your user account to get started./i,
        ),
      ).toBeVisible();

      // Verify onboarding steps - only user account step should be shown
      await expect(
        page.getByRole('navigation', { name: /onboarding progress/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: /user account/i }),
      ).toHaveAttribute('aria-current', 'step');

      // Create profile
      const newName = createPopulatedUserAccount().name;
      await page.getByRole('textbox', { name: /name/i }).fill(newName);
      await page.getByRole('button', { name: /save/i }).click();

      // Verify loading state
      await expect(page.getByRole('button', { name: /saving/i })).toBeVisible();

      // Verify redirect and database update
      await expect(page.getByText(/organization layout/i)).toBeVisible();
      expect(getPath(page)).toEqual(`/organizations/${organization.slug}`);
      const updatedUser = await retrieveUserAccountFromDatabaseById(user.id);
      expect(updatedUser?.name).toEqual(newName);

      await teardownOrganizationAndMember({ user, organization });
    });

    test('given: a logged in user without name, should: show validation errors for invalid input', async ({
      page,
    }) => {
      const { id } = await loginAndSaveUserAccountToDatabase({
        user: createPopulatedUserAccount({ name: '' }),
        page,
      });

      await page.goto(path);

      // Verify page content
      await expect(page).toHaveTitle(
        /user account | react router saas template/i,
      );
      await expect(
        page.getByRole('heading', { name: /onboarding/i, level: 1 }),
      ).toBeVisible();
      await expect(page.getByText(/create your account/i)).toBeVisible();
      await expect(
        page.getByText(
          /welcome to the react router saas template! please create your user account to get started./i,
        ),
      ).toBeVisible();

      // Verify onboarding steps
      await expect(
        page.getByRole('navigation', { name: /onboarding progress/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: /user account/i }),
      ).toHaveAttribute('aria-current', 'step');

      const nameInput = page.getByRole('textbox', { name: /name/i });
      const saveButton = page.getByRole('button', { name: /save/i });

      // Test whitespace name
      await nameInput.fill('   a   ');
      await saveButton.click();
      await expect(
        page.getByText(/your name must be at least 2 characters long./i),
      ).toBeVisible();

      // Test too long name
      await nameInput.fill('a'.repeat(129));
      await expect(
        page.getByText(/your name must be at most 128 characters long./i),
      ).toBeVisible();
      await saveButton.click();

      await deleteUserAccountFromDatabaseById(id);
    });
  });

  test('given: an authenticated user that has not completed onboarding, should: lack any automatically detectable accessibility issues', async ({
    page,
  }) => {
    const { id } = await loginAndSaveUserAccountToDatabase({
      user: createPopulatedUserAccount({ name: '' }),
      page,
    });

    await page.goto(path);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules('color-contrast')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    await deleteUserAccountFromDatabaseById(id);
  });
});
