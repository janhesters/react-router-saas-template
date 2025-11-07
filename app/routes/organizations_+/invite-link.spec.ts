import type { UserAccount } from "@prisma/client";
import { describe, expect, test } from "vitest";

import { action } from "./invite-link";
import { ACCEPT_INVITE_LINK_INTENT } from "~/features/organizations/accept-invite-link/accept-invite-link-constants";
import { getInviteLinkInfoFromSession } from "~/features/organizations/accept-invite-link/accept-invite-link-session.server";
import { retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId } from "~/features/organizations/organization-membership-model.server";
import { createPopulatedOrganizationInviteLink } from "~/features/organizations/organizations-factories.server";
import { saveOrganizationInviteLinkToDatabase } from "~/features/organizations/organizations-invite-link-model.server";
import { stripeHandlers } from "~/test/mocks/handlers/stripe";
import { supabaseHandlers } from "~/test/mocks/handlers/supabase";
import { setupMockServerLifecycle } from "~/test/msw-test-utils";
import { setupUserWithOrgAndAddAsMember } from "~/test/server-test-utils";
import {
  createAuthenticatedRequest,
  createAuthTestContextProvider,
  createTestContextProvider,
} from "~/test/test-utils";
import { badRequest } from "~/utils/http-responses.server";
import { toFormData } from "~/utils/to-form-data";
import { getToast } from "~/utils/toast.server";

const createUrl = (token?: string) =>
  `http://localhost:3000/organizations/invite-link${token ? `?token=${token}` : ""}`;

const pattern = "/organizations/invite-link";

const createBody = ({ intent = ACCEPT_INVITE_LINK_INTENT } = {}) => ({
  intent,
});

async function sendRequest({
  formData = toFormData(createBody()),
  token,
}: {
  formData?: FormData;
  token?: string;
}) {
  const url = createUrl(token);
  const request = new Request(url, { body: formData, method: "POST" });
  const params = {};

  return await action({
    context: await createTestContextProvider({ params, pattern, request }),
    params,
    request,
    unstable_pattern: pattern,
  });
}

async function sendAuthenticatedRequest({
  userAccount,
  formData = toFormData(createBody()),
  token,
}: {
  userAccount: UserAccount;
  formData?: FormData;
  token?: string;
}) {
  const url = createUrl(token);
  const request = await createAuthenticatedRequest({
    formData,
    method: "POST",
    url,
    user: userAccount,
  });
  const params = {};

  return await action({
    context: await createAuthTestContextProvider({ params, pattern, request }),
    params,
    request,
    unstable_pattern: pattern,
  });
}

async function setup() {
  const { organization, user } = await setupUserWithOrgAndAddAsMember();
  const { organization: otherOrganization, user: otherUser } =
    await setupUserWithOrgAndAddAsMember();
  const inviteLink = createPopulatedOrganizationInviteLink({
    creatorId: otherUser.id,
    organizationId: otherOrganization.id,
  });
  await saveOrganizationInviteLinkToDatabase(inviteLink);
  return { inviteLink, organization, otherOrganization, otherUser, user };
}

setupMockServerLifecycle(...supabaseHandlers, ...stripeHandlers);

describe("/organizations/invite-link route action", () => {
  describe("given: an unauthenticated request", () => {
    test("given: an invalid intent, should: return a 400 status code with an error message", async () => {
      const formData = toFormData({ intent: "invalid-intent" });

      const actual = await sendRequest({ formData });
      const expected = badRequest({
        result: {
          error: {
            fieldErrors: {
              intent: expect.arrayContaining([
                'Invalid input: expected "acceptInviteLink"',
              ]),
            },
          },
        },
      });

      expect(actual).toMatchObject(expected);
    });

    test("given: an unauthenticated request with no token, should: return a 400 response with an error message and a toast header", async () => {
      const actual = (await sendRequest({})) as ReturnType<typeof badRequest>;
      const expected = badRequest({ error: "Invalid token" });

      expect(actual.data).toEqual(expected.data);
      expect(actual.init?.status).toEqual(expected.init?.status);

      const maybeHeaders = (actual.init?.headers as Headers).get("Set-Cookie");
      const { toast } = await getToast(
        new Request(createUrl(), {
          headers: { cookie: maybeHeaders ?? "" },
        }),
      );
      expect(toast).toMatchObject({
        description: "The invite link is invalid or has expired",
        id: expect.any(String) as string,
        title: "Failed to accept invite",
        type: "error",
      });
    });

    test("given: an unauthenticated request with an invalid token, should: return a 400 response with an error message", async () => {
      const { token } = createPopulatedOrganizationInviteLink();

      const actual = (await sendRequest({ token })) as ReturnType<
        typeof badRequest
      >;
      const expected = badRequest({ error: "Invalid token" });

      expect(actual.data).toEqual(expected.data);
      expect(actual.init?.status).toEqual(expected.init?.status);

      const maybeHeaders = (actual.init?.headers as Headers).get("Set-Cookie");
      const { toast } = await getToast(
        new Request(createUrl(), {
          headers: { cookie: maybeHeaders ?? "" },
        }),
      );
      expect(toast).toMatchObject({
        description: "The invite link is invalid or has expired",
        id: expect.any(String) as string,
        title: "Failed to accept invite",
        type: "error",
      });
    });

    test("given: an unauthenticated request with valid token, should: redirect to register page and set the token the session cookie", async () => {
      const { inviteLink } = await setup();

      const response = (await sendRequest({
        token: inviteLink.token,
      })) as Response;

      expect(response.status).toEqual(302);
      expect(response.headers.get("Location")).toEqual("/register");
      const maybeHeaders = response.headers.get("Set-Cookie");
      const inviteLinkInfo = await getInviteLinkInfoFromSession(
        new Request(createUrl(), {
          headers: { cookie: maybeHeaders ?? "" },
        }),
      );
      expect(inviteLinkInfo).toMatchObject({
        inviteLinkToken: inviteLink.token,
      });
    });
  });

  describe("given: an authenticated request", () => {
    test("given: an invalid intent, should: return a 400 status code with an error message", async () => {
      const { user } = await setupUserWithOrgAndAddAsMember();
      const formData = toFormData({ intent: "invalid-intent" });

      const actual = await sendAuthenticatedRequest({
        formData,
        userAccount: user,
      });
      const expected = badRequest({
        result: {
          error: {
            fieldErrors: {
              intent: expect.arrayContaining([
                'Invalid input: expected "acceptInviteLink"',
              ]),
            },
          },
        },
      });

      expect(actual).toMatchObject(expected);
    });

    test("given: an authenticated request with invalid token, should: return a 400 response with an error message and a toast header", async () => {
      const { user } = await setupUserWithOrgAndAddAsMember();
      const { token } = createPopulatedOrganizationInviteLink();

      const actual = (await sendAuthenticatedRequest({
        token,
        userAccount: user,
      })) as ReturnType<typeof badRequest>;
      const expected = badRequest({ error: "Invalid token" });

      expect(actual.data).toEqual(expected.data);
      expect(actual.init?.status).toEqual(expected.init?.status);

      const maybeHeaders = (actual.init?.headers as Headers).get("Set-Cookie");
      const { toast } = await getToast(
        new Request(createUrl(), {
          headers: { cookie: maybeHeaders ?? "" },
        }),
      );
      expect(toast).toMatchObject({
        description: "The invite link is invalid or has expired",
        id: expect.any(String) as string,
        title: "Failed to accept invite",
        type: "error",
      });
    });

    test("given: an authenticated request with valid token for an organization the user is not a member of, should: add user as member and redirect to organization page", async () => {
      const { inviteLink, otherOrganization, user } = await setup();

      const actual = (await sendAuthenticatedRequest({
        token: inviteLink.token,
        userAccount: user,
      })) as Response;

      expect(actual.status).toEqual(302);
      expect(actual.headers.get("Location")).toEqual(
        `/organizations/${otherOrganization.slug}/dashboard`,
      );

      // Verify user was added as member
      const membership =
        await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
          {
            organizationId: otherOrganization.id,
            userId: user.id,
          },
        );
      expect(membership).toMatchObject({
        deactivatedAt: null,
        role: "member",
      });
    });

    test("given: an authenticated request with valid token for an organization the user is already a member of, should: redirect to organization page", async () => {
      const { organization, user } = await setupUserWithOrgAndAddAsMember();
      const inviteLink = createPopulatedOrganizationInviteLink({
        creatorId: user.id,
        organizationId: organization.id,
      });
      await saveOrganizationInviteLinkToDatabase(inviteLink);

      const actual = (await sendAuthenticatedRequest({
        token: inviteLink.token,
        userAccount: user,
      })) as Response;

      expect(actual.status).toEqual(302);
      expect(actual.headers.get("Location")).toEqual(
        `/organizations/${organization.slug}/dashboard`,
      );

      const maybeToast = actual.headers.get("Set-Cookie");
      const { toast } = await getToast(
        new Request(createUrl(), {
          headers: { cookie: maybeToast ?? "" },
        }),
      );
      const escapedName = organization.name.replace("'", "&#39;");
      expect(toast).toMatchObject({
        description: `You are already a member of ${escapedName}`,
        id: expect.any(String) as string,
        title: "Already a member",
        type: "info",
      });
    });
  });
});
