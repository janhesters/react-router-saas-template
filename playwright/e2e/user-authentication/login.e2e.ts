import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { deleteOrganizationFromDatabaseById } from '~/features/organizations/organizations-model.server';
import { createPopulatedUserAccount } from '~/features/user-accounts/user-accounts-factories.server';
import {
  deleteUserAccountFromDatabaseById,
  saveUserAccountToDatabase,
} from '~/features/user-accounts/user-accounts-model.server';

import {
  getPath,
  loginByCookie,
  setupOrganizationAndLoginAsMember,
} from '../../utils';

const path = '/login';

test.describe('login page', () => {
  test('given: a logged in user without an account, should: redirect to the login page and log the user out', async ({
    page,
  }) => {
    await loginByCookie({ page });

    await page.goto(path);

    // Verify redirect to login page
    expect(getPath(page)).toEqual('/login');

    // Verify auth cookie is cleared
    const cookies = await page.context().cookies();
    const authCookie = cookies.find(cookie =>
      cookie.name.includes('-auth-token'),
    );
    expect(authCookie).toBeUndefined();
  });

  test("given: a logged in and onboarded user, should: redirect to the organization's page", async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await page.goto(path);

    // Verify redirect to login page
    expect(getPath(page)).toEqual(
      `/organizations/${organization.slug}/dashboard`,
    );

    await deleteUserAccountFromDatabaseById(user.id);
    await deleteOrganizationFromDatabaseById(organization.id);
  });

  test('given: a logged out user, should: have the correct title and show the link to the register page', async ({
    page,
  }) => {
    await page.goto(path);

    // The page title is correct.
    await expect(page).toHaveTitle(/login | react router saas template/i);

    // The register button has the correct link.
    await expect(page.getByRole('link', { name: /sign up/i })).toHaveAttribute(
      'href',
      '/register',
    );
  });

  test.describe('email login', () => {
    test('given: a logged out user entering invalid data, should: show the correct error messages', async ({
      page,
    }) => {
      await page.goto(path);

      // Invalid email.
      await expect(page.getByText(/welcome back/i)).toBeVisible();
      const loginButton = page.getByRole('button', { name: /login/i });
      await expect(loginButton).toBeVisible();
      const emailInput = page.getByLabel(/email/i);
      await expect(emailInput).toBeVisible();
      await emailInput.fill('invalid@email');
      await loginButton.click();
      await expect(
        page.getByText(/a valid email consists of characters, '@' and '.'./i),
      ).toBeVisible();

      // User does not exist.
      await emailInput.fill(createPopulatedUserAccount().email);
      await loginButton.click();
      await expect(
        page.getByText(
          /user with given email doesn't exist. did you mean to create a new account instead?/i,
        ),
      ).toBeVisible();
    });

    test('given: a logged out user with an existing account, should: log the user in', async ({
      page,
    }) => {
      const userAccount = createPopulatedUserAccount();
      await saveUserAccountToDatabase(userAccount);

      await page.goto(path);

      // Fill in the email and click the login button.
      const loginButton = page.getByRole('button', { name: /login/i });
      const emailInput = page.getByLabel(/email/i);
      await emailInput.fill(userAccount.email);
      await loginButton.click();

      // Check that the magic link verification form is shown. The button
      // should be disabled because you can only request a new link every 60
      // seconds.
      await expect(page.getByText(/check your email/i)).toBeVisible();
      await expect(
        page.getByText(
          /if you haven't received the email within 60 seconds, you may request another link./i,
        ),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: /request new login link/i }),
      ).toBeDisabled();

      await deleteUserAccountFromDatabaseById(userAccount.id);
    });
  });

  test.describe('google login', () => {
    test('given: a logged out user, should: redirect to the google login page', async ({
      page,
    }) => {
      await page.goto(path);

      // Click the Google login button.
      const googleLoginButton = page.getByRole('button', {
        name: /google/i,
      });
      await googleLoginButton.click();

      // Check that the user is redirected to the google login page.
      await expect(
        page.getByRole('heading', { name: /sign in/i, level: 1 }),
      ).toBeVisible();
      await expect(page.getByText(/sign in with google/i)).toBeVisible();
    });
  });

  test('given: an anonymous user, should: lack any automatically detectable accessibility issues', async ({
    page,
  }) => {
    await page.goto(path);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules('color-contrast')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
