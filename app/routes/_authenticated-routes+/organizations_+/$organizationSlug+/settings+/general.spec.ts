import { createId } from "@paralleldrive/cuid2";
import { describe, expect, onTestFinished, test } from "vitest";

import { action } from "./general";
import { createPopulatedOrganization } from "~/features/organizations/organizations-factories.server";
import {
  addMembersToOrganizationInDatabaseById,
  retrieveOrganizationFromDatabaseById,
} from "~/features/organizations/organizations-model.server";
import {
  DELETE_ORGANIZATION_INTENT,
  UPDATE_ORGANIZATION_INTENT,
} from "~/features/organizations/settings/general/general-settings-constants";
import { createPopulatedUserAccount } from "~/features/user-accounts/user-accounts-factories.server";
import {
  deleteUserAccountFromDatabaseById,
  saveUserAccountToDatabase,
} from "~/features/user-accounts/user-accounts-model.server";
import type { Organization, UserAccount } from "~/generated/client";
import { OrganizationMembershipRole } from "~/generated/client";
import { stripeHandlers } from "~/test/mocks/handlers/stripe";
import { supabaseHandlers } from "~/test/mocks/handlers/supabase";
import { setupMockServerLifecycle } from "~/test/msw-test-utils";
import {
  setupUserWithOrgAndAddAsMember,
  setupUserWithTrialOrgAndAddAsMember,
} from "~/test/server-test-utils";
import {
  createAuthenticatedRequest,
  createOrganizationMembershipTestContextProvider,
} from "~/test/test-utils";
import { prisma } from "~/utils/database.server";
import { badRequest, forbidden, notFound } from "~/utils/http-responses.server";
import { slugify } from "~/utils/slugify.server";
import { toFormData } from "~/utils/to-form-data";
import { getToast } from "~/utils/toast.server";

const createUrl = (organizationSlug: string) =>
  `http://localhost:3000/organizations/${organizationSlug}/settings/general`;

const pattern = "/organizations/:organizationSlug/settings/general";

async function sendAuthenticatedRequest({
  formData,
  organizationSlug,
  user,
}: {
  formData: FormData;
  organizationSlug: Organization["slug"];
  user: UserAccount;
}) {
  const request = await createAuthenticatedRequest({
    formData,
    method: "POST",
    url: createUrl(organizationSlug),
    user,
  });
  const params = { organizationSlug };

  return await action({
    context: await createOrganizationMembershipTestContextProvider({
      params,
      pattern,
      request,
    }),
    params,
    pattern,
    request,
    url: new URL(request.url),
  });
}

const server = setupMockServerLifecycle(...supabaseHandlers, ...stripeHandlers);

describe("/organizations/:organizationSlug/settings/general route action", () => {
  test("given: an unauthenticated request, should: throw a redirect to the login page", async () => {
    expect.assertions(2);

    const organization = createPopulatedOrganization();
    const request = new Request(createUrl(organization.slug), {
      body: toFormData({}),
      method: "POST",
    });
    const params = { organizationSlug: organization.slug };

    try {
      await action({
        context: await createOrganizationMembershipTestContextProvider({
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
          `/login?redirectTo=%2Forganizations%2F${organization.slug}%2Fsettings%2Fgeneral`,
        );
      }
    }
  });

  test("given: a user who is not a member of the organization, should: throw a 404", async () => {
    expect.assertions(1);
    // Create a user with an organization.
    const { user } = await setupUserWithOrgAndAddAsMember();
    // Creates a user and another organization.
    const { organization } = await setupUserWithOrgAndAddAsMember();

    try {
      await sendAuthenticatedRequest({
        formData: toFormData({}),
        organizationSlug: organization.slug,
        user,
      });
    } catch (error) {
      const expected = notFound();

      expect(error).toEqual(expected);
    }
  });

  describe(`${UPDATE_ORGANIZATION_INTENT} intent`, () => {
    const intent = UPDATE_ORGANIZATION_INTENT;

    test.each([
      {
        given: "a member",
        role: OrganizationMembershipRole.member,
      },
      {
        given: "an admin",
        role: OrganizationMembershipRole.admin,
      },
    ])(
      "given: a user who is NOT an owner (but is a $given), should: return a 403",
      async ({ role }) => {
        const { user, organization } = await setupUserWithOrgAndAddAsMember({
          role,
        });
        const newName = createPopulatedOrganization().name;

        const actual = await sendAuthenticatedRequest({
          formData: toFormData({ intent, name: newName }),
          organizationSlug: organization.slug,
          user,
        });
        const expected = forbidden();

        expect(actual).toEqual(expected);
      },
    );

    test("given: overlapping renames with the original slug, should: redirect both requests to the final slug", async () => {
      const { user, organization } = await setupUserWithTrialOrgAndAddAsMember({
        organization: createPopulatedOrganization({ stripeCustomerId: null }),
        role: OrganizationMembershipRole.owner,
      });
      const name = `Renamed ${createId()}`;
      const params = { organizationSlug: organization.slug };
      const requests = await Promise.all(
        [0, 1].map(async () => {
          const request = await createAuthenticatedRequest({
            formData: toFormData({ intent, name }),
            method: "POST",
            url: createUrl(organization.slug),
            user,
          });
          const context = await createOrganizationMembershipTestContextProvider(
            { params, pattern, request },
          );
          return {
            context,
            params,
            pattern,
            request,
            url: new URL(request.url),
          };
        }),
      );
      for (const args of requests) {
        const response = (await action(args)) as Response;
        expect(response.status).toEqual(302);
        expect(response.headers.get("Location")).toEqual(
          `/organizations/${slugify(name)}/settings/general`,
        );
      }
    });

    test("given: a user who is an owner and a valid name, should: update organization name, show a toast and redirect to new URL", async () => {
      const { user, organization } = await setupUserWithOrgAndAddAsMember({
        role: OrganizationMembershipRole.owner,
      });
      const name = `${createPopulatedOrganization().name} ${createId()}`;
      const slug = slugify(name);
      const formData = toFormData({ intent, name });

      const response = (await sendAuthenticatedRequest({
        formData,
        organizationSlug: organization.slug,
        user,
      })) as Response;

      expect(response.status).toEqual(302);
      expect(response.headers.get("Location")).toEqual(
        `/organizations/${slug}/settings/general`,
      );

      // Verify organization was updated
      const updatedOrganization = await retrieveOrganizationFromDatabaseById(
        organization.id,
      );
      expect(updatedOrganization?.name).toEqual(name);
      expect(updatedOrganization?.slug).toEqual(slug);

      const maybeToast = response.headers.get("Set-Cookie");
      const { toast } = await getToast(
        new Request(createUrl(organization.slug), {
          headers: { cookie: maybeToast ?? "" },
        }),
      );
      expect(toast).toMatchObject({
        id: expect.any(String) as string,
        title: "Organization has been updated",
        type: "success",
      });
    });

    test.each([
      {
        body: { intent },
        expected: badRequest({
          result: {
            error: {
              fieldErrors: {
                name: ["Invalid input: expected string, received undefined"],
              },
            },
          },
        }),
        given: "no name provided",
      },
      {
        body: { intent, name: "ab" },
        expected: badRequest({
          result: {
            error: {
              fieldErrors: {
                name: ["organizations:settings.general.errors.nameMin"],
              },
            },
          },
        }),
        given: "a name that is too short (2 characters)",
      },
      {
        body: { intent, name: "a".repeat(256) },
        expected: badRequest({
          result: {
            error: {
              fieldErrors: {
                name: ["organizations:settings.general.errors.nameMax"],
              },
            },
          },
        }),
        given: "a name that is too long (256 characters)",
      },
      {
        body: { intent, name: "   " },
        expected: badRequest({
          result: {
            error: {
              fieldErrors: {
                name: ["organizations:settings.general.errors.nameMin"],
              },
            },
          },
        }),
        given: "a name with only whitespace",
      },
      {
        body: { intent, name: "  a " },
        expected: badRequest({
          result: {
            error: {
              fieldErrors: {
                name: ["organizations:settings.general.errors.nameMin"],
              },
            },
          },
        }),
        given: "a too short name with whitespace",
      },
    ])(
      "given: $given, should: return a 400 status code with an error message",
      async ({ body, expected }) => {
        const { user, organization } = await setupUserWithOrgAndAddAsMember({
          role: OrganizationMembershipRole.owner,
        });

        const formData = toFormData(body);
        const response = await sendAuthenticatedRequest({
          formData,
          organizationSlug: organization.slug,
          user,
        });

        expect(response).toMatchObject(expected);
      },
    );
  });

  describe(`${DELETE_ORGANIZATION_INTENT} intent`, () => {
    const intent = DELETE_ORGANIZATION_INTENT;

    test.each([
      {
        given: "a member",
        role: OrganizationMembershipRole.member,
      },
      {
        given: "an admin",
        role: OrganizationMembershipRole.admin,
      },
    ])(
      "given: a user who is NOT an owner (but is a$given), should: return a 403",
      async ({ role }) => {
        const { user, organization } = await setupUserWithOrgAndAddAsMember({
          role,
        });

        const actual = await sendAuthenticatedRequest({
          formData: toFormData({ intent }),
          organizationSlug: organization.slug,
          user,
        });
        const expected = forbidden();

        expect(actual).toEqual(expected);
      },
    );

    test.each([
      { confirmation: undefined, given: "missing confirmation" },
      { confirmation: "wrong organization", given: "wrong confirmation" },
      { confirmation: "", given: "blank confirmation" },
    ])(
      "given: $given, should: reject deletion and preserve the organization",
      async ({ confirmation }) => {
        const { user, organization } = await setupUserWithOrgAndAddAsMember({
          role: OrganizationMembershipRole.owner,
        });
        const originalOrganization = await retrieveOrganizationFromDatabaseById(
          organization.id,
        );
        const response = await sendAuthenticatedRequest({
          formData: toFormData({
            intent,
            ...(confirmation === undefined ? {} : { confirmation }),
          }),
          organizationSlug: organization.slug,
          user,
        });
        expect(response).toMatchObject({
          data: {
            result: {
              error: { fieldErrors: { confirmation: expect.any(Array) } },
            },
          },
          init: { status: 400 },
        });
        expect(
          await retrieveOrganizationFromDatabaseById(organization.id),
        ).toEqual(originalOrganization);
        expect(
          await prisma.organizationDeletion.findUnique({
            where: { id: organization.id },
          }),
        ).toBeNull();
      },
    );

    test("given: a confirmed deletion with other members and no billing customer, should: delete the organization, preserve all users, and redirect to pending cleanup", async () => {
      const { user, organization } = await setupUserWithTrialOrgAndAddAsMember({
        organization: createPopulatedOrganization({
          imageUrl: "",
          stripeCustomerId: null,
        }),
        role: OrganizationMembershipRole.owner,
      });
      onTestFinished(async () => {
        await prisma.organizationDeletion.deleteMany({
          where: { id: organization.id },
        });
      });
      const otherUser = createPopulatedUserAccount();
      await saveUserAccountToDatabase(otherUser);
      onTestFinished(async () => {
        await deleteUserAccountFromDatabaseById(otherUser.id);
      });
      await addMembersToOrganizationInDatabaseById({
        id: organization.id,
        members: [otherUser.id],
      });

      const response = (await sendAuthenticatedRequest({
        formData: toFormData({ confirmation: organization.name, intent }),
        organizationSlug: organization.slug,
        user,
      })) as Response;
      expect(response.status).toBe(302);
      expect(response.headers.get("Location")).toBe(
        `/organization-deletions/${organization.id}`,
      );
      expect(response.headers.get("Set-Cookie")).toBeNull();
      expect(
        await retrieveOrganizationFromDatabaseById(organization.id),
      ).toBeNull();
      expect(
        await prisma.organizationMembership.count({
          where: { organizationId: organization.id },
        }),
      ).toBe(0);
      expect(
        await prisma.userAccount.findUnique({ where: { id: user.id } }),
      ).toEqual(user);
      expect(
        await prisma.userAccount.findUnique({ where: { id: otherUser.id } }),
      ).toEqual(otherUser);
      expect(
        await prisma.organizationDeletion.findUnique({
          where: { id: organization.id },
        }),
      ).toMatchObject({
        attempts: 0,
        completedAt: null,
        requestedById: user.id,
      });
    });

    test("given: a deletion needs billing cleanup, should: queue it durably and redirect before any provider call", async () => {
      const { user, organization } = await setupUserWithOrgAndAddAsMember({
        role: OrganizationMembershipRole.owner,
      });
      onTestFinished(async () => {
        await prisma.organizationDeletion.deleteMany({
          where: { id: organization.id },
        });
      });
      const providerRequests: string[] = [];
      const listener = ({ request }: { request: Request }) => {
        if (
          request.url.startsWith("https://api.stripe.com/") ||
          request.url.includes("/storage/")
        ) {
          providerRequests.push(`${request.method} ${request.url}`);
        }
      };
      server.events.on("request:start", listener);
      onTestFinished(() =>
        server.events.removeListener("request:start", listener),
      );
      const response = (await sendAuthenticatedRequest({
        formData: toFormData({ confirmation: organization.name, intent }),
        organizationSlug: organization.slug,
        user,
      })) as Response;
      expect(providerRequests).toEqual([]);
      expect(response.status).toBe(302);
      expect(response.headers.get("Location")).toBe(
        `/organization-deletions/${organization.id}`,
      );
      expect(response.headers.get("Set-Cookie")).toBeNull();
      expect(
        await retrieveOrganizationFromDatabaseById(organization.id),
      ).toBeNull();
      expect(
        await prisma.organizationDeletion.findUnique({
          where: { id: organization.id },
        }),
      ).toMatchObject({
        attempts: 0,
        completedAt: null,
        lastError: null,
        requestedById: user.id,
      });
    });
  });
});
