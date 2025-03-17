import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { createPopulatedUserAccount } from '~/features/user-accounts/user-accounts-factories.server';
import {
  deleteUserAccountFromDatabaseById,
  saveUserAccountToDatabase,
} from '~/features/user-accounts/user-accounts-model.server';
import { teardownOrganizationAndMember } from '~/test/test-utils';

import { getPath, setupOrganizationAndLoginAsMember } from '../../utils';

const path = '/register';

test.describe('register page', () => {
  test('given: a logged in user, should: redirect to the organizations page', async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await page.goto(path);

    expect(getPath(page)).toEqual(`/organizations/${organization.slug}`);

    await teardownOrganizationAndMember({ user, organization });
  });

  test('given: a logged out user, should: have the correct title, and show the link to the login page & the terms and privacy policy links', async ({
    page,
  }) => {
    await page.goto(path);

    // The page title is correct.
    await expect(page).toHaveTitle(/register | react router saas template/i);

    // The login button has the correct link.
    await expect(page.getByRole('link', { name: /log in/i })).toHaveAttribute(
      'href',
      '/login',
    );

    // Check that the terms and privacy policy links are visible and have the
    // correct attributes.
    const termsLink = page.getByRole('link', { name: /terms of service/i });
    const privacyLink = page.getByRole('link', { name: /privacy policy/i });
    await expect(termsLink).toHaveAttribute('href', '/terms-of-service');
    await expect(privacyLink).toHaveAttribute('href', '/privacy-policy');
  });

  test.describe('email registration', () => {
    test('given: a logged out user entering invalid data, should: show the correct error messages', async ({
      page,
    }) => {
      await page.goto(path);

      // Invalid email.
      const registerButton = page.getByRole('button', { name: /register/i });
      const emailInput = page.getByLabel(/email/i);
      await emailInput.fill('invalid@email');
      await registerButton.click();
      await expect(
        page.getByText(/a valid email consists of characters, '@' and '.'./i),
      ).toBeVisible();
    });

    test('given: a logged out user with an existing account, should: show the correct error message', async ({
      page,
    }) => {
      const userAccount = createPopulatedUserAccount();
      await saveUserAccountToDatabase(userAccount);

      await page.goto(path);

      // Fill in the email and click the register button.
      const registerButton = page.getByRole('button', { name: /register/i });
      const emailInput = page.getByLabel(/email/i);
      await emailInput.fill(userAccount.email);
      await registerButton.click();

      // Check that the user already exists error is shown.
      await expect(
        page.getByText(
          /user with given email already exists. did you mean to log in instead?/i,
        ),
      ).toBeVisible();

      await deleteUserAccountFromDatabaseById(userAccount.id);
    });

    test('given: a logged out user with a new email, should: show the verification form', async ({
      page,
    }) => {
      const userAccount = createPopulatedUserAccount();

      await page.goto(path);

      // Fill in the email and click the register button.
      const registerButton = page.getByRole('button', { name: /register/i });
      const emailInput = page.getByLabel(/email/i);
      await emailInput.fill(userAccount.email);
      await registerButton.click();

      // Check that the verification form is shown. The button
      // should be disabled because you can only request a new link every 60
      // seconds.
      await expect(page.getByText(/verify your email/i)).toBeVisible();
      await expect(
        page.getByText(
          /if you haven't received the email within 60 seconds, you may request another verification link./i,
        ),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: /request new verification link/i }),
      ).toBeDisabled();
    });
  });

  test.describe('google registration', () => {
    test('given: a logged out user, should: log the user and redirect to the google login page', async ({
      page,
    }) => {
      await page.goto(path);

      // Click the Google registration button.
      const googleRegistrationButton = page.getByRole('button', {
        name: /google/i,
      });
      await googleRegistrationButton.click();

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
