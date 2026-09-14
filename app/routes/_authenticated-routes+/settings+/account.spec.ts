import { parseSubmission, report } from "@conform-to/react/future";
import { createId } from "@paralleldrive/cuid2";
import { describe, expect, onTestFinished, test } from "vitest";

import { action, loader } from "./account";
import { priceLookupKeysByTierAndInterval } from "~/features/billing/billing-constants";
import { createPopulatedOrganization } from "~/features/organizations/organizations-factories.server";
import {
  addMembersToOrganizationInDatabaseById,
  saveOrganizationToDatabase,
} from "~/features/organizations/organizations-model.server";
import {
  DELETE_USER_ACCOUNT_INTENT,
  UPDATE_USER_ACCOUNT_INTENT,
} from "~/features/user-accounts/settings/account/account-settings-constants";
import {
  AVATAR_PATH_PREFIX,
  BUCKET_NAME,
} from "~/features/user-accounts/user-account-constants";
import { createPopulatedUserAccount } from "~/features/user-accounts/user-accounts-factories.server";
import {
  retrieveUserAccountFromDatabaseById,
  saveUserAccountToDatabase,
} from "~/features/user-accounts/user-accounts-model.server";
import type { UserAccount } from "~/generated/client";
import { OrganizationMembershipRole } from "~/generated/client";
import { stripeHandlers } from "~/test/mocks/handlers/stripe";
import { supabaseHandlers } from "~/test/mocks/handlers/supabase";
import { setupMockServerLifecycle } from "~/test/msw-test-utils";
import {
  createAuthenticatedRequest,
  createAuthTestContextProvider,
  createTestSubscriptionForUserAndOrganization,
} from "~/test/test-utils";
import { prisma } from "~/utils/database.server";
import type { DataWithResponseInit } from "~/utils/http-responses.server";
import { badRequest } from "~/utils/http-responses.server";
import { toFormData } from "~/utils/to-form-data";
import { getToast } from "~/utils/toast.server";

const createUrl = () => "http://localhost:3000/settings/account";

const pattern = "/settings/account";

async function sendAuthenticatedRequest({
  formData,
  user,
}: {
  formData: FormData;
  user: UserAccount;
}) {
  const request = await createAuthenticatedRequest({
    formData,
    method: "POST",
    url: createUrl(),
    user,
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

async function setup(user = createPopulatedUserAccount()) {
  await saveUserAccountToDatabase(user);

  onTestFinished(async () => {
    await prisma.accountDeletion.deleteMany({ where: { id: user.id } });
    await prisma.organizationDeletion.deleteMany({
      where: { requestedById: user.id },
    });
    await prisma.userAccount.deleteMany({ where: { id: user.id } });
  });

  return user;
}

const server = setupMockServerLifecycle(...supabaseHandlers, ...stripeHandlers);

test("given: a requester who lost their deletion status URL, should: list their own jobs in account settings without exposing cleanup internals", async () => {
  const user = await setup();
  const ownId = createId();
  const otherId = createId();
  onTestFinished(async () => {
    await prisma.organizationDeletion.deleteMany({
      where: { id: { in: [ownId, otherId] } },
    });
  });
  await prisma.organizationDeletion.createMany({
    data: [
      {
        id: ownId,
        lastError: "Internal provider error",
        organizationName: "Deleted studio",
        organizationSlug: "deleted-studio",
        requestedById: user.id,
      },
      {
        id: otherId,
        organizationName: "Someone else's studio",
        organizationSlug: "other-studio",
        requestedById: createId(),
      },
    ],
  });
  const request = await createAuthenticatedRequest({
    method: "GET",
    url: createUrl(),
    user,
  });
  const params = {};
  const result = await loader({
    context: await createAuthTestContextProvider({ params, pattern, request }),
    params,
    pattern,
    request,
    url: new URL(request.url),
  });
  expect(result.organizationDeletions).toEqual([
    { id: ownId, organizationName: "Deleted studio" },
  ]);
});

describe("/settings/account route action", () => {
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
          "/login?redirectTo=%2Fsettings%2Faccount",
        );
      } else {
        // Fail test if error is not a Response
        expect(error).toBeInstanceOf(Response);
      }
    }
  });

  describe(`${UPDATE_USER_ACCOUNT_INTENT} intent`, () => {
    const intent = UPDATE_USER_ACCOUNT_INTENT;

    test("given: a valid name, should: update user account name and return a success toast", async () => {
      const user = await setup();

      const newName = createPopulatedUserAccount().name;
      const formData = toFormData({ intent, name: newName });

      const actual = (await sendAuthenticatedRequest({
        formData,
        user,
      })) as DataWithResponseInit<{ result: undefined }>;

      // Verify user account was updated in the database
      const updatedUser = await retrieveUserAccountFromDatabaseById(user.id);
      expect(updatedUser?.name).toEqual(newName);

      const maybeToast = new Headers(actual.init?.headers).get("Set-Cookie");
      const { toast } = await getToast(
        new Request(createUrl(), {
          headers: { cookie: maybeToast ?? "" },
        }),
      );
      expect(toast).toMatchObject({
        id: expect.any(String) as string,
        title: "Your account has been updated",
        type: "success",
      });
    });

    test("given: a valid name and avatar URL, should: update user account name and avatar and return a success toast", async () => {
      const user = await setup();

      const newName = createPopulatedUserAccount().name;
      const file = new File(["dummy"], "avatar.png", { type: "image/png" });
      const formData = toFormData({ avatar: file, intent, name: newName });

      const actual = (await sendAuthenticatedRequest({
        formData,
        user,
      })) as DataWithResponseInit<{ result: undefined }>;

      // Verify user account was updated in the database
      const updatedUser = await retrieveUserAccountFromDatabaseById(user.id);
      expect(updatedUser?.name).toEqual(newName);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const expectedPrefix = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${AVATAR_PATH_PREFIX}/${user.id}/`;
      expect(updatedUser?.imageUrl.startsWith(expectedPrefix)).toBe(true);
      expect(updatedUser?.imageUrl.slice(expectedPrefix.length)).toMatch(
        /^[0-9a-f-]{36}\.png$/,
      );

      const maybeToast = new Headers(actual.init?.headers).get("Set-Cookie");
      const { toast } = await getToast(
        new Request(createUrl(), { headers: { cookie: maybeToast ?? "" } }),
      );
      expect(toast).toMatchObject({
        id: expect.any(String) as string,
        title: "Your account has been updated",
        type: "success",
      });
    });

    test("given: only an avatar URL update, should: update just the avatar and return a success toast", async () => {
      const user = await setup();

      const file = new File(["dummy"], "avatar.png", { type: "image/png" });
      const formData = toFormData({ avatar: file, intent, name: user.name });

      const actual = (await sendAuthenticatedRequest({
        formData,
        user,
      })) as DataWithResponseInit<{ result: undefined }>;

      // Verify only avatar was updated in the database
      const updatedUser = await retrieveUserAccountFromDatabaseById(user.id);
      expect(updatedUser?.name).toEqual(user.name);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const expectedPrefix = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${AVATAR_PATH_PREFIX}/${user.id}/`;
      expect(updatedUser?.imageUrl.startsWith(expectedPrefix)).toBe(true);
      expect(updatedUser?.imageUrl.slice(expectedPrefix.length)).toMatch(
        /^[0-9a-f-]{36}\.png$/,
      );

      const maybeToast = new Headers(actual.init?.headers).get("Set-Cookie");
      const { toast } = await getToast(
        new Request(createUrl(), {
          headers: { cookie: maybeToast ?? "" },
        }),
      );
      expect(toast).toMatchObject({
        id: expect.any(String) as string,
        title: "Your account has been updated",
        type: "success",
      });
    });

    test.each([
      {
        body: { intent },
        expectedError: {
          fieldErrors: {
            name: ["Invalid input: expected string, received undefined"],
          },
          formErrors: [],
        },
        given: "no name provided",
      },
      {
        body: { intent, name: "a" },
        expectedError: {
          fieldErrors: {
            name: ["settings:userAccount.errors.nameMin"],
          },
          formErrors: [],
        },
        given: "a name that is too short (1 character)",
      },
      {
        body: { intent, name: "a".repeat(129) },
        expectedError: {
          fieldErrors: {
            name: ["settings:userAccount.errors.nameMax"],
          },
          formErrors: [],
        },
        given: "a name that is too long (129 characters)",
      },
      {
        body: { intent, name: "   " },
        expectedError: {
          fieldErrors: {
            name: ["settings:userAccount.errors.nameMin"],
          },
          formErrors: [],
        },
        given: "a name with only whitespace",
      },
      {
        body: { intent, name: "  a " },
        expectedError: {
          fieldErrors: {
            name: ["settings:userAccount.errors.nameMin"],
          },
          formErrors: [],
        },
        given: "a too short name with whitespace",
      },
    ])(
      "given: $given, should: return a 400 status code with an error message",
      async ({ body, expectedError }) => {
        const user = await setup();

        const formData = toFormData(body);
        const submission = parseSubmission(formData);

        const actual = await sendAuthenticatedRequest({
          formData,
          user,
        });

        expect(actual).toEqual(
          badRequest({
            result: report(submission, {
              error: expectedError,
            }),
          }),
        );
      },
    );
  });

  test("given: a confirmed account without organizations, should: admit deletion and redirect to recoverable cleanup", async () => {
    const user = await setup();
    const response = (await sendAuthenticatedRequest({
      formData: toFormData({
        confirmation: user.email,
        intent: DELETE_USER_ACCOUNT_INTENT,
      }),
      user,
    })) as Response;
    expect(response.status).toEqual(302);
    expect(response.headers.get("Location")).toEqual(
      `/account-deletions/${user.id}`,
    );
    expect(response.headers.get("Set-Cookie")).toContain("HttpOnly");
    expect(await retrieveUserAccountFromDatabaseById(user.id)).toBeNull();
  });

  describe(`${DELETE_USER_ACCOUNT_INTENT} intent`, () => {
    const intent = DELETE_USER_ACCOUNT_INTENT;
    const { admin, member, owner } = OrganizationMembershipRole;

    test.each([
      { blocked: false, given: "no organizations", roles: [] },
      {
        blocked: false,
        given: "member and admin memberships",
        roles: [member, admin],
      },
      {
        blocked: false,
        given: "one solely owned organization",
        roles: [owner],
      },
      {
        blocked: false,
        given: "multiple solely owned organizations",
        roles: [owner, owner],
      },
      {
        blocked: false,
        given: "mixed sole-owner, member and admin memberships",
        roles: [owner, member, admin],
      },
      {
        blocked: false,
        given: "an organization with another active owner",
        otherOwner: true,
        roles: [owner],
        sharedIndex: 0,
      },
      {
        blocked: true,
        given: "last ownership of an organization with other members",
        roles: [owner],
        sharedIndex: 0,
      },
      {
        blocked: true,
        given: "last ownership between two solely owned organizations",
        roles: [owner, owner, owner],
        sharedIndex: 1,
      },
    ])(
      "given: $given, should: admit safe deletion or preserve all data when ownership must be transferred",
      async ({ blocked, otherOwner, roles, sharedIndex }) => {
        const user = await setup();
        const organizations = [];
        const survivingUsers: string[] = [];
        for (const [index, role] of roles.entries()) {
          const organization = createPopulatedOrganization({ imageUrl: "" });
          await saveOrganizationToDatabase(organization);
          onTestFinished(async () => {
            await prisma.organization.deleteMany({
              where: { id: organization.id },
            });
          });
          await addMembersToOrganizationInDatabaseById({
            id: organization.id,
            members: [user.id],
            role,
          });
          await createTestSubscriptionForUserAndOrganization({
            lookupKey: priceLookupKeysByTierAndInterval.high.annual,
            organization,
            stripeCustomerId: `cus_${organization.id}`,
            user,
          });
          if (role !== owner || index === sharedIndex) {
            const otherUser = await setup();
            survivingUsers.push(otherUser.id);
            await addMembersToOrganizationInDatabaseById({
              id: organization.id,
              members: [otherUser.id],
              role: otherOwner || role !== owner ? owner : member,
            });
          }
          organizations.push({
            deleted: role === owner && index !== sharedIndex,
            id: organization.id,
          });
        }
        const readState = () =>
          prisma.userAccount.findUnique({
            include: {
              memberships: {
                include: { organization: true },
                orderBy: { organizationId: "asc" },
              },
            },
            where: { id: user.id },
          });
        const before = await readState();
        const providerMutations: string[] = [];
        const listener = ({ request }: { request: Request }) => {
          if (
            !["GET", "HEAD"].includes(request.method) &&
            !request.url.includes("/auth/v1/logout")
          )
            providerMutations.push(request.url);
        };
        server.events.on("request:start", listener);
        onTestFinished(() =>
          server.events.removeListener("request:start", listener),
        );
        const response = await sendAuthenticatedRequest({
          formData: toFormData({ confirmation: user.email, intent }),
          user,
        });
        if (blocked) {
          expect(response).toMatchObject({ init: { status: 400 } });
          expect(await readState()).toEqual(before);
          expect(
            await prisma.accountDeletion.count({ where: { id: user.id } }),
          ).toEqual(0);
          expect(
            await prisma.organizationDeletion.count({
              where: { requestedById: user.id },
            }),
          ).toEqual(0);
        } else {
          expect(response).toBeInstanceOf(Response);
          expect((response as Response).headers.get("Location")).toEqual(
            `/account-deletions/${user.id}`,
          );
          expect(await readState()).toBeNull();
          expect(
            await prisma.accountDeletion.findUnique({ where: { id: user.id } }),
          ).toMatchObject({ completedAt: null });
          for (const organization of organizations) {
            const stored = await prisma.organization.findUnique({
              where: { id: organization.id },
            });
            if (organization.deleted) {
              expect(stored).toBeNull();
              expect(
                await prisma.organizationDeletion.findUnique({
                  where: { id: organization.id },
                }),
              ).not.toBeNull();
            } else {
              expect(stored).not.toBeNull();
              expect(
                await prisma.stripeSubscription.findMany({
                  select: { purchasedById: true },
                  where: { organizationId: organization.id },
                }),
              ).toEqual([{ purchasedById: null }]);
            }
          }
        }
        expect(providerMutations).toEqual([]);
        expect(
          await prisma.userAccount.count({
            where: { id: { in: survivingUsers } },
          }),
        ).toEqual(survivingUsers.length);
      },
    );

    test.each(["", "someone-else@example.com"])(
      "given: confirmation %s, should: preserve the account and avoid cleanup admission",
      async (confirmation) => {
        const user = await setup();
        const response = await sendAuthenticatedRequest({
          formData: toFormData({ confirmation, intent }),
          user,
        });
        expect(response).toMatchObject({ init: { status: 400 } });
        expect(
          await retrieveUserAccountFromDatabaseById(user.id),
        ).not.toBeNull();
        expect(
          await prisma.accountDeletion.count({ where: { id: user.id } }),
        ).toEqual(0);
      },
    );
  });
});
