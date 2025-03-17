import { expect, test } from '@playwright/test';

import { createPopulatedUserAccount } from '~/features/user-accounts/user-accounts-factories.server';
import {
  deleteUserAccountFromDatabaseById,
  retrieveUserAccountFromDatabaseByEmail,
  saveUserAccountToDatabase,
} from '~/features/user-accounts/user-accounts-model.server';
import { stringifyTokenHashData } from '~/test/mocks/handlers/supabase/auth';
import {
  setupUserWithOrgAndAddAsMember,
  teardownOrganizationAndMember,
} from '~/test/test-utils';

import { getPath, loginByCookie } from '../../utils';

const path = '/register/confirm';

test.describe(`${path} API route`, () => {
  test('given: a valid token_hash for a new user, should: create user account and redirect to onboarding page', async ({
    page,
  }) => {
    // Generate a unique email for testing.
    const testEmail = `test-${Date.now()}@example.com`;

    // Use the email as the token hash.
    const tokenHash = stringifyTokenHashData({ email: testEmail });

    // Navigate to the register-confirm page with token hash.
    await page.goto(`${path}?token_hash=${tokenHash}`);

    // Verify the user is redirected to the onboarding page.
    expect(getPath(page)).toEqual('/onboarding/user-account');

    // Verify the user account was created in the database.
    const userAccount = await retrieveUserAccountFromDatabaseByEmail(testEmail);
    expect(userAccount).not.toBeNull();
    expect(userAccount?.email).toEqual(testEmail);

    // Clean up.
    if (userAccount) {
      await deleteUserAccountFromDatabaseById(userAccount.id);
    }
  });

  test('given: a token_hash for an email that already exists, should: handle duplicate user and redirect to onboarding', async ({
    page,
  }) => {
    // Create a test user account first.
    const userAccount = createPopulatedUserAccount({ name: '' });
    await saveUserAccountToDatabase(userAccount);

    // Use the existing email as the token hash.
    const tokenHash = stringifyTokenHashData({
      email: userAccount.email,
      id: userAccount.supabaseUserId,
    });

    // Navigate to the register-confirm page with token hash.
    await page.goto(`${path}?token_hash=${tokenHash}`);

    // Verify the user is redirected to the onboarding page.
    expect(getPath(page)).toEqual('/onboarding/user-account');

    // Clean up.
    await deleteUserAccountFromDatabaseById(userAccount.id);
  });

  test('given: an invalid token_hash, should: return an error', async ({
    request,
  }) => {
    // Make request with invalid token.
    const response = await request.get(`${path}?token_hash=invalid_token_hash`);

    // Verify response.
    expect(response.status()).toEqual(500);
  });

  test('given: no token_hash parameter, should: return an error', async ({
    request,
  }) => {
    // Make request without token hash.
    const response = await request.get(path);

    // Verify response.
    expect(response.status()).toEqual(500);
  });

  test('given: a logged in user, should: redirect to organizations page', async ({
    page,
  }) => {
    // Create a test user account.
    const { user, organization } = await setupUserWithOrgAndAddAsMember();

    // Log in the user using cookies.
    await loginByCookie({ page, user });

    // Navigate to the register-confirm page with any token.
    await page.goto(`${path}?token_hash=any_token`);

    // Verify the user is redirected to the organizations page.
    expect(getPath(page)).toEqual(`/organizations/${organization.slug}`);

    // Clean up.
    await teardownOrganizationAndMember({ user, organization });
  });
});
