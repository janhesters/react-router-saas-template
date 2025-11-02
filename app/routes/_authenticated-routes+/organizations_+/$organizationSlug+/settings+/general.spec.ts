import type { Organization, UserAccount } from "@prisma/client";
import { OrganizationMembershipRole } from "@prisma/client";
import { describe, expect, onTestFinished, test } from "vitest";

import { action } from "./general";
import { createPopulatedOrganization } from "~/features/organizations/organizations-factories.server";
import { retrieveOrganizationFromDatabaseById } from "~/features/organizations/organizations-model.server";
import {
  DELETE_ORGANIZATION_INTENT,
  UPDATE_ORGANIZATION_INTENT,
} from "~/features/organizations/settings/general/general-settings-constants";
import { stripeHandlers } from "~/test/mocks/handlers/stripe";
import { supabaseHandlers } from "~/test/mocks/handlers/supabase";
import { setupMockServerLifecycle } from "~/test/msw-test-utils";
import { setupUserWithOrgAndAddAsMember } from "~/test/server-test-utils";
import {
  createAuthenticatedRequest,
  createOrganizationMembershipTestContextProvider,
  createUserWithOrgAndAddAsMember,
  teardownOrganizationAndMember,
} from "~/test/test-utils";
import { badRequest, forbidden, notFound } from "~/utils/http-responses.server";
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
    request,
    unstable_pattern: pattern,
  });
}

setupMockServerLifecycle(...supabaseHandlers, ...stripeHandlers);

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
        request,
        unstable_pattern: pattern,
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

    test("given: a user who is an owner and a valid name, should: update organization name, show a toast and redirect to new URL", async () => {
      const { user, organization } = await setupUserWithOrgAndAddAsMember({
        role: OrganizationMembershipRole.owner,
      });
      const { name, slug } = createPopulatedOrganization();
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
          errors: {
            name: {
              message: "organizations:settings.general.form.name-required",
            },
          },
        }),
        given: "no name provided",
      },
      {
        body: { intent, name: "ab" },
        expected: badRequest({
          errors: {
            name: {
              message: "organizations:settings.general.form.name-min-length",
            },
          },
        }),
        given: "a name that is too short (2 characters)",
      },
      {
        body: { intent, name: "a".repeat(256) },
        expected: badRequest({
          errors: {
            name: {
              message: "organizations:settings.general.form.name-max-length",
            },
          },
        }),
        given: "a name that is too long (256 characters)",
      },
      {
        body: { intent, name: "   " },
        expected: badRequest({
          errors: {
            name: {
              message: "organizations:settings.general.form.name-min-length",
            },
          },
        }),
        given: "a name with only whitespace",
      },
      {
        body: { intent, name: "  a " },
        expected: badRequest({
          errors: {
            name: {
              message: "organizations:settings.general.form.name-min-length",
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

        expect(response).toEqual(expected);
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

    test("given: a valid request from an owner, should: delete organization and redirect to organizations page", async () => {
      const { user, organization } = await createUserWithOrgAndAddAsMember({
        role: OrganizationMembershipRole.owner,
      });
      onTestFinished(async () => {
        try {
          await teardownOrganizationAndMember({ organization, user });
        } catch {
          // Do nothing cause the org was successfully deleted.
        }
      });

      const formData = toFormData({ intent });

      const response = (await sendAuthenticatedRequest({
        formData,
        organizationSlug: organization.slug,
        user,
      })) as Response;

      expect(response.status).toEqual(302);
      expect(response.headers.get("Location")).toEqual("/organizations");

      // Verify organization was deleted
      const deletedOrganization = await retrieveOrganizationFromDatabaseById(
        organization.id,
      );
      expect(deletedOrganization).toBeNull();
    });
  });
});
