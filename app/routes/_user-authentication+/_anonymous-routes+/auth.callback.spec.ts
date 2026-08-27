import { Buffer } from "node:buffer";
import { expect, onTestFinished, test } from "vitest";

import { loader } from "./auth.callback";
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
  stringifyAuthCodeData,
  supabaseHandlers,
} from "~/test/mocks/handlers/supabase";
import { setupMockServerLifecycle } from "~/test/msw-test-utils";
import { setupUserWithTrialOrgAndAddAsMember } from "~/test/server-test-utils";
import { createTestContextProvider } from "~/test/test-utils";

const pattern = "/auth/callback";

setupMockServerLifecycle(...supabaseHandlers);

test("given: an OAuth callback with a mismatched email, should: reject the invite without creating a membership", async () => {
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
  const code = stringifyAuthCodeData({
    email: acceptingUser.email,
    id: acceptingUser.supabaseUserId,
    provider: "google",
  });
  const projectReference =
    /https:\/\/([^.]+)/.exec(process.env.VITE_SUPABASE_URL)?.[1] ?? "default";
  const codeVerifier = `base64-${Buffer.from(
    JSON.stringify("test-code-verifier"),
  ).toString("base64url")}`;
  const cookies = [
    inviteHeaders.get("Set-Cookie") ?? "",
    `sb-${projectReference}-auth-token-code-verifier=${codeVerifier}`,
  ].join("; ");
  const request = new Request(
    `http://localhost:3000/auth/callback?code=${encodeURIComponent(code)}`,
    { headers: { Cookie: cookies } },
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
