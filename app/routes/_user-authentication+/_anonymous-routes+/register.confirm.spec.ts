import { expect, onTestFinished, test } from "vitest";

import { loader } from "./register.confirm";
import { getAcceptedEmailInviteOnboardingPath } from "~/features/organizations/accept-email-invite/accept-email-invite-helpers.server";
import { createEmailInviteInfoHeaders } from "~/features/organizations/accept-email-invite/accept-email-invite-session.server";
import { retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId } from "~/features/organizations/organization-membership-model.server";
import {
  retrieveEmailInviteLinkFromDatabaseById,
  saveOrganizationEmailInviteLinkToDatabase,
} from "~/features/organizations/organizations-email-invite-link-model.server";
import { createPopulatedOrganizationEmailInviteLink } from "~/features/organizations/organizations-factories.server";
import { createPopulatedUserAccount } from "~/features/user-accounts/user-accounts-factories.server";
import {
  deleteUserAccountFromDatabaseById,
  retrieveUserAccountFromDatabaseBySupabaseUserId,
} from "~/features/user-accounts/user-accounts-model.server";
import { anonymousMiddleware } from "~/features/user-authentication/user-authentication-middleware.server";
import {
  stringifyTokenHashData,
  supabaseHandlers,
} from "~/test/mocks/handlers/supabase";
import { setupMockServerLifecycle } from "~/test/msw-test-utils";
import { setupUserWithTrialOrgAndAddAsMember } from "~/test/server-test-utils";
import { createTestContextProvider } from "~/test/test-utils";

const pattern = "/register/confirm";

setupMockServerLifecycle(...supabaseHandlers);

function cleanupCreatedUser(supabaseUserId: string) {
  onTestFinished(async () => {
    const user =
      await retrieveUserAccountFromDatabaseBySupabaseUserId(supabaseUserId);
    if (user) {
      await deleteUserAccountFromDatabaseById(user.id);
    }
  });
}

async function sendRequest({
  cookie,
  email,
  id,
}: {
  cookie: string;
  email: string;
  id: string;
}) {
  const tokenHash = stringifyTokenHashData({ email, id });
  const request = new Request(
    `http://localhost:3000/register/confirm?token_hash=${encodeURIComponent(tokenHash)}`,
    { headers: { Cookie: cookie } },
  );
  const params = {};

  return (await loader({
    context: await createTestContextProvider({
      middlewares: [anonymousMiddleware],
      params,
      pattern,
      request,
    }),
    params,
    pattern,
    request,
    url: new URL(request.url),
  })) as Response;
}

test("given: an OTP registration confirmation with a mismatched email, should: reject the invite without creating a membership", async () => {
  const { organization, user: invitingUser } =
    await setupUserWithTrialOrgAndAddAsMember();
  const acceptingIdentity = createPopulatedUserAccount();
  cleanupCreatedUser(acceptingIdentity.supabaseUserId);
  const emailInvite = createPopulatedOrganizationEmailInviteLink({
    email: "intended-recipient@example.com",
    invitedById: invitingUser.id,
    organizationId: organization.id,
  });
  await saveOrganizationEmailInviteLinkToDatabase(emailInvite);
  const inviteHeaders = await createEmailInviteInfoHeaders({
    emailInviteToken: emailInvite.token,
    expiresAt: emailInvite.expiresAt,
  });

  const response = await sendRequest({
    cookie: inviteHeaders.get("Set-Cookie") ?? "",
    email: acceptingIdentity.email,
    id: acceptingIdentity.supabaseUserId,
  });

  expect(response.status).toEqual(302);
  expect(response.headers.get("Location")).toEqual("/onboarding");

  const createdUser = await retrieveUserAccountFromDatabaseBySupabaseUserId(
    acceptingIdentity.supabaseUserId,
  );
  const membership = createdUser
    ? await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
        { organizationId: organization.id, userId: createdUser.id },
      )
    : undefined;
  expect(membership).toEqual(null);

  const updatedInvite = await retrieveEmailInviteLinkFromDatabaseById(
    emailInvite.id,
  );
  expect(updatedInvite?.deactivatedAt).toEqual(null);
  expect(response.headers.get("Set-Cookie")).toContain("__email_invite_info=;");
});

test("given: a new matching user entering onboarding, should: prevent another account from reusing the invite", async () => {
  const { organization, user: invitingUser } =
    await setupUserWithTrialOrgAndAddAsMember();
  const intendedIdentity = createPopulatedUserAccount();
  const otherIdentity = createPopulatedUserAccount();
  cleanupCreatedUser(intendedIdentity.supabaseUserId);
  cleanupCreatedUser(otherIdentity.supabaseUserId);
  const emailInvite = createPopulatedOrganizationEmailInviteLink({
    email: intendedIdentity.email,
    invitedById: invitingUser.id,
    organizationId: organization.id,
  });
  await saveOrganizationEmailInviteLinkToDatabase(emailInvite);
  const inviteHeaders = await createEmailInviteInfoHeaders({
    emailInviteToken: emailInvite.token,
    expiresAt: emailInvite.expiresAt,
  });
  const cookie = inviteHeaders.get("Set-Cookie") ?? "";

  const firstResponse = await sendRequest({
    cookie,
    email: intendedIdentity.email,
    id: intendedIdentity.supabaseUserId,
  });
  expect(firstResponse.headers.get("Location")).toEqual(
    getAcceptedEmailInviteOnboardingPath(organization.slug),
  );

  const intendedUser = await retrieveUserAccountFromDatabaseBySupabaseUserId(
    intendedIdentity.supabaseUserId,
  );
  const intendedMembership = intendedUser
    ? await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
        { organizationId: organization.id, userId: intendedUser.id },
      )
    : undefined;
  expect(intendedMembership).not.toBeNull();

  const consumedInvite = await retrieveEmailInviteLinkFromDatabaseById(
    emailInvite.id,
  );
  expect(consumedInvite?.deactivatedAt).not.toBeNull();

  const secondResponse = await sendRequest({
    cookie,
    email: otherIdentity.email,
    id: otherIdentity.supabaseUserId,
  });
  expect(secondResponse.headers.get("Location")).toEqual("/onboarding");

  const otherUser = await retrieveUserAccountFromDatabaseBySupabaseUserId(
    otherIdentity.supabaseUserId,
  );
  const otherMembership = otherUser
    ? await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
        { organizationId: organization.id, userId: otherUser.id },
      )
    : undefined;
  expect(otherMembership).toEqual(null);
});
