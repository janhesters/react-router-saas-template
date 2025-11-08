/** biome-ignore-all lint/style/noNonNullAssertion: test code */
import { describe, expect, onTestFinished, test } from "vitest";

import { action } from "./user-account";
import { ONBOARDING_USER_ACCOUNT_INTENT } from "~/features/onboarding/user-account/onboarding-user-account-constants";
import { createEmailInviteInfoCookie } from "~/features/organizations/accept-email-invite/accept-email-invite-session.server";
import { createInviteLinkInfoCookie } from "~/features/organizations/accept-invite-link/accept-invite-link-session.server";
import { saveOrganizationEmailInviteLinkToDatabase } from "~/features/organizations/organizations-email-invite-link-model.server";
import {
  createPopulatedOrganization,
  createPopulatedOrganizationEmailInviteLink,
  createPopulatedOrganizationInviteLink,
} from "~/features/organizations/organizations-factories.server";
import { saveOrganizationInviteLinkToDatabase } from "~/features/organizations/organizations-invite-link-model.server";
import {
  addMembersToOrganizationInDatabaseById,
  deleteOrganizationFromDatabaseById,
  saveOrganizationToDatabase,
  saveOrganizationWithOwnerToDatabase,
} from "~/features/organizations/organizations-model.server";
import { createPopulatedUserAccount } from "~/features/user-accounts/user-accounts-factories.server";
import {
  deleteUserAccountFromDatabaseById,
  saveUserAccountToDatabase,
} from "~/features/user-accounts/user-accounts-model.server";
import { supabaseHandlers } from "~/test/mocks/handlers/supabase";
import { setupMockServerLifecycle } from "~/test/msw-test-utils";
import {
  createAuthenticatedRequest,
  createAuthTestContextProvider,
} from "~/test/test-utils";
import { toFormData } from "~/utils/to-form-data";
import { getToast } from "~/utils/toast.server";

const createUrl = () => `http://localhost:3000/onboarding/user-account`;

const pattern = "/onboarding/user-account";

async function sendAuthenticatedRequest({
  userAccount,
  formData,
  headers,
}: {
  userAccount: ReturnType<typeof createPopulatedUserAccount>;
  formData: FormData;
  headers?: Headers;
}) {
  const request = await createAuthenticatedRequest({
    formData,
    headers,
    method: "POST",
    url: createUrl(),
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

async function setup(userAccount = createPopulatedUserAccount()) {
  await saveUserAccountToDatabase(userAccount);
  onTestFinished(async () => {
    await deleteUserAccountFromDatabaseById(userAccount.id);
  });

  return { userAccount };
}

setupMockServerLifecycle(...supabaseHandlers);

describe("/onboarding/user-account route action", () => {
  test("given: an unauthenticated request, should: throw a redirect to the login page", async () => {
    expect.assertions(2);

    const request = new Request(createUrl(), {
      body: toFormData({}),
      method: "POST",
    });
    const params = {};

    try {
      await action({
        context: await createAuthTestContextProvider({
          params,
          pattern,
          request,
        }),
        params,
        request,
        unstable_pattern: pattern,
      });
    } catch (error) {
      if (error instanceof Response) {
        expect(error.status).toEqual(302);
        expect(error.headers.get("Location")).toEqual(
          `/login?redirectTo=%2Fonboarding%2Fuser-account`,
        );
      }
    }
  });

  test("given: a user who has completed onboarding, should: redirect to organizations page", async () => {
    expect.assertions(2);

    const { userAccount } = await setup();
    const organization = await saveOrganizationWithOwnerToDatabase({
      organization: createPopulatedOrganization(),
      userId: userAccount.id,
    });
    onTestFinished(async () => {
      await deleteOrganizationFromDatabaseById(organization.id);
    });

    try {
      await sendAuthenticatedRequest({ formData: toFormData({}), userAccount });
    } catch (error) {
      if (error instanceof Response) {
        expect(error.status).toEqual(302);
        expect(error.headers.get("Location")).toEqual(
          `/organizations/${organization.slug}`,
        );
      }
    }
  });

  describe(`${ONBOARDING_USER_ACCOUNT_INTENT} intent`, () => {
    const intent = ONBOARDING_USER_ACCOUNT_INTENT;

    test("given: a valid name for a user without organizations, should: update name and redirect to organization onboarding", async () => {
      const userAccount = createPopulatedUserAccount({ name: "" });
      await saveUserAccountToDatabase(userAccount);
      onTestFinished(async () => {
        await deleteUserAccountFromDatabaseById(userAccount.id);
      });

      const formData = toFormData({ intent, name: "Test User" });

      const response = (await sendAuthenticatedRequest({
        formData,
        userAccount,
      })) as Response;

      expect(response.status).toEqual(302);
      expect(response.headers.get("Location")).toEqual(
        "/onboarding/organization",
      );
    });

    test("given: a valid name for a user without organizations, should: update name and redirect to organization onboarding", async () => {
      const userAccount = createPopulatedUserAccount({
        imageUrl: "",
        name: "",
      });
      await saveUserAccountToDatabase(userAccount);
      onTestFinished(async () => {
        await deleteUserAccountFromDatabaseById(userAccount.id);
      });

      const { name } = createPopulatedUserAccount();
      const formData = toFormData({ intent, name });

      const response = (await sendAuthenticatedRequest({
        formData,
        userAccount,
      })) as Response;

      expect(response.status).toEqual(302);
      expect(response.headers.get("Location")).toEqual(
        "/onboarding/organization",
      );
    });

    test.each([
      {
        body: { intent },
        expected: {
          data: {
            result: {
              error: {
                fieldErrors: {
                  name: ["Invalid input: expected string, received undefined"],
                },
              },
            },
          },
          init: { status: 400 },
        },
        given: "no name provided",
      },
      {
        body: { intent, name: "a" },
        expected: {
          data: {
            result: {
              error: {
                fieldErrors: {
                  name: ["onboarding:userAccount.errors.nameMin"],
                },
              },
            },
          },
          init: { status: 400 },
        },
        given: "a name that is too short (1 character)",
      },
      {
        body: { intent, name: "a".repeat(129) },
        expected: {
          data: {
            result: {
              error: {
                fieldErrors: {
                  name: ["onboarding:userAccount.errors.nameMax"],
                },
              },
            },
          },
          init: { status: 400 },
        },
        given: "a name that is too long (129 characters)",
      },
      {
        body: { intent, name: "   " },
        expected: {
          data: {
            result: {
              error: {
                fieldErrors: {
                  name: ["onboarding:userAccount.errors.nameMin"],
                },
              },
            },
          },
          init: { status: 400 },
        },
        given: "a name with only whitespace",
      },
      {
        body: { intent, name: "  a " },
        expected: {
          data: {
            result: {
              error: {
                fieldErrors: {
                  name: ["onboarding:userAccount.errors.nameMin"],
                },
              },
            },
          },
          init: { status: 400 },
        },
        given: "a too short name with whitespace",
      },
    ])(
      "given: $given, should: return a 400 status code with an error message",
      async ({ body, expected }) => {
        const userAccount = createPopulatedUserAccount({ name: "" });
        await saveUserAccountToDatabase(userAccount);
        onTestFinished(async () => {
          await deleteUserAccountFromDatabaseById(userAccount.id);
        });

        const formData = toFormData(body);

        const actual = await sendAuthenticatedRequest({
          formData,
          userAccount,
        });

        expect(actual).toMatchObject(expected);
      },
    );

    test("given: a user who needs onboarding with a invite link session info in the request, should: redirect to the organizations dashboard page and show a toast", async () => {
      // The user who was invited and just picked their name.
      const { userAccount } = await setup(
        createPopulatedUserAccount({ name: "" }),
      );
      // The user who created the invite link.
      const { userAccount: invitingUser } = await setup();
      // The organization that the user was invited to.
      const organization = createPopulatedOrganization();
      await saveOrganizationToDatabase(organization);
      onTestFinished(async () => {
        await deleteOrganizationFromDatabaseById(organization.id);
      });
      // Add the users as members of the organization.
      await addMembersToOrganizationInDatabaseById({
        id: organization.id,
        members: [userAccount.id, invitingUser.id],
      });
      // The invite link that was used to invite the user.
      const inviteLink = createPopulatedOrganizationInviteLink({
        creatorId: invitingUser.id,
        organizationId: organization.id,
      });
      await saveOrganizationInviteLinkToDatabase(inviteLink);
      const cookie = await createInviteLinkInfoCookie({
        expiresAt: inviteLink.expiresAt,
        inviteLinkToken: inviteLink.token,
      });
      const headers = new Headers({ Cookie: cookie });

      const formData = toFormData({ intent, name: "Test User" });

      const response = (await sendAuthenticatedRequest({
        formData,
        headers,
        userAccount,
      })) as Response;

      expect(response.status).toEqual(302);
      expect(response.headers.get("Location")).toEqual(
        `/organizations/${organization.slug}/dashboard`,
      );

      const setCookie = response.headers.get("Set-Cookie")!;
      const toastMatch = /__toast=[^;]+/.exec(setCookie);
      const maybeToast = toastMatch?.[0] ?? "";
      const { toast } = await getToast(
        new Request(createUrl(), {
          headers: { cookie: maybeToast ?? "" },
        }),
      );
      const escapedName = organization.name.replace("'", "&#39;");
      expect(toast).toMatchObject({
        description: `You are now a member of ${escapedName}`,
        id: expect.any(String) as string,
        title: "Successfully joined organization",
        type: "success",
      });
    });

    test("given: a user who needs onboarding with an email invite session info in the request, should: redirect to the organizations dashboard page and show a toast", async () => {
      // The invited user who just picked their name
      const { userAccount } = await setup(
        createPopulatedUserAccount({ name: "" }),
      );
      // The user who created the email invite
      const { userAccount: invitingUser } = await setup();
      // Create and save the organization
      const organization = createPopulatedOrganization();
      await saveOrganizationToDatabase(organization);
      onTestFinished(async () => {
        await deleteOrganizationFromDatabaseById(organization.id);
      });
      // Add both users as members (inviter is owner by default)
      await addMembersToOrganizationInDatabaseById({
        id: organization.id,
        members: [invitingUser.id, userAccount.id],
      });
      // Create and save the email invite
      const emailInvite = createPopulatedOrganizationEmailInviteLink({
        invitedById: invitingUser.id,
        organizationId: organization.id,
      });
      await saveOrganizationEmailInviteLinkToDatabase(emailInvite);
      // Generate the Set-Cookie header for the email invite session
      const cookie = await createEmailInviteInfoCookie({
        emailInviteToken: emailInvite.token,
        expiresAt: emailInvite.expiresAt,
      });
      const headers = new Headers({ Cookie: cookie });

      // Form data with intent and name filled
      const formData = toFormData({ intent, name: "Test User" });

      const response = (await sendAuthenticatedRequest({
        formData,
        headers,
        userAccount,
      })) as Response;

      expect(response.status).toEqual(302);
      expect(response.headers.get("Location")).toEqual(
        `/organizations/${organization.slug}/dashboard`,
      );

      // Extract the toast cookie
      const setCookie = response.headers.get("Set-Cookie")!;
      const toastMatch = /__toast=[^;]+/.exec(setCookie);
      const maybeToast = toastMatch?.[0] ?? "";
      const { toast } = await getToast(
        new Request(createUrl(), {
          headers: { cookie: maybeToast ?? "" },
        }),
      );
      const escapedName = organization.name.replace("'", "&#39;");
      expect(toast).toMatchObject({
        description: `You are now a member of ${escapedName}`,
        id: expect.any(String) as string,
        title: "Successfully joined organization",
        type: "success",
      });
    });
  });
});
