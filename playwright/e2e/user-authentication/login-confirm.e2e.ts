import { expect, test } from '@playwright/test';

import { INVITE_LINK_INFO_SESSION_NAME } from '~/features/organizations/accept-invite-link/accept-invite-link-constants';
import { createPopulatedOrganizationInviteLink } from '~/features/organizations/organizations-factories.server';
import { saveOrganizationInviteLinkToDatabase } from '~/features/organizations/organizations-invite-link-model.server';
import { createPopulatedUserAccount } from '~/features/user-accounts/user-accounts-factories.server';
import {
  deleteUserAccountFromDatabaseById,
  retrieveUserAccountFromDatabaseByEmail,
  saveUserAccountToDatabase,
} from '~/features/user-accounts/user-accounts-model.server';
import { stringifyTokenHashData } from '~/test/mocks/handlers/supabase/auth';
import {
  createUserWithOrgAndAddAsMember,
  teardownOrganizationAndMember,
} from '~/test/test-utils';

import {
  getPath,
  setupInviteLinkCookie,
  setupOrganizationAndLoginAsMember,
} from '../../utils';

const path = '/login/confirm';

test.describe(`${path} API route`, () => {
  test('given: a valid token_hash for an existing user, should: verify OTP and redirect to organizations page', async ({
    page,
  }) => {
    // Create a test user account.
    const { user, organization } = await createUserWithOrgAndAddAsMember();

    // Mock token hash.
    const tokenHash = stringifyTokenHashData({
      email: user.email,
      id: user.supabaseUserId,
    });

    // Navigate to the login-confirm page with token hash.
    await page.goto(`${path}?token_hash=${tokenHash}`);

    // Verify the user is redirected to the organizations page.
    expect(getPath(page)).toEqual(
      `/organizations/${organization.slug}/dashboard`,
    );

    // Clean up.
    await teardownOrganizationAndMember({ user, organization });
  });

  test("given: a valid token_hash for a new user (this can happen if the user is sent here from the register route because they missed or didn't click the first link), should: create user account, verify OTP and redirect to the onboarding page", async ({
    page,
  }) => {
    // Generate a unique email for testing.
    const testEmail = `test-${Date.now()}@example.com`;

    // Use the email as the token hash.
    const tokenHash = stringifyTokenHashData({ email: testEmail });

    // Navigate to the login-confirm page with token hash.
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
    const { user, organization } = await setupOrganizationAndLoginAsMember({
      page,
    });

    // Navigate to the login-confirm page with any token.
    await page.goto(`${path}?token_hash=any_token`);

    // Verify the user is redirected to the organizations page.
    expect(getPath(page)).toEqual(
      `/organizations/${organization.slug}/dashboard`,
    );

    // Clean up.
    await teardownOrganizationAndMember({ user, organization });
  });

  test('given: a valid token hast for an existing user with an active invite link cookie, should: add them to the organization after login and show success toast', async ({
    page,
  }) => {
    // Create organization and invite link
    const { organization, user: invitingUser } =
      await createUserWithOrgAndAddAsMember();
    const link = createPopulatedOrganizationInviteLink({
      organizationId: organization.id,
      creatorId: invitingUser.id,
    });
    await saveOrganizationInviteLinkToDatabase(link);

    // Create and save the user who will log in
    const userAccount = createPopulatedUserAccount();
    await saveUserAccountToDatabase(userAccount);

    // Set the invite link cookie
    await setupInviteLinkCookie({
      page,
      link: { tokenId: link.id, expiresAt: link.expiresAt },
    });

    // Go to login confirm with token hash
    const tokenHash = stringifyTokenHashData({
      email: userAccount.email,
      id: userAccount.supabaseUserId,
    });
    await page.goto(`/login/confirm?token_hash=${tokenHash}`);

    // Verify redirect to organization dashboard
    await expect(
      page.getByRole('heading', { name: /dashboard/i, level: 1 }),
    ).toBeVisible();
    expect(getPath(page)).toEqual(
      `/organizations/${organization.slug}/dashboard`,
    );

    // Verify success toast
    await expect(
      page
        .getByRole('region', {
          name: /notifications/i,
        })
        .getByText(/successfully joined organization/i),
    ).toBeVisible();

    // Verify invite link cookie is cleared
    const cookies = await page.context().cookies();
    const inviteLinkCookie = cookies.find(
      cookie => cookie.name === INVITE_LINK_INFO_SESSION_NAME,
    );
    expect(inviteLinkCookie).toBeUndefined();

    // Cleanup
    await deleteUserAccountFromDatabaseById(userAccount.id);
    await teardownOrganizationAndMember({ user: invitingUser, organization });
  });

  test('given: a valid token hash for a new user with an active invite link cookie, should: create their account, add them to the organization, show a success toast, and clear the invite link cookie', async ({
    page,
  }) => {
    // Create organization and invite link
    const { organization, user: invitingUser } =
      await createUserWithOrgAndAddAsMember();
    const link = createPopulatedOrganizationInviteLink({
      organizationId: organization.id,
      creatorId: invitingUser.id,
    });
    await saveOrganizationInviteLinkToDatabase(link);

    // Set the invite link cookie
    await setupInviteLinkCookie({
      page,
      link: { tokenId: link.id, expiresAt: link.expiresAt },
    });

    // Generate a unique email for testing.
    const testEmail = `test-${Date.now()}@example.com`;

    // Use the email as the token hash.
    const tokenHash = stringifyTokenHashData({ email: testEmail });

    // Navigate to the login-confirm page with token hash.
    await page.goto(`${path}?token_hash=${tokenHash}`);

    // Verify the user is redirected to the onboarding page.
    await expect(
      page.getByRole('heading', { name: /onboarding/i, level: 1 }),
    ).toBeVisible();
    expect(getPath(page)).toEqual('/onboarding/user-account');

    // Verify the user account was created in the database.
    const userAccount = await retrieveUserAccountFromDatabaseByEmail(testEmail);
    expect(userAccount).not.toBeNull();
    expect(userAccount?.email).toEqual(testEmail);

    // Enter the account details
    const { name } = createPopulatedUserAccount();
    await page.getByRole('textbox', { name: /name/i }).fill(name);
    await page.getByRole('button', { name: /save/i }).click();

    // Verify success toast
    await expect(
      page.getByRole('heading', { name: /dashboard/i, level: 1 }),
    ).toBeVisible();
    expect(getPath(page)).toEqual(
      `/organizations/${organization.slug}/dashboard`,
    );
    await expect(
      page
        .getByRole('region', {
          name: /notifications/i,
        })
        .getByText(/successfully joined organization/i),
    ).toBeVisible();

    // Verify invite link cookie is cleared
    const cookies = await page.context().cookies();
    const inviteLinkCookie = cookies.find(
      cookie => cookie.name === INVITE_LINK_INFO_SESSION_NAME,
    );
    expect(inviteLinkCookie).toBeUndefined();

    // Cleanup
    if (userAccount) {
      await deleteUserAccountFromDatabaseById(userAccount.id);
    }
    await teardownOrganizationAndMember({ user: invitingUser, organization });
  });
});
