import { expect, test } from "@playwright/test";
import { href } from "react-router";

import {
  getPath,
  loginByCookie,
  setupEmailInviteCookie,
  setupInviteLinkCookie,
} from "../../utils";
import { priceLookupKeysByTierAndInterval } from "~/features/billing/billing-constants";
import { EMAIL_INVITE_INFO_SESSION_NAME } from "~/features/organizations/accept-email-invite/accept-email-invite-constants";
import { getAcceptedEmailInviteOnboardingPath } from "~/features/organizations/accept-email-invite/accept-email-invite-helpers.server";
import { INVITE_LINK_INFO_SESSION_NAME } from "~/features/organizations/accept-invite-link/accept-invite-link-constants";
import { retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId } from "~/features/organizations/organization-membership-model.server";
import {
  retrieveEmailInviteLinkFromDatabaseById,
  saveOrganizationEmailInviteLinkToDatabase,
} from "~/features/organizations/organizations-email-invite-link-model.server";
import {
  createPopulatedOrganizationEmailInviteLink,
  createPopulatedOrganizationInviteLink,
} from "~/features/organizations/organizations-factories.server";
import { saveOrganizationInviteLinkToDatabase } from "~/features/organizations/organizations-invite-link-model.server";
import { createPopulatedUserAccount } from "~/features/user-accounts/user-accounts-factories.server";
import {
  deleteUserAccountFromDatabaseById,
  retrieveUserAccountFromDatabaseByEmail,
  saveUserAccountToDatabase,
} from "~/features/user-accounts/user-accounts-model.server";
import { stringifyTokenHashData } from "~/test/mocks/handlers/supabase/auth";
import {
  createUserWithOrgAndAddAsMember,
  teardownOrganizationAndMember,
} from "~/test/test-utils";

const path = "/register/confirm";

test.describe(`${path} API route`, () => {
  test("given: a valid token_hash for a new user, should: create user account and redirect to onboarding page", async ({
    page,
  }) => {
    // Generate a unique email for testing.
    const testEmail = `test-${Date.now()}@example.com`;

    // Use the email as the token hash.
    const tokenHash = stringifyTokenHashData({ email: testEmail });

    // Navigate to the register-confirm page with token hash.
    await page.goto(`${path}?token_hash=${tokenHash}`);

    // Verify the user is redirected to the onboarding page.
    expect(getPath(page)).toEqual("/onboarding/user-account");

    // Verify the user account was created in the database.
    const userAccount = await retrieveUserAccountFromDatabaseByEmail(testEmail);
    expect(userAccount).not.toBeNull();
    expect(userAccount?.email).toEqual(testEmail);

    // Clean up.
    if (userAccount) {
      await deleteUserAccountFromDatabaseById(userAccount.id);
    }
  });

  test("given: a token_hash for an email that already exists, should: handle duplicate user and redirect to onboarding", async ({
    page,
  }) => {
    // Create a test user account first.
    const userAccount = createPopulatedUserAccount({ name: "" });
    await saveUserAccountToDatabase(userAccount);

    // Use the existing email as the token hash.
    const tokenHash = stringifyTokenHashData({
      email: userAccount.email,
      id: userAccount.supabaseUserId,
    });

    // Navigate to the register-confirm page with token hash.
    await page.goto(`${path}?token_hash=${tokenHash}`);

    // Verify the user is redirected to the onboarding page.
    expect(getPath(page)).toEqual("/onboarding/user-account");

    // Clean up.
    await deleteUserAccountFromDatabaseById(userAccount.id);
  });

  test("given: an invalid token_hash, should: return an error", async ({
    request,
  }) => {
    // Make request with invalid token.
    const response = await request.get(`${path}?token_hash=invalid_token_hash`);

    // Verify response.
    expect(response.status()).toEqual(500);
  });

  test("given: no token_hash parameter, should: return an error", async ({
    request,
  }) => {
    // Make request without token hash.
    const response = await request.get(path);

    // Verify response.
    expect(response.status()).toEqual(500);
  });

  test("given: a new user with an active invite link cookie, should: create their account, add them to the organization, and show success toast", async ({
    page,
  }) => {
    // Create organization and invite link
    const { organization, user: invitingUser } =
      await createUserWithOrgAndAddAsMember();
    const link = createPopulatedOrganizationInviteLink({
      creatorId: invitingUser.id,
      organizationId: organization.id,
    });
    await saveOrganizationInviteLinkToDatabase(link);

    // Generate email for the new user
    const testEmail = `test-${Date.now()}@example.com`;

    // Set the invite link cookie
    await setupInviteLinkCookie({
      link: { expiresAt: link.expiresAt, inviteLinkToken: link.token },
      page,
    });

    // Go to register confirm with token hash
    const tokenHash = stringifyTokenHashData({ email: testEmail });
    await page.goto(`${path}?token_hash=${tokenHash}`);

    // Verify redirect to onboarding page
    await expect(
      page.getByRole("heading", { level: 1, name: /create your account/i }),
    ).toBeVisible();
    expect(getPath(page)).toEqual(`/onboarding/user-account`);

    // Verify the user account was created
    const userAccount = await retrieveUserAccountFromDatabaseByEmail(testEmail);
    expect(userAccount).not.toBeNull();
    expect(userAccount?.email).toEqual(testEmail);

    // Enter the account details
    const { name } = createPopulatedUserAccount();
    await page.getByRole("textbox", { name: /name/i }).fill(name);
    await page.getByRole("button", { name: /continue/i }).click();

    // Verify success toast
    await expect(
      page.getByRole("heading", { level: 1, name: /dashboard/i }),
    ).toBeVisible();
    expect(getPath(page)).toEqual(
      `/organizations/${organization.slug}/dashboard`,
    );
    await expect(
      page
        .getByRole("region", {
          name: /notifications/i,
        })
        .getByText(/successfully joined organization/i),
    ).toBeVisible();

    // Verify invite link cookie is cleared
    const cookies = await page.context().cookies();
    const inviteLinkCookie = cookies.find(
      (cookie) => cookie.name === INVITE_LINK_INFO_SESSION_NAME,
    );
    expect(inviteLinkCookie).toBeUndefined();

    // Cleanup
    if (userAccount) {
      await deleteUserAccountFromDatabaseById(userAccount.id);
    }
    await teardownOrganizationAndMember({ organization, user: invitingUser });
  });

  test("given: a logged in user, should: redirect to organizations page", async ({
    page,
  }) => {
    // Create a test user account.
    const { user, organization } = await createUserWithOrgAndAddAsMember();

    // Log in the user using cookies.
    await loginByCookie({ page, user });

    // Navigate to the register-confirm page with any token.
    await page.goto(`${path}?token_hash=any_token`);

    // Verify the user is redirected to the organizations page.
    expect(getPath(page)).toEqual(
      `/organizations/${organization.slug}/dashboard`,
    );

    // Clean up.
    await teardownOrganizationAndMember({ organization, user });
  });

  test("given: a new user with an active email invite cookie, should: create their account, add them to the organization, and show success toast", async ({
    page,
  }) => {
    // Generate email for the new user
    const testEmail = `test-${Date.now()}@example.com`;

    // Create organization and email invite bound to the new user's email
    const { organization, user: invitingUser } =
      await createUserWithOrgAndAddAsMember();
    const invite = createPopulatedOrganizationEmailInviteLink({
      email: testEmail,
      invitedById: invitingUser.id,
      organizationId: organization.id,
    });
    await saveOrganizationEmailInviteLinkToDatabase(invite);

    // Set the email invite cookie
    await setupEmailInviteCookie({
      invite: { emailInviteToken: invite.token, expiresAt: invite.expiresAt },
      page,
    });

    // Go to register confirm with token hash
    const tokenHash = stringifyTokenHashData({ email: testEmail });
    await page.goto(`${path}?token_hash=${tokenHash}`);

    // Verify redirect to onboarding page
    await expect(
      page.getByRole("heading", { level: 1, name: /create your account/i }),
    ).toBeVisible();
    expect(getPath(page)).toEqual(
      getAcceptedEmailInviteOnboardingPath(organization.slug),
    );

    // Verify the user account was created
    const userAccount = await retrieveUserAccountFromDatabaseByEmail(testEmail);
    expect(userAccount).not.toBeNull();
    expect(userAccount?.email).toEqual(testEmail);

    // Enter the account details
    const { name } = createPopulatedUserAccount();
    await page.getByRole("textbox", { name: /name/i }).fill(name);
    await page.getByRole("button", { name: /continue/i }).click();

    // Verify success toast
    await expect(
      page.getByRole("heading", { level: 1, name: /dashboard/i }),
    ).toBeVisible();
    expect(getPath(page)).toEqual(
      `/organizations/${organization.slug}/dashboard`,
    );
    await expect(
      page
        .getByRole("region", {
          name: /notifications/i,
        })
        .getByText(/successfully joined organization/i),
    ).toBeVisible();

    // Verify email invite cookie is cleared
    const cookies = await page.context().cookies();
    const emailInviteCookie = cookies.find(
      (cookie) => cookie.name === EMAIL_INVITE_INFO_SESSION_NAME,
    );
    expect(emailInviteCookie).toBeUndefined();

    // Cleanup
    if (userAccount) {
      await deleteUserAccountFromDatabaseById(userAccount.id);
    }
    await teardownOrganizationAndMember({ organization, user: invitingUser });
  });

  test("given: an OTP registration whose verified email does not match the active email invite, should: reject the invite and clear its cookie", async ({
    page,
  }) => {
    const acceptingIdentity = createPopulatedUserAccount();
    const { organization, user: invitingUser } =
      await createUserWithOrgAndAddAsMember();
    const invite = createPopulatedOrganizationEmailInviteLink({
      email: "intended-recipient@example.com",
      invitedById: invitingUser.id,
      organizationId: organization.id,
    });
    await saveOrganizationEmailInviteLinkToDatabase(invite);

    await setupEmailInviteCookie({
      invite: { emailInviteToken: invite.token, expiresAt: invite.expiresAt },
      page,
    });

    const tokenHash = stringifyTokenHashData({
      email: acceptingIdentity.email,
      id: acceptingIdentity.supabaseUserId,
    });
    await page.goto(`${path}?token_hash=${tokenHash}`);

    await expect(
      page.getByRole("heading", { level: 1, name: /create your account/i }),
    ).toBeVisible();
    expect(getPath(page)).toEqual("/onboarding/user-account");

    const userAccount = await retrieveUserAccountFromDatabaseByEmail(
      acceptingIdentity.email,
    );
    expect(userAccount).not.toBeNull();
    const membership = userAccount
      ? await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
          { organizationId: organization.id, userId: userAccount.id },
        )
      : undefined;
    expect(membership).toBeNull();

    const storedInvite = await retrieveEmailInviteLinkFromDatabaseById(
      invite.id,
    );
    expect(storedInvite?.deactivatedAt).toBeNull();

    const cookies = await page.context().cookies();
    expect(
      cookies.find((cookie) => cookie.name === EMAIL_INVITE_INFO_SESSION_NAME),
    ).toBeUndefined();

    if (userAccount) {
      await deleteUserAccountFromDatabaseById(userAccount.id);
    }
    await teardownOrganizationAndMember({ organization, user: invitingUser });
  });

  test("given: a matching new user who reaches onboarding, should: prevent another account from reusing the email invite", async ({
    page,
  }) => {
    const intendedIdentity = createPopulatedUserAccount();
    const otherIdentity = createPopulatedUserAccount();
    const { organization, user: invitingUser } =
      await createUserWithOrgAndAddAsMember();
    const invite = createPopulatedOrganizationEmailInviteLink({
      email: intendedIdentity.email,
      invitedById: invitingUser.id,
      organizationId: organization.id,
    });
    await saveOrganizationEmailInviteLinkToDatabase(invite);

    await setupEmailInviteCookie({
      invite: { emailInviteToken: invite.token, expiresAt: invite.expiresAt },
      page,
    });
    const intendedTokenHash = stringifyTokenHashData({
      email: intendedIdentity.email,
      id: intendedIdentity.supabaseUserId,
    });
    await page.goto(`${path}?token_hash=${intendedTokenHash}`);

    await expect(
      page.getByRole("heading", { level: 1, name: /create your account/i }),
    ).toBeVisible();
    expect(getPath(page)).toEqual(
      getAcceptedEmailInviteOnboardingPath(organization.slug),
    );

    const intendedUser = await retrieveUserAccountFromDatabaseByEmail(
      intendedIdentity.email,
    );
    const intendedMembership = intendedUser
      ? await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
          { organizationId: organization.id, userId: intendedUser.id },
        )
      : null;
    expect(intendedMembership).not.toBeNull();

    const consumedInvite = await retrieveEmailInviteLinkFromDatabaseById(
      invite.id,
    );
    expect(consumedInvite?.deactivatedAt).not.toBeNull();

    await page.context().clearCookies();
    await setupEmailInviteCookie({
      invite: { emailInviteToken: invite.token, expiresAt: invite.expiresAt },
      page,
    });
    const otherTokenHash = stringifyTokenHashData({
      email: otherIdentity.email,
      id: otherIdentity.supabaseUserId,
    });
    await page.goto(`${path}?token_hash=${otherTokenHash}`);

    await expect(
      page.getByRole("heading", { level: 1, name: /create your account/i }),
    ).toBeVisible();
    expect(getPath(page)).toEqual("/onboarding/user-account");

    const otherUser = await retrieveUserAccountFromDatabaseByEmail(
      otherIdentity.email,
    );
    const otherMembership = otherUser
      ? await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
          { organizationId: organization.id, userId: otherUser.id },
        )
      : undefined;
    expect(otherMembership).toBeNull();

    const cookies = await page.context().cookies();
    expect(
      cookies.find((cookie) => cookie.name === EMAIL_INVITE_INFO_SESSION_NAME),
    ).toBeUndefined();

    if (intendedUser) {
      await deleteUserAccountFromDatabaseById(intendedUser.id);
    }
    if (otherUser) {
      await deleteUserAccountFromDatabaseById(otherUser.id);
    }
    await teardownOrganizationAndMember({ organization, user: invitingUser });
  });

  test("given: a new user with an active invite link cookie for an organization that is already full, should: NOT let the user join the organization and show a toast with a message letting the user know what is happening", async ({
    page,
  }) => {
    // Create organization with the low tier plan (1 seat limit)
    const { organization, user: invitingUser } =
      await createUserWithOrgAndAddAsMember({
        lookupKey: priceLookupKeysByTierAndInterval.low.annual,
      });

    // Create an invite link for this organization
    const link = createPopulatedOrganizationInviteLink({
      creatorId: invitingUser.id,
      organizationId: organization.id,
    });
    await saveOrganizationInviteLinkToDatabase(link);

    // Generate email for the new user
    const testEmail = `test-${Date.now()}@example.com`;

    // Set the invite link cookie
    await setupInviteLinkCookie({
      link: { expiresAt: link.expiresAt, inviteLinkToken: link.token },
      page,
    });

    // Go to register confirm with token hash
    const tokenHash = stringifyTokenHashData({ email: testEmail });
    await page.goto(`${path}?token_hash=${tokenHash}`);

    // Verify toast message
    await expect(
      page
        .getByRole("region", { name: /notifications/i })
        .getByText(/organization has reached its member limit/i),
    ).toBeVisible();

    // Verify we're still on the same page (not redirected)
    expect(getPath(page)).toEqual(
      `${href("/organizations/invite-link")}?token=${link.token}`,
    );

    // Verify the user account was created
    const userAccount = await retrieveUserAccountFromDatabaseByEmail(testEmail);
    expect(userAccount).not.toBeNull();
    expect(userAccount?.email).toEqual(testEmail);

    // Cleanup
    if (userAccount) {
      await deleteUserAccountFromDatabaseById(userAccount.id);
    }
    await teardownOrganizationAndMember({ organization, user: invitingUser });
  });

  test("given: a new user with an active email invite cookie for an organization that is already full, should: NOT let the user join the organization and show a toast with a message letting the user know what is happening", async ({
    page,
  }) => {
    // Create organization with the low tier plan (1 seat limit)
    const { organization, user: invitingUser } =
      await createUserWithOrgAndAddAsMember({
        lookupKey: priceLookupKeysByTierAndInterval.low.annual,
      });

    // Generate email for the new user
    const testEmail = `test-${Date.now()}@example.com`;

    // Create an email invite for this organization bound to the new user's
    // email
    const invite = createPopulatedOrganizationEmailInviteLink({
      email: testEmail,
      invitedById: invitingUser.id,
      organizationId: organization.id,
    });
    await saveOrganizationEmailInviteLinkToDatabase(invite);

    // Set the email invite cookie
    await setupEmailInviteCookie({
      invite: { emailInviteToken: invite.token, expiresAt: invite.expiresAt },
      page,
    });

    // Go to register confirm with token hash
    const tokenHash = stringifyTokenHashData({ email: testEmail });
    await page.goto(`${path}?token_hash=${tokenHash}`);

    // Verify toast message
    await expect(
      page
        .getByRole("region", { name: /notifications/i })
        .getByText(/organization has reached its member limit/i),
    ).toBeVisible();

    // Verify we're still on the same page (not redirected)
    expect(getPath(page)).toEqual(
      `${href("/organizations/email-invite")}?token=${invite.token}`,
    );

    // Verify the user account was created
    const userAccount = await retrieveUserAccountFromDatabaseByEmail(testEmail);
    expect(userAccount).not.toBeNull();
    expect(userAccount?.email).toEqual(testEmail);

    // Cleanup
    if (userAccount) {
      await deleteUserAccountFromDatabaseById(userAccount.id);
    }
    await teardownOrganizationAndMember({ organization, user: invitingUser });
  });
});
