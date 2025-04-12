// TODO: add e2e tests if a user tries to join an organization that they're
// already a member of.
// If its from the accept invite link page, they should be redirected to the
// dashboard of that organization with a toast saying they're already a member
// of that organization.
// If its from the login page, they should be redirected to the org's
// dashboard, too, with a toast saying they're already a member of that
// organization.

// TODO: add header to user account page that redirects to the last organization
// page they were on. (Use team switcher cookies for this.)
// TODO: add header to organization creation page that redirects to the last
// organization page they were on. (Use team switcher cookies for this.)

// TODO: File uploads for logos & avatars
// TODO: Notifications
// TODO: invite via email
// TODO: billing

// Billing:
// - Free Tier, Pro Tier, Enterprise Tier
// - Hobby Tier, Pro Tier, Enterprise Tier
//   - Optional: free trial

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { OrganizationMembershipRole } from '@prisma/client';

import {
  deleteOrganizationFromDatabaseById,
  retrieveOrganizationFromDatabaseById,
} from '~/features/organizations/organizations-model.server';
import { addMembersToOrganizationInDatabaseById } from '~/features/organizations/organizations-model.server';
import { createPopulatedUserAccount } from '~/features/user-accounts/user-accounts-factories.server';
import {
  deleteUserAccountFromDatabaseById,
  retrieveUserAccountFromDatabaseById,
  saveUserAccountToDatabase,
} from '~/features/user-accounts/user-accounts-model.server';
import {
  createUserWithOrgAndAddAsMember,
  teardownOrganizationAndMember,
} from '~/test/test-utils';

import {
  getPath,
  loginAndSaveUserAccountToDatabase,
  setupOrganizationAndLoginAsMember,
} from '../../utils';

test.describe('account settings', () => {
  test('given: a logged out user, should: redirect to login page with redirectTo parameter', async ({
    page,
  }) => {
    await page.goto('/settings/account');

    // Verify redirect
    await expect(page).toHaveURL('/login?redirectTo=%2Fsettings%2Faccount');
  });

  test('given: a logged in user, should: show account settings form', async ({
    page,
  }) => {
    const user = await loginAndSaveUserAccountToDatabase({ page });

    await page.goto('/settings/account');

    // Verify page content
    await expect(
      page.getByRole('heading', { name: /settings/i, level: 1 }),
    ).toBeVisible();
    await expect(page).toHaveTitle(/account | react router saas template/i);
    await expect(page.getByText(/manage your account settings/i)).toBeVisible();

    // Verify form values
    await expect(page.getByRole('textbox', { name: /name/i })).toHaveValue(
      user.name,
    );
    await expect(page.getByRole('textbox', { name: /email/i })).toHaveValue(
      user.email,
    );
    await expect(page.getByRole('img', { name: /avatar/i })).toBeVisible();

    await deleteUserAccountFromDatabaseById(user.id);
  });

  test('given: a logged in user updating their name, should: update name and show success toast', async ({
    page,
  }) => {
    const user = await loginAndSaveUserAccountToDatabase({ page });

    await page.goto('/settings/account');

    // Update name
    const newName = createPopulatedUserAccount().name;
    await page.getByRole('textbox', { name: /name/i }).fill(newName);
    await page.getByRole('button', { name: /save changes/i }).click();

    // Verify success toast
    await expect(
      page
        .getByRole('region', {
          name: /notifications/i,
        })
        .getByText(/your account has been updated/i),
    ).toBeVisible();

    // Verify name was updated
    await expect(page.getByRole('textbox', { name: /name/i })).toHaveValue(
      newName,
    );

    await deleteUserAccountFromDatabaseById(user.id);
  });

  test('given: a logged in user submitting an invalid name, should: show validation errors', async ({
    page,
  }) => {
    const user = await loginAndSaveUserAccountToDatabase({ page });

    await page.goto('/settings/account');

    // Submit invalid name
    await page.getByRole('textbox', { name: /name/i }).fill('a');
    await page.getByRole('button', { name: /save changes/i }).click();

    // Verify validation error
    await expect(
      page.getByText(/your name must be at least 2 characters long/i),
    ).toBeVisible();

    await deleteUserAccountFromDatabaseById(user.id);
  });

  test('given: a logged in user, should: lack any automatically detectable accessibility issues', async ({
    page,
  }) => {
    const user = await loginAndSaveUserAccountToDatabase({ page });

    await page.goto('/settings/account');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules('color-contrast')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    await deleteUserAccountFromDatabaseById(user.id);
  });

  test('given: a logged in user that is only a member or admin of organizations, should: be able to delete their account', async ({
    page,
  }) => {
    // The user is a member of the first organization.
    const { user, organization } = await setupOrganizationAndLoginAsMember({
      page,
      role: OrganizationMembershipRole.member,
    });
    const { user: otherUser, organization: otherOrganization } =
      await createUserWithOrgAndAddAsMember({
        role: OrganizationMembershipRole.owner,
      });
    // The user is an admin of the second organization.
    await addMembersToOrganizationInDatabaseById({
      id: otherOrganization.id,
      members: [user.id],
      role: OrganizationMembershipRole.admin,
    });

    // Visit the account settings page
    await page.goto('/settings/account');
    await expect(
      page.getByRole('heading', { name: /danger zone/i, level: 2 }),
    ).toBeVisible();

    // Open the delete account dialog
    await page.getByRole('button', { name: /delete account/i }).click();

    // Verify dialog content
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /delete account/i, level: 2 }),
    ).toBeVisible();
    await expect(
      page.getByText(/are you sure you want to delete your account/i),
    ).toBeVisible();
    // Cancel the deletion
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Confirm the deletion
    await page.getByRole('button', { name: /delete account/i }).click();
    await page.getByRole('button', { name: /delete this account/i }).click();

    // Verify the user is deleted
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: /react router saas template/i,
      }),
    ).toBeVisible();
    expect(getPath(page)).toEqual('/');
    const deletedUser = await retrieveUserAccountFromDatabaseById(user.id);
    expect(deletedUser).toBeNull();

    await deleteOrganizationFromDatabaseById(organization.id);
    await deleteOrganizationFromDatabaseById(otherOrganization.id);
    await deleteUserAccountFromDatabaseById(otherUser.id);
  });

  test('given: a logged in user that is the sole owner (as in the user is both the owner and the only member) of their organization, should: be able to delete their account', async ({
    page,
  }) => {
    const { user, organization } = await setupOrganizationAndLoginAsMember({
      page,
      role: OrganizationMembershipRole.owner,
    });

    // Visit the account settings page
    await page.goto('/settings/account');
    await expect(
      page.getByRole('heading', { name: /danger zone/i, level: 2 }),
    ).toBeVisible();

    // Open the delete account dialog
    await page.getByRole('button', { name: /delete account/i }).click();

    // Verify dialog content
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /delete account/i, level: 2 }),
    ).toBeVisible();
    await expect(
      page.getByText(/the following organization will be deleted/i),
    ).toBeVisible();
    await expect(page.getByText(organization.name)).toBeVisible();
    // Cancel the deletion
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Confirm the deletion
    await page.getByRole('button', { name: /delete account/i }).click();
    await page.getByRole('button', { name: /delete this account/i }).click();

    // Verify the user is deleted
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: /react router saas template/i,
      }),
    ).toBeVisible();
    expect(getPath(page)).toEqual('/');
    const deletedUser = await retrieveUserAccountFromDatabaseById(user.id);
    expect(deletedUser).toBeNull();
    const deletedOrganization = await retrieveOrganizationFromDatabaseById(
      organization.id,
    );
    expect(deletedOrganization).toBeNull();
  });

  test('given: a logged in user that is an owner of an organization with more members, should: prohibit the user from deleting their account', async ({
    page,
  }) => {
    const { user, organization } = await setupOrganizationAndLoginAsMember({
      page,
      role: OrganizationMembershipRole.owner,
    });
    const otherUser = createPopulatedUserAccount();
    await saveUserAccountToDatabase(otherUser);
    await addMembersToOrganizationInDatabaseById({
      id: organization.id,
      members: [otherUser.id],
      role: OrganizationMembershipRole.member,
    });

    await page.goto('/settings/account');

    await expect(
      page.getByText(
        new RegExp(
          `Your account is currently an owner in this organization: ${organization.name}.`,
        ),
      ),
    ).toBeVisible();
    await expect(
      page.getByText(
        /you must remove yourself, transfer ownership, or delete this organization before you can delete your user./i,
      ),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /delete account/i }),
    ).toBeDisabled();

    await teardownOrganizationAndMember({ user, organization });
    await deleteUserAccountFromDatabaseById(otherUser.id);
  });
});
