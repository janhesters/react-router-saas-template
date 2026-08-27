import { expect, onTestFinished, test } from "vitest";

import { loader } from "./login.confirm";
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
  saveUserAccountToDatabase,
} from "~/features/user-accounts/user-accounts-model.server";
import { anonymousMiddleware } from "~/features/user-authentication/user-authentication-middleware.server";
import {
  stringifyTokenHashData,
  supabaseHandlers,
} from "~/test/mocks/handlers/supabase";
import { setupMockServerLifecycle } from "~/test/msw-test-utils";
import { setupUserWithTrialOrgAndAddAsMember } from "~/test/server-test-utils";
import { createTestContextProvider } from "~/test/test-utils";

const pattern = "/login/confirm";

setupMockServerLifecycle(...supabaseHandlers);

test("given: an OTP login confirmation with a mismatched email, should: reject the invite without creating a membership", async () => {
  const { organization, user: invitingUser } =
    await setupUserWithTrialOrgAndAddAsMember();
  const acceptingUser = createPopulatedUserAccount();
  await saveUserAccountToDatabase(acceptingUser);
  onTestFinished(async () => {
    await deleteUserAccountFromDatabaseById(acceptingUser.id);
  });
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
  const tokenHash = stringifyTokenHashData({
    email: acceptingUser.email,
    id: acceptingUser.supabaseUserId,
  });
  const request = new Request(
    `http://localhost:3000/login/confirm?token_hash=${encodeURIComponent(tokenHash)}`,
    {
      headers: { Cookie: inviteHeaders.get("Set-Cookie") ?? "" },
    },
  );
  const params = {};

  const response = (await loader({
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

  expect(response.status).toEqual(302);
  expect(response.headers.get("Location")).toEqual("/organizations");

  const membership =
    await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId({
      organizationId: organization.id,
      userId: acceptingUser.id,
    });
  expect(membership).toEqual(null);

  const updatedInvite = await retrieveEmailInviteLinkFromDatabaseById(
    emailInvite.id,
  );
  expect(updatedInvite?.deactivatedAt).toEqual(null);
  expect(response.headers.get("Set-Cookie")).toContain("__email_invite_info=;");
});
