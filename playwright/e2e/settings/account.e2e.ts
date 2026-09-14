// TODO: fix layout for organization settings with avatar
// TODO: upgrade packages
// TODO: contact sales enterprise flow
// TODO: add test that if there are multiple subscriptions, only the latest
// subscription is used.
// TODO: make sure the app can't be used when the subscription is cancelled and ran out.
// TODO: implement confirmation before joining organization.

import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

import { expect, test } from "../../fixtures";
import {
  expectImageToBeRendered,
  loginAndSaveUserAccountToDatabase,
  setupOrganizationAndLoginAsMember,
} from "../../utils";
import {
  addMembersToOrganizationInDatabaseById,
  retrieveOrganizationFromDatabaseById,
} from "~/features/organizations/organizations-model.server";
import { createPopulatedUserAccount } from "~/features/user-accounts/user-accounts-factories.server";
import {
  deleteUserAccountFromDatabaseById,
  retrieveUserAccountFromDatabaseById,
  saveUserAccountToDatabase,
} from "~/features/user-accounts/user-accounts-model.server";
import type { UserAccount } from "~/generated/client";
import { OrganizationMembershipRole } from "~/generated/client";
import { TEST_IMAGE_DATA_URL } from "~/test/test-image";
import {
  createUserWithOrgAndAddAsMember,
  teardownOrganizationAndMember,
} from "~/test/test-utils";
import { prisma } from "~/utils/database.server";

test.describe("account settings", () => {
  test("given: a logged out user, should: redirect to login page with redirectTo parameter", async ({
    page,
  }) => {
    await page.goto("/settings/account");

    // Verify redirect
    await expect(page).toHaveURL("/login?redirectTo=%2Fsettings%2Faccount");
  });

  test("given: a logged in user, should: show a header and an account settings form", async ({
    page,
  }) => {
    const user = await loginAndSaveUserAccountToDatabase({ page });

    await page.goto("/settings/account");

    // Verify header
    await expect(
      page.getByRole("heading", { level: 1, name: /settings/i }),
    ).toBeVisible();
    await expect(page).toHaveTitle(/account | react router saas template/i);
    await expect(page.getByText(/manage your account settings/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /back/i })).toHaveAttribute(
      "href",
      "/organizations",
    );

    // Verify form values
    await expect(page.getByRole("textbox", { name: /name/i })).toHaveValue(
      user.name,
    );
    await expect(page.getByRole("textbox", { name: /email/i })).toHaveValue(
      user.email,
    );
    // The fixture image must decode successfully, without falling back to an icon.
    await expect(
      page.getByText(/your avatar will be shown across the application/i),
    ).toBeVisible();
    await expectImageToBeRendered(
      page.getByRole("img", { name: /avatar preview/i }),
      TEST_IMAGE_DATA_URL,
    );

    await deleteUserAccountFromDatabaseById(user.id);
  });

  test("given: a logged in user updating their name, should: update name and show success toast", async ({
    page,
  }) => {
    const user = await loginAndSaveUserAccountToDatabase({ page });

    await page.goto("/settings/account");

    // Update name
    const newName = createPopulatedUserAccount().name;
    await expect(
      page.getByRole("heading", { level: 1, name: /settings/i }),
    ).toBeVisible();
    await expect(page.getByText(/manage your account settings/i)).toBeVisible();
    await page.getByRole("textbox", { name: /name/i }).fill(newName);
    await page.getByRole("button", { name: /save changes/i }).click();

    // Verify success toast
    await expect(
      page
        .getByRole("region", {
          name: /notifications/i,
        })
        .getByText(/your account has been updated/i),
    ).toBeVisible();

    // Verify name was updated
    await expect(page.getByRole("textbox", { name: /name/i })).toHaveValue(
      newName,
    );

    await deleteUserAccountFromDatabaseById(user.id);
  });

  test("given: a logged in user submitting an invalid name, should: show validation errors", async ({
    page,
  }) => {
    const user = await loginAndSaveUserAccountToDatabase({ page });

    await page.goto("/settings/account");

    // Submit invalid name
    await expect(
      page.getByRole("heading", { level: 1, name: /settings/i }),
    ).toBeVisible();
    await expect(page.getByText(/manage your account settings/i)).toBeVisible();
    await page.getByRole("textbox", { name: /name/i }).fill("a");
    await page.getByRole("button", { name: /save changes/i }).click();

    // Verify validation error
    await expect(
      page.getByText(/your name must be at least 2 characters long/i),
    ).toBeVisible();

    await deleteUserAccountFromDatabaseById(user.id);
  });

  test("given: a logged in user submitting a new name and avatar, should: set the new name and avatar and show a success toast", async ({
    page,
  }) => {
    const user = await loginAndSaveUserAccountToDatabase({ page });

    await page.goto("/settings/account");

    // Verify page loaded
    await expect(
      page.getByRole("heading", { level: 1, name: /settings/i }),
    ).toBeVisible();
    await expect(page.getByText(/manage your account settings/i)).toBeVisible();
    const avatar = page.getByRole("img", { name: /avatar preview/i });
    await expectImageToBeRendered(avatar, TEST_IMAGE_DATA_URL);

    // Set new name
    const newName = createPopulatedUserAccount().name;
    await page.getByRole("textbox", { name: /name/i }).fill(newName);

    // Upload new avatar via file input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles("playwright/fixtures/200x200.jpg");

    await expect(avatar).toHaveAttribute("src", /^blob:/);
    await expectImageToBeRendered(avatar);

    // Save changes
    await page.getByRole("button", { name: /save changes/i }).click();

    // Verify success toast
    await expect(
      page
        .getByRole("region", { name: /notifications/i })
        .getByText(/your account has been updated/i),
    ).toBeVisible();

    // Verify name was updated in database
    const updatedUser = await retrieveUserAccountFromDatabaseById(user.id);
    expect(updatedUser?.name).toEqual(newName);
    const storedAvatarUrl = updatedUser?.imageUrl ?? "";
    const avatarUrl = new URL(storedAvatarUrl);
    expect(avatarUrl.origin).toBe(
      new URL(process.env.VITE_SUPABASE_URL).origin,
    );
    expect(avatarUrl.pathname).toMatch(
      new RegExp(
        `^/storage/v1/object/public/app-images/user-avatars/${user.id}/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\\.jpg$`,
      ),
    );

    // Reload to verify persisted Storage bytes, rather than the blob preview.
    const download = page.waitForResponse(storedAvatarUrl);
    await page.reload();
    const response = await download;
    expect(response.ok()).toBe(true);
    expect(await response.body()).toEqual(
      await readFile("playwright/fixtures/200x200.jpg"),
    );
    await expectImageToBeRendered(avatar, storedAvatarUrl);

    await deleteUserAccountFromDatabaseById(user.id);
  });

  test("given: a logged in user, should: lack any automatically detectable accessibility issues", async ({
    page,
  }) => {
    const user = await loginAndSaveUserAccountToDatabase({ page });

    await page.goto("/settings/account");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules("color-contrast")
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    await deleteUserAccountFromDatabaseById(user.id);
  });

  test("given: an account without organizations, should: delete the account and retain access to cleanup status after signing out", async ({
    page,
  }) => {
    test.setTimeout(40_000);
    const user = await loginAndSaveUserAccountToDatabase({ page });

    try {
      await confirmAccountDeletion(page, user.email);
      await expectAccountDeletionComplete(page, user);
      const deletionUrl = page.url();

      await page.reload();
      await expect(
        page.getByRole("heading", { name: /^your account has been deleted$/i }),
      ).toBeVisible();
      await page.goto("/settings/account");
      await expect(page).toHaveURL("/login?redirectTo=%2Fsettings%2Faccount");
      await page.goto(deletionUrl);
      await expect(
        page.getByRole("heading", { name: /^your account has been deleted$/i }),
      ).toBeVisible();
    } finally {
      await cleanupAccountDeletion(user);
    }
  });

  test("given: a member and admin of organizations, should: delete the account and preserve both organizations and their billing records", async ({
    page,
  }) => {
    test.setTimeout(40_000);
    const { user, organization } = await setupOrganizationAndLoginAsMember({
      page,
      role: OrganizationMembershipRole.member,
    });
    const { user: otherUser, organization: otherOrganization } =
      await createUserWithOrgAndAddAsMember({
        role: OrganizationMembershipRole.owner,
      });
    await addMembersToOrganizationInDatabaseById({
      id: organization.id,
      members: [otherUser.id],
      role: OrganizationMembershipRole.owner,
    });
    await addMembersToOrganizationInDatabaseById({
      id: otherOrganization.id,
      members: [user.id],
      role: OrganizationMembershipRole.admin,
    });

    try {
      const originalOrganizations = await prisma.organization.findMany({
        orderBy: { id: "asc" },
        where: { id: { in: [organization.id, otherOrganization.id] } },
      });
      const originalSubscriptions = await prisma.stripeSubscription.findMany({
        orderBy: { stripeId: "asc" },
        select: { organizationId: true, status: true, stripeId: true },
        where: {
          organizationId: { in: [organization.id, otherOrganization.id] },
        },
      });
      await confirmAccountDeletion(page, user.email);
      await expectAccountDeletionComplete(page, user);

      expect(
        await prisma.organization.findMany({
          orderBy: { id: "asc" },
          where: { id: { in: [organization.id, otherOrganization.id] } },
        }),
      ).toEqual(originalOrganizations);
      expect(
        await prisma.stripeSubscription.findMany({
          orderBy: { stripeId: "asc" },
          select: { organizationId: true, status: true, stripeId: true },
          where: {
            organizationId: { in: [organization.id, otherOrganization.id] },
          },
        }),
      ).toEqual(originalSubscriptions);
      expect(
        await prisma.organizationMembership.count({
          where: { memberId: user.id },
        }),
      ).toEqual(0);
      expect(await retrieveUserAccountFromDatabaseById(otherUser.id)).toEqual(
        otherUser,
      );
    } finally {
      await cleanupAccountDeletion(user);
      await teardownOrganizationAndMember({ organization, user });
      await teardownOrganizationAndMember({
        organization: otherOrganization,
        user: otherUser,
      });
    }
  });

  test("given: the sole member and owner of an organization, should: disclose its deletion and finish account and organization cleanup", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const { user, organization } = await setupOrganizationAndLoginAsMember({
      page,
      role: OrganizationMembershipRole.owner,
    });

    try {
      await confirmAccountDeletion(page, user.email, organization.name);
      // The organization worker may own the dependency's lease on the first
      // account sweep. Allow two 15-second polls and the status refresh.
      await expectAccountDeletionComplete(page, user, 45_000);

      expect(
        await retrieveOrganizationFromDatabaseById(organization.id),
      ).toBeNull();
      const organizationDeletion = await prisma.organizationDeletion.findUnique(
        {
          where: { id: organization.id },
        },
      );
      expect(organizationDeletion?.completedAt).toBeInstanceOf(Date);
    } finally {
      await cleanupAccountDeletion(user);
      await prisma.organizationDeletion.deleteMany({
        where: { id: organization.id },
      });
      await teardownOrganizationAndMember({ organization, user });
    }
  });

  test("given: an owner with another active owner in the organization, should: delete the account and preserve the remaining owner and organization", async ({
    page,
  }) => {
    test.setTimeout(40_000);
    const { user, organization } = await setupOrganizationAndLoginAsMember({
      page,
      role: OrganizationMembershipRole.owner,
    });
    const otherUser = createPopulatedUserAccount();
    await saveUserAccountToDatabase(otherUser);
    await addMembersToOrganizationInDatabaseById({
      id: organization.id,
      members: [otherUser.id],
      role: OrganizationMembershipRole.owner,
    });

    try {
      const originalOrganization = await retrieveOrganizationFromDatabaseById(
        organization.id,
      );
      await confirmAccountDeletion(page, user.email);
      await expectAccountDeletionComplete(page, user);

      expect(await retrieveUserAccountFromDatabaseById(otherUser.id)).toEqual(
        otherUser,
      );
      expect(
        await retrieveOrganizationFromDatabaseById(organization.id),
      ).toEqual(originalOrganization);
      expect(
        await prisma.organizationMembership.findMany({
          select: { memberId: true, role: true },
          where: { organizationId: organization.id },
        }),
      ).toEqual([
        { memberId: otherUser.id, role: OrganizationMembershipRole.owner },
      ]);
      expect(
        await prisma.organizationDeletion.count({
          where: { id: organization.id },
        }),
      ).toEqual(0);
    } finally {
      await cleanupAccountDeletion(user);
      await teardownOrganizationAndMember({ organization, user });
      await deleteUserAccountFromDatabaseById(otherUser.id);
    }
  });

  test("given: the last active owner of an organization with other members, should: require an ownership transfer and reject direct account deletion", async ({
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

    try {
      const originalOrganization = await retrieveOrganizationFromDatabaseById(
        organization.id,
      );
      await page.goto("/settings/account");
      await expect(
        page.getByRole("button", { name: /^delete account$/i }),
      ).toBeDisabled();
      await expect(
        page.getByText(/you are the last active owner/i),
      ).toContainText(organization.name);
      const response = await page.request.post("/settings/account", {
        maxRedirects: 0,
        multipart: { confirmation: user.email, intent: "delete-user-account" },
      });
      expect(response.status()).toEqual(400);
      expect(response.headers().location).toEqual(undefined);
      expect(await retrieveUserAccountFromDatabaseById(user.id)).toEqual(user);
      expect(await retrieveUserAccountFromDatabaseById(otherUser.id)).toEqual(
        otherUser,
      );
      expect(
        await retrieveOrganizationFromDatabaseById(organization.id),
      ).toEqual(originalOrganization);
      expect(
        await prisma.accountDeletion.count({
          where: { supabaseUserId: user.supabaseUserId },
        }),
      ).toEqual(0);
    } finally {
      await teardownOrganizationAndMember({ organization, user });
      await deleteUserAccountFromDatabaseById(otherUser.id);
    }
  });

  test("given: an incorrect confirmation email, should: reject deletion in the dialog and on direct requests", async ({
    page,
  }) => {
    const user = await loginAndSaveUserAccountToDatabase({ page });

    try {
      await page.goto("/settings/account");
      await page.getByRole("button", { name: /^delete account$/i }).click();
      const dialog = page.getByRole("dialog");
      await dialog
        .getByRole("textbox", { name: /to confirm, type/i })
        .fill("wrong@example.com");
      await dialog
        .getByRole("button", { name: /delete this account/i })
        .click();
      await expect(dialog.getByRole("alert")).toContainText(
        "The confirmation text doesn't match your email address.",
      );
      const response = await page.request.post("/settings/account", {
        maxRedirects: 0,
        multipart: {
          confirmation: "wrong@example.com",
          intent: "delete-user-account",
        },
      });
      expect(response.status()).toEqual(400);
      expect(await retrieveUserAccountFromDatabaseById(user.id)).toEqual(user);
      expect(
        await prisma.accountDeletion.count({
          where: { supabaseUserId: user.supabaseUserId },
        }),
      ).toEqual(0);
      await page.reload();
      await expect(page).toHaveURL("/settings/account");
    } finally {
      await cleanupAccountDeletion(user);
    }
  });
});

async function confirmAccountDeletion(
  page: Page,
  email: string,
  organizationName?: string,
) {
  await page.goto("/settings/account");
  await page.getByRole("button", { name: /^delete account$/i }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  if (organizationName) {
    await expect(dialog).toContainText(
      `The following organization will be deleted: ${organizationName}`,
    );
  }
  await dialog.getByRole("textbox", { name: /to confirm, type/i }).fill(email);
  await dialog.getByRole("button", { name: /delete this account/i }).click();
  await expect(page).toHaveURL(/\/account-deletions\/[^/]+$/);
}

async function expectAccountDeletionComplete(
  page: Page,
  user: UserAccount,
  timeout = 25_000,
) {
  await expect(
    page.getByRole("heading", { name: /^your account has been deleted$/i }),
  ).toBeVisible({ timeout });
  expect(await retrieveUserAccountFromDatabaseById(user.id)).toBeNull();
  const deletion = await prisma.accountDeletion.findUnique({
    include: { resources: true },
    where: { supabaseUserId: user.supabaseUserId },
  });
  expect(deletion?.completedAt).toBeInstanceOf(Date);
  expect(
    deletion?.resources.every((resource) => resource.completedAt !== null),
  ).toEqual(true);
}

async function cleanupAccountDeletion(user: UserAccount) {
  await prisma.accountDeletion.deleteMany({
    where: { supabaseUserId: user.supabaseUserId },
  });
  await prisma.userAccount.deleteMany({ where: { id: user.id } });
}
