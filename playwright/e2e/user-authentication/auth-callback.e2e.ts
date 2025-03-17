import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { getPath } from 'playwright/utils';

import { createPopulatedUserAccount } from '~/features/user-accounts/user-accounts-factories.server';
import {
  deleteUserAccountFromDatabaseById,
  retrieveUserAccountFromDatabaseByEmail,
} from '~/features/user-accounts/user-accounts-model.server';
import { stringifyAuthCodeData } from '~/test/mocks/handlers/supabase/auth';
import {
  setupUserWithOrgAndAddAsMember,
  teardownOrganizationAndMember,
} from '~/test/test-utils';

const path = '/auth/callback';

/**
 * Sets up the code verifier cookie required for PKCE flow.
 * This simulates what happens when a user initiates OAuth login.
 */
async function setupCodeVerifierCookie({ page }: { page: Page }) {
  const projectReference =
    process.env.SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1] ?? 'default';

  await page.context().addCookies([
    {
      name: `sb-${projectReference}-auth-token-code-verifier`,
      value: 'test-code-verifier',
      domain: 'localhost',
      path: '/',
    },
  ]);
}

test.describe(`${path} API route`, () => {
  test('given: a valid code for a new user, should: create user account and redirect to onboarding page', async ({
    page,
  }) => {
    // Set up the code verifier cookie first.
    await setupCodeVerifierCookie({ page });

    // Use a code that includes 'google' to simulate Google OAuth. The email
    // will be used to create a mock user in the mock handler.
    const { email } = createPopulatedUserAccount();
    const code = stringifyAuthCodeData({ provider: 'google', email });

    // Navigate to the callback page with code.
    await page.goto(`${path}?code=${code}`);

    // Verify we're on the onboarding page.
    expect(getPath(page)).toEqual('/onboarding/user-account');

    // Get the created user account from the database.
    // Note: The mock handler for `exchangeCodeForSession` returns a user based
    // on the code.
    const userAccount = await retrieveUserAccountFromDatabaseByEmail(email);
    expect(userAccount).not.toBeNull();

    // Clean up if user was created.
    if (userAccount) {
      await deleteUserAccountFromDatabaseById(userAccount.id);
    }
  });

  test('given: a code for an existing user, should: redirect to organizations page', async ({
    page,
  }) => {
    // Create an existing user account first.
    const { user, organization } = await setupUserWithOrgAndAddAsMember();

    // Set up the code verifier cookie.
    await setupCodeVerifierCookie({ page });

    const code = stringifyAuthCodeData({
      provider: 'google',
      email: user.email,
      id: user.supabaseUserId,
    });

    // Navigate to callback with code.
    await page.goto(`${path}?code=${code}`);

    // Verify we're on the organizations page.
    expect(getPath(page)).toEqual(`/organizations/${organization.slug}`);

    // Clean up.
    await teardownOrganizationAndMember({ user, organization });
  });

  test('given: no code parameter, should: return an error', async ({
    request,
  }) => {
    // Make request without code.
    const response = await request.get(path);

    // Verify response.
    expect(response.status()).toEqual(500);
  });

  test('given: an invalid code, should: return an error', async ({
    request,
  }) => {
    // Make request with invalid code.
    const response = await request.get(`${path}?code=invalid_code`);

    // Verify response.
    expect(response.status()).toEqual(500);
  });
});
