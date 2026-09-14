/* oxlint-disable typescript/no-non-null-assertion -- test code */
import { HttpResponse, http } from "msw";
import { describe, expect, onTestFinished, test } from "vitest";

import { action } from "./user-account";
import { ONBOARDING_USER_ACCOUNT_INTENT } from "~/features/onboarding/user-account/onboarding-user-account-constants";
import { getAcceptedEmailInviteOnboardingPath } from "~/features/organizations/accept-email-invite/accept-email-invite-helpers.server";
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
  retrieveUserAccountFromDatabaseById,
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

const createUrl = (acceptedOrganizationSlug?: string) =>
  `http://localhost:3000${
    acceptedOrganizationSlug
      ? getAcceptedEmailInviteOnboardingPath(acceptedOrganizationSlug)
      : "/onboarding/user-account"
  }`;

const pattern = "/onboarding/user-account";

async function sendAuthenticatedRequest({
  acceptedOrganizationSlug,
  formData,
  headers,
  userAccount,
}: {
  acceptedOrganizationSlug?: string;
  formData: FormData;
  headers?: Headers;
  userAccount: ReturnType<typeof createPopulatedUserAccount>;
}) {
  const request = await createAuthenticatedRequest({
    formData,
    headers,
    method: "POST",
    url: createUrl(acceptedOrganizationSlug),
    user: userAccount,
  });
  const params = {};

  return await action({
    context: await createAuthTestContextProvider({ params, pattern, request }),
    params,
    pattern,
    request,
    url: new URL(request.url),
  });
}

async function setup(userAccount = createPopulatedUserAccount()) {
  await saveUserAccountToDatabase(userAccount);
  onTestFinished(async () => {
    await deleteUserAccountFromDatabaseById(userAccount.id);
  });

  return { userAccount };
}

const server = setupMockServerLifecycle(...supabaseHandlers);

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
        pattern,
        request,
        url: new URL(request.url),
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

    test.each(["stored", "OAuth"])(
      "given: no uploaded photo and an existing %s image, should: retain its URL while saving the name",
      async (source) => {
        const userAccount = createPopulatedUserAccount({ name: "" });
        userAccount.imageUrl =
          source === "stored"
            ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/app-images/user-avatars/${userAccount.id}.png`
            : "https://oauth.example.com/avatar.png";
        await setup(userAccount);

        const response = await sendAuthenticatedRequest({
          formData: toFormData({ intent, name: "Test User" }),
          userAccount,
        });

        expect(response).toMatchObject({ status: 302 });
        expect(
          await retrieveUserAccountFromDatabaseById(userAccount.id),
        ).toMatchObject({ imageUrl: userAccount.imageUrl, name: "Test User" });
      },
    );

    test("given: overlapping onboarding photo uploads, should: reject the stale publication and preserve the winner's bytes", async () => {
      const { userAccount } = await setup(
        createPopulatedUserAccount({ imageUrl: "", name: "" }),
      );
      const publicPrefix = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/app-images/`;
      const s3Prefix = `${process.env.STORAGE_ENDPOINT}/app-images/`;
      const objects = new Map<string, string>();
      const uploadedKeys: string[] = [];
      let markFirstUploadStarted = () => {};
      const firstUploadStarted = new Promise<void>((resolve) => {
        markFirstUploadStarted = resolve;
      });
      let resumeFirstUpload = () => {};
      const firstUploadGate = new Promise<void>((resolve) => {
        resumeFirstUpload = resolve;
      });
      onTestFinished(resumeFirstUpload);

      server.use(
        http.put(`${s3Prefix}*`, async ({ request }) => {
          const key = new URL(request.url).pathname.slice(
            new URL(s3Prefix).pathname.length,
          );
          const bytes = await request.text();
          uploadedKeys.push(key);
          if (bytes === "stale image bytes") {
            markFirstUploadStarted();
            await firstUploadGate;
          }
          objects.set(key, bytes);
          return new HttpResponse(null, {
            headers: { ETag: '"image-etag"' },
            status: 200,
          });
        }),
        http.delete(
          `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/app-images`,
          async ({ request }) => {
            const { prefixes } = (await request.json()) as {
              prefixes: string[];
            };
            for (const key of prefixes) objects.delete(key);
            return HttpResponse.json(prefixes.map((name) => ({ name })));
          },
        ),
        http.get(`${publicPrefix}*`, ({ request }) => {
          const key = new URL(request.url).pathname.slice(
            new URL(publicPrefix).pathname.length,
          );
          const bytes = objects.get(key);
          return new HttpResponse(bytes ?? "Missing object", {
            status: bytes === undefined ? 404 : 200,
          });
        }),
      );

      const sendImage = (bytes: string, name: string) =>
        sendAuthenticatedRequest({
          formData: toFormData({
            image: new File([bytes], "avatar.png", { type: "image/png" }),
            intent,
            name,
          }),
          userAccount,
        });

      const staleRequest = sendImage("stale image bytes", "Stale User");
      await firstUploadStarted;
      try {
        const winner = await sendImage("winning image bytes", "Winning User");
        expect(winner).toMatchObject({ status: 302 });
      } finally {
        resumeFirstUpload();
      }
      const staleResponse = await staleRequest;

      expect(staleResponse).toMatchObject({
        data: {
          result: {
            error: {
              fieldErrors: {
                image: [
                  "Your avatar changed during this upload. Refresh the page and try again.",
                ],
              },
            },
          },
        },
        init: { status: 409 },
      });
      const published = await retrieveUserAccountFromDatabaseById(
        userAccount.id,
      );
      expect(published).toMatchObject({ name: "Winning User" });
      expect(published!.imageUrl).toEqual(`${publicPrefix}${uploadedKeys[1]}`);
      const image = await fetch(published!.imageUrl);
      expect(image.status).toEqual(200);
      expect(await image.text()).toEqual("winning image bytes");
      expect(new Set(uploadedKeys).size).toEqual(2);
      expect(objects.size).toEqual(1);
    });

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
      expect(toast).toMatchObject({
        description: `You are now a member of ${organization.name}`,
        id: expect.any(String) as string,
        title: "Successfully joined organization",
        type: "success",
      });
    });

    test("given: a user with multiple memberships who needs onboarding after their email invite was consumed, should: use the accepted organization hint and show the correct toast", async () => {
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
        deactivatedAt: new Date(),
        email: userAccount.email,
        invitedById: invitingUser.id,
        organizationId: organization.id,
      });
      await saveOrganizationEmailInviteLinkToDatabase(emailInvite);
      // A second membership ensures onboarding cannot safely infer the
      // accepted organization from array order.
      const unrelatedOrganization = createPopulatedOrganization();
      await saveOrganizationToDatabase(unrelatedOrganization);
      onTestFinished(async () => {
        await deleteOrganizationFromDatabaseById(unrelatedOrganization.id);
      });
      await addMembersToOrganizationInDatabaseById({
        id: unrelatedOrganization.id,
        members: [userAccount.id],
      });

      // Form data with intent and name filled
      const formData = toFormData({ intent, name: "Test User" });

      const response = (await sendAuthenticatedRequest({
        acceptedOrganizationSlug: organization.slug,
        formData,
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
      expect(toast).toMatchObject({
        description: `You are now a member of ${organization.name}`,
        id: expect.any(String) as string,
        title: "Successfully joined organization",
        type: "success",
      });
    });
  });
});
