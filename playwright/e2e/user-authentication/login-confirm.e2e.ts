import { expect, test } from '@playwright/test';

import { stringifyTokenHashData } from '~/test/mocks/handlers/supabase/auth';
import {
  setupUserWithOrgAndAddAsMember,
  teardownOrganizationAndMember,
} from '~/test/test-utils';

import { getPath, loginByCookie } from '../../utils';

const path = '/login/confirm';

test.describe(`${path} API route`, () => {
  test('given: a valid token_hash, should: verify OTP and redirect to organizations page', async ({
    page,
  }) => {
    // Create a test user account.
    const { user, organization } = await setupUserWithOrgAndAddAsMember();

    // Mock token hash.
    const tokenHash = stringifyTokenHashData({
      email: user.email,
      id: user.supabaseUserId,
    });

    // Navigate to the login-confirm page with token hash.
    await page.goto(`${path}?token_hash=${tokenHash}`);

    // Verify the user is redirected to the organizations page.
    expect(getPath(page)).toEqual(`/organizations/${organization.slug}`);

    // Clean up.
    await teardownOrganizationAndMember({ user, organization });
  });

  test('given: an invalid token_hash, should: return an error', async ({
    request,
  }) => {
    // Make request with invalid token
    const response = await request.get(`${path}?token_hash=invalid_token_hash`);

    // Verify response
    expect(response.status()).toEqual(500);
  });

  test('given: no token_hash parameter, should: return an error', async ({
    request,
  }) => {
    // Make request without token hash
    const response = await request.get(path);

    // Verify response
    expect(response.status()).toEqual(500);
  });

  test('given: a logged in user, should: redirect to organizations page', async ({
    page,
  }) => {
    // Create a test user account.
    const { user, organization } = await setupUserWithOrgAndAddAsMember();

    // Log in the user using cookies.
    await loginByCookie({ page, user });

    // Navigate to the login-confirm page with any token.
    await page.goto(`${path}?token_hash=any_token`);

    // Verify the user is redirected to the organizations page.
    expect(getPath(page)).toEqual(`/organizations/${organization.slug}`);

    // Clean up.
    await teardownOrganizationAndMember({ user, organization });
  });
});
