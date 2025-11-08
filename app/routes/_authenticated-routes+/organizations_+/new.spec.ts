/** biome-ignore-all lint/style/noNonNullAssertion: test code */
import { parseSubmission, report } from "@conform-to/react/future";
import { describe, expect, onTestFinished, test } from "vitest";

import { action } from "./new";
import { CREATE_ORGANIZATION_INTENT } from "~/features/organizations/create-organization/create-organization-constants";
import { createPopulatedOrganization } from "~/features/organizations/organizations-factories.server";
import {
  deleteOrganizationFromDatabaseById,
  retrieveOrganizationWithMembershipsFromDatabaseBySlug,
  saveOrganizationToDatabase,
} from "~/features/organizations/organizations-model.server";
import { createPopulatedUserAccount } from "~/features/user-accounts/user-accounts-factories.server";
import {
  deleteUserAccountFromDatabaseById,
  saveUserAccountToDatabase,
} from "~/features/user-accounts/user-accounts-model.server";
import { stripeHandlers } from "~/test/mocks/handlers/stripe";
import { supabaseHandlers } from "~/test/mocks/handlers/supabase";
import { setupMockServerLifecycle } from "~/test/msw-test-utils";
import {
  createAuthenticatedRequest,
  createAuthTestContextProvider,
} from "~/test/test-utils";
import { badRequest } from "~/utils/http-responses.server";
import { slugify } from "~/utils/slugify.server";
import { toFormData } from "~/utils/to-form-data";

const createUrl = () => `http://localhost:3000/organizations/new`;

const pattern = "/organizations/new";

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

setupMockServerLifecycle(...supabaseHandlers, ...stripeHandlers);

describe("/organizations/new route action", () => {
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
          `/login?redirectTo=%2Forganizations%2Fnew`,
        );
      }
    }
  });

  describe(`${CREATE_ORGANIZATION_INTENT} intent`, () => {
    const intent = CREATE_ORGANIZATION_INTENT;

    test("given: a valid name for an organization, should: create organization and redirect to organization page", async () => {
      const { userAccount } = await setup();
      const organization = createPopulatedOrganization();
      const formData = toFormData({
        intent,
        name: organization.name,
      });

      const response = (await sendAuthenticatedRequest({
        formData,
        userAccount,
      })) as Response;

      expect(response.status).toEqual(302);
      const slug = slugify(organization.name);
      expect(response.headers.get("Location")).toEqual(
        `/organizations/${slug}`,
      );

      // Verify organization was created with correct data
      const createdOrganization =
        await retrieveOrganizationWithMembershipsFromDatabaseBySlug(slug);
      expect(createdOrganization).toMatchObject({
        name: organization.name,
      });
      expect(createdOrganization?.memberships[0]?.member.id).toEqual(
        userAccount.id,
      );
      expect(createdOrganization?.memberships[0]?.role).toEqual("owner");

      await deleteOrganizationFromDatabaseById(createdOrganization!.id);
    });

    test("given: an organization name that already exists, should: create organization with unique slug", async () => {
      const { userAccount } = await setup();

      // Create first organization
      const firstOrg = createPopulatedOrganization();
      await saveOrganizationToDatabase(firstOrg);
      onTestFinished(async () => {
        await deleteOrganizationFromDatabaseById(firstOrg.id);
      });

      // Try to create second organization with same name
      const formData = toFormData({
        intent,
        name: firstOrg.name,
      });

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
      expect(secondOrg?.name).toEqual(firstOrg.name);
      expect(secondOrg?.slug).not.toEqual(firstOrg.slug);
      expect(secondOrg?.memberships).toHaveLength(1);
      expect(secondOrg?.memberships[0]?.member.id).toEqual(userAccount.id);
      expect(secondOrg?.memberships[0]?.role).toEqual("owner");

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
      expect(organization?.name).toEqual("New");
      expect(organization?.slug).not.toEqual("new");
      expect(organization?.memberships).toHaveLength(1);
      expect(organization?.memberships[0]?.member.id).toEqual(userAccount.id);
      expect(organization?.memberships[0]?.role).toEqual("owner");

      await deleteOrganizationFromDatabaseById(organization!.id);
    });

    test("given: a valid name and a logo file, should: create organization with logo", async () => {
      const { userAccount } = await setup();
      const organization = createPopulatedOrganization();

      // Create a mock File object for the logo
      const logoFile = new File(["logo content"], "logo.png", {
        type: "image/png",
      });

      const formData = toFormData({
        intent,
        logo: logoFile,
        name: organization.name,
      });

      const response = (await sendAuthenticatedRequest({
        formData,
        userAccount,
      })) as Response;

      // Assert redirect
      expect(response.status).toEqual(302);
      const slug = slugify(organization.name);
      expect(response.headers.get("Location")).toEqual(
        `/organizations/${slug}`,
      );

      // Verify organization was created with correct data including logo
      const createdOrganization =
        await retrieveOrganizationWithMembershipsFromDatabaseBySlug(slug);

      expect(createdOrganization).toBeTruthy();
      expect(createdOrganization).toMatchObject({
        name: organization.name,
        slug: slug,
      });
      // Logo URL should be set (uploaded to storage)
      expect(createdOrganization?.imageUrl).toBeTruthy();
      expect(createdOrganization?.memberships).toHaveLength(1);
      expect(createdOrganization?.memberships[0]?.member.id).toEqual(
        userAccount.id,
      );
      expect(createdOrganization?.memberships[0]?.role).toEqual("owner");

      // Cleanup
      await deleteOrganizationFromDatabaseById(createdOrganization!.id);
    });

    test.each([
      {
        body: { intent } as const,
        expectedError: {
          fieldErrors: {
            name: ["organizations:new.form.nameMinLength"],
          },
          formErrors: [],
        },
        given: "no name provided",
      },
      {
        body: { intent, name: "ab" } as const,
        expectedError: {
          fieldErrors: {
            name: ["organizations:new.form.nameMinLength"],
          },
          formErrors: [],
        },
        given: "a name that is too short (2 characters)",
      },
      {
        body: { intent, name: "a".repeat(256) } as const,
        expectedError: {
          fieldErrors: {
            name: ["organizations:new.form.nameMaxLength"],
          },
          formErrors: [],
        },
        given: "a name that is too long (256 characters)",
      },
      {
        body: { intent, name: "   " },
        expectedError: {
          fieldErrors: {
            name: ["organizations:new.form.nameMinLength"],
          },
          formErrors: [],
        },
        given: "a name with only whitespace",
      },
      {
        body: { intent, name: "  a " },
        expectedError: {
          fieldErrors: {
            name: ["organizations:new.form.nameMinLength"],
          },
          formErrors: [],
        },
        given: "a too short name with whitespace",
      },
    ])(
      "given: $given, should: return a 400 status code with an error message",
      async ({ body, expectedError }) => {
        const { userAccount } = await setup();

        const formData = toFormData(body);
        const submission = parseSubmission(formData);
        const response = await sendAuthenticatedRequest({
          formData,
          userAccount,
        });

        expect(response).toEqual(
          badRequest({
            result: report(submission, {
              error: expectedError,
            }),
          }),
        );
      },
    );
  });
});
