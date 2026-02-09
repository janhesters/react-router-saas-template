/** biome-ignore-all lint/style/noNonNullAssertion: test code */
import { createId } from "@paralleldrive/cuid2";
import { describe, expect, onTestFinished, test } from "vitest";

import { action } from "./organization";
import { ONBOARDING_ORGANIZATION_INTENT } from "~/features/onboarding/organization/onboarding-organization-consants";
import { createPopulatedOrganization } from "~/features/organizations/organizations-factories.server";
import {
  deleteOrganizationFromDatabaseById,
  retrieveOrganizationWithMembershipsFromDatabaseBySlug,
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
import { slugify } from "~/utils/slugify.server";
import { toFormData } from "~/utils/to-form-data";

const createUrl = () => `http://localhost:3000/onboarding/organization`;

const pattern = "/onboarding/organization";

async function sendAuthenticatedRequest({
  userAccount,
  formData,
}: {
  userAccount: ReturnType<typeof createPopulatedUserAccount>;
  formData: FormData;
}) {
  const request = await createAuthenticatedRequest({
    formData,
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

describe("/onboarding/organization route action", () => {
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
          `/login?redirectTo=%2Fonboarding%2Forganization`,
        );
      }
    }
  });

  test("given: a user who has completed onboarding, should: redirect to the organizations page", async () => {
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

  describe(`${ONBOARDING_ORGANIZATION_INTENT} intent`, () => {
    const intent = ONBOARDING_ORGANIZATION_INTENT;

    test("given: a valid name for an organization, should: create organization and redirect to organization page", async () => {
      const { userAccount } = await setup();
      const name = `${createPopulatedOrganization().name} ${createId()}`;
      const formData = toFormData({
        intent,
        name,
      });

      const response = (await sendAuthenticatedRequest({
        formData,
        userAccount,
      })) as Response;

      expect(response.status).toEqual(302);
      const slug = slugify(name);
      expect(response.headers.get("Location")).toEqual(
        `/organizations/${slug}`,
      );

      // Verify organization was created with correct data
      const createdOrganization =
        await retrieveOrganizationWithMembershipsFromDatabaseBySlug(slug);
      expect(createdOrganization).toMatchObject({
        name,
      });
      expect(createdOrganization?.memberships[0]?.member.id).toEqual(
        userAccount.id,
      );
      expect(createdOrganization?.memberships[0]?.role).toEqual("owner");

      await deleteOrganizationFromDatabaseById(createdOrganization!.id);
    });

    test("given: an organization name that already exists, should: create organization with unique slug", async () => {
      const { userAccount } = await setup();

      // Create first organization with a slug matching what the route would
      // produce from the name, so the second org triggers the slug extension.
      const { name } = createPopulatedOrganization();
      const firstOrg = createPopulatedOrganization({
        name,
        slug: slugify(name),
      });
      await saveOrganizationToDatabase(firstOrg);
      onTestFinished(async () => {
        await deleteOrganizationFromDatabaseById(firstOrg.id);
      });

      // Try to create second organization with same name
      const formData = toFormData({ intent, name: firstOrg.name });

      const response = (await sendAuthenticatedRequest({
        formData,
        userAccount,
      })) as Response;

      expect(response.status).toEqual(302);
      const locationHeader = response.headers.get("Location");
      expect(locationHeader).toMatch(
        new RegExp(String.raw`^/organizations/${firstOrg.slug}-[\da-z]{8}$`),
      );

      // Extract slug from redirect URL and verify organization
      const slug = locationHeader!.split("/").pop()!;
      const secondOrg =
        await retrieveOrganizationWithMembershipsFromDatabaseBySlug(slug);
      expect(secondOrg).toBeTruthy();
      expect(secondOrg!.name).toEqual(firstOrg.name);
      expect(secondOrg!.slug).not.toEqual(firstOrg.slug);
      expect(secondOrg!.memberships).toHaveLength(1);
      expect(secondOrg!.memberships[0]!.member.id).toEqual(userAccount.id);
      expect(secondOrg!.memberships[0]!.role).toEqual("owner");

      await deleteOrganizationFromDatabaseById(secondOrg!.id);
    });

    test("given: an organization name that would create a reserved slug, should: create organization with unique slug", async () => {
      const { userAccount } = await setup();

      const formData = toFormData({
        intent,
        name: "New", // This would create slug "new" which is reserved.
      });

      const response = (await sendAuthenticatedRequest({
        formData,
        userAccount,
      })) as Response;

      expect(response.status).toEqual(302);
      const locationHeader = response.headers.get("Location");
      expect(locationHeader).toMatch(/^\/organizations\/new-[\da-z]{8}$/);

      // Extract slug from redirect URL and verify organization.
      const slug = locationHeader!.split("/").pop()!;
      const organization =
        await retrieveOrganizationWithMembershipsFromDatabaseBySlug(slug);
      expect(organization).toBeTruthy();
      expect(organization!.name).toEqual("New");
      expect(organization!.slug).not.toEqual("new");
      expect(organization!.memberships).toHaveLength(1);
      expect(organization!.memberships[0]!.member.id).toEqual(userAccount.id);
      expect(organization!.memberships[0]!.role).toEqual("owner");

      await deleteOrganizationFromDatabaseById(organization!.id);
    });

    test.each([
      {
        body: { intent } as const,
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
        body: { intent, name: "ab" } as const,
        expected: {
          data: {
            result: {
              error: {
                fieldErrors: {
                  name: ["onboarding:organization.errors.nameMin"],
                },
              },
            },
          },
          init: { status: 400 },
        },
        given: "a name that is too short (2 characters)",
      },
      {
        body: { intent, name: "a".repeat(73) } as const,
        expected: {
          data: {
            result: {
              error: {
                fieldErrors: {
                  name: ["onboarding:organization.errors.nameMax"],
                },
              },
            },
          },
          init: { status: 400 },
        },
        given: "a name that is too long (73 characters)",
      },
      {
        body: { intent, name: "   " },
        expected: {
          data: {
            result: {
              error: {
                fieldErrors: {
                  name: ["onboarding:organization.errors.nameMin"],
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
                  name: ["onboarding:organization.errors.nameMin"],
                },
              },
            },
          },
          init: { status: 400 },
        },
        given: "a too short name with whitespace",
      },
    ])("given: $given, should: return a 400 status code with an error message", async ({
      body,
      expected,
    }) => {
      const { userAccount } = await setup();

      const formData = toFormData(body);
      const response = await sendAuthenticatedRequest({
        formData,
        userAccount,
      });

      expect(response).toMatchObject(expected);
    });

    test("given: a valid name, should: create organization", async () => {
      const { userAccount } = await setup();
      const name = `${createPopulatedOrganization().name} ${createId()}`;

      const formData = toFormData({
        intent,
        name,
      });

      const response = (await sendAuthenticatedRequest({
        formData,
        userAccount,
      })) as Response;

      // Assert redirect
      expect(response.status).toEqual(302);
      const slug = slugify(name);
      expect(response.headers.get("Location")).toEqual(
        `/organizations/${slug}`,
      );

      // Verify organization was created
      const createdOrganization =
        await retrieveOrganizationWithMembershipsFromDatabaseBySlug(slug);

      expect(createdOrganization).toBeTruthy();
      expect(createdOrganization).toMatchObject({
        imageUrl: "", // No logo uploaded
        name,
        slug: slug,
      });
      expect(createdOrganization!.memberships).toHaveLength(1);
      expect(createdOrganization!.memberships[0]!.member.id).toEqual(
        userAccount.id,
      );
      expect(createdOrganization!.memberships[0]!.role).toEqual("owner");

      // Cleanup
      await deleteOrganizationFromDatabaseById(createdOrganization!.id);
    });
  });
});
