// TODO: accept invite via email
//  - delete all outstanding links for the same email from the same org
// TODO: billing
// TODO: fix layout for organization settings with avatar
// TODO: upgrade packages

// Billing:
// - Free Tier, Pro Tier, Enterprise Tier
// - Hobby Tier, Pro Tier, Enterprise Tier
//   - Optional: free trial
// 6 people visit link of 5 people invite

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

  test('given: a logged in user, should: show a header and an account settings form', async ({
    page,
  }) => {
    const user = await loginAndSaveUserAccountToDatabase({ page });

    await page.goto('/settings/account');

    // Verify header
    await expect(
      page.getByRole('heading', { name: /settings/i, level: 1 }),
    ).toBeVisible();
    await expect(page).toHaveTitle(/account | react router saas template/i);
    await expect(page.getByText(/manage your account settings/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /back/i })).toHaveAttribute(
      'href',
      '/organizations',
    );

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
    await expect(
      page.getByRole('heading', { name: /settings/i, level: 1 }),
    ).toBeVisible();
    await expect(page.getByText(/manage your account settings/i)).toBeVisible();
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
    await expect(
      page.getByRole('heading', { name: /settings/i, level: 1 }),
    ).toBeVisible();
    await expect(page.getByText(/manage your account settings/i)).toBeVisible();
    await page.getByRole('textbox', { name: /name/i }).fill('a');
    await page.getByRole('button', { name: /save changes/i }).click();

    // Verify validation error
    await expect(
      page.getByText(/your name must be at least 2 characters long/i),
    ).toBeVisible();

    await deleteUserAccountFromDatabaseById(user.id);
  });

  test('given: a logged in user submitting a new name and avatar, should: set the new name and avatar and show a success toast', async ({
    page,
  }) => {
    const user = await loginAndSaveUserAccountToDatabase({ page });

    await page.goto('/settings/account');

    // Some random page assertions to give the JS for the upload time to load.
    await expect(
      page.getByRole('heading', { name: /settings/i, level: 1 }),
    ).toBeVisible();
    await expect(page.getByText(/manage your account settings/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /back/i })).toHaveAttribute(
      'href',
      '/organizations',
    );
    await expect(page.getByRole('textbox', { name: /name/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();

    // Set new name
    const newName = createPopulatedUserAccount().name;
    await page.getByRole('textbox', { name: /name/i }).fill(newName);

    // Upload new avatar
    // Test image upload via drag and drop
    const dropzone = page.getByText(/drag and drop or select files to upload/i);
    await expect(dropzone).toBeVisible();

    // Perform drag and drop of the image
    // desktop viewport = drag‑and‑drop version is rendered *after* the hidden mobile input
    const fileInputs = page.locator('input[type="file"]');
    await expect(fileInputs).toHaveCount(2);
    await fileInputs.nth(1).setInputFiles('playwright/fixtures/200x200.jpg');
    await expect(page.getByText('200x200.jpg')).toBeVisible();

    // Set new name again because sometimes the page loads slow because of the
    // MSW client mocks.
    await page.getByRole('textbox', { name: /name/i }).clear();
    await page.getByRole('textbox', { name: /name/i }).fill(newName);

    // Save changes
    await page.getByRole('button', { name: /save changes/i }).click();

    // Verify success toast
    await expect(
      page
        .getByRole('region', { name: /notifications/i })
        .getByText(/your account has been updated/i),
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

// States:
// - trialing
// - paused (= no payment info added after trial ran out)
// - incomplete (= payment info was added after trial, but the initial payment failed)
// - incomplete_expired (= payment info was added after trial, but the first invoice was not paid within 23 hours - terminal => user needs to subscribe again => check if creating a checkout session lets them enter a free trial or not)
//  - important: if the user resubscribes, it needs to PREVENT them from using a trial.
// - past_due (= invoice is not paid by the due date)
// - canceled (= user canceled the subscription, or payment failed and subscription was auto cancelled)
//   - subscription is cancelled, but still ongoing.
//   - subscriptino is cancelled, and after the current period.

// All Stripe helper functions have TSDoc.
// Allow users to change their billing address, and name. (in stripe)

// TODO: contact sales enterprise flow
// TODO: UI tests for when trial ran out (e.g. side bar card has correct text,
// etc.)
// TODO: When updating the organization name, also update the Stripe customer.
// TODO: add a notification 3 days before the trial ends.
// TODO: prevent downgrade when they have more seats than the new plan would allow.
// TODO: If during the free trial, you added more seats than any of the plan's
// limits => they should only be able to pick plans that match their seats.
// TODO: a downgrade from high annual to high annual should STILL show the
// downgrade pending banner.
// TODO: test people entering credit cards that decline or bounce
// TODO: add test that if there are multiple subscriptions, only the latest
// subscription is used.
// TODO: warn that subscriptions will be cancelled even if there is still
// time left in the current period.
// TODO: fix test for trialing and paid organizations
// TODO: enforce limits
// TODO: Use lifecycle events for the tests: https://mswjs.io/docs/api/life-cycle-events
// TODO: Prevent the org from sending out email invite links if they have more members than the plan allows.
// TODO: Show a warning that the organization is full when the organization reached the limit.
