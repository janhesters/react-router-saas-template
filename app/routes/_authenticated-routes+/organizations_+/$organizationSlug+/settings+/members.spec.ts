import { faker } from "@faker-js/faker";
import type { Organization, UserAccount } from "@prisma/client";
import { OrganizationMembershipRole } from "@prisma/client";
import { addDays, subSeconds } from "date-fns";
import { data } from "react-router";
import { describe, expect, onTestFinished, test } from "vitest";

import { action } from "./members";
import { priceLookupKeysByTierAndInterval } from "~/features/billing/billing-constants";
import {
  retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId,
  updateOrganizationMembershipInDatabase,
} from "~/features/organizations/organization-membership-model.server";
import { retrieveActiveEmailInviteLinksFromDatabaseByOrganizationId } from "~/features/organizations/organizations-email-invite-link-model.server";
import {
  createPopulatedOrganization,
  createPopulatedOrganizationInviteLink,
} from "~/features/organizations/organizations-factories.server";
import {
  retrieveLatestInviteLinkFromDatabaseByOrganizationId,
  retrieveOrganizationInviteLinkFromDatabaseById,
  saveOrganizationInviteLinkToDatabase,
} from "~/features/organizations/organizations-invite-link-model.server";
import { addMembersToOrganizationInDatabaseById } from "~/features/organizations/organizations-model.server";
import {
  CHANGE_ROLE_INTENT,
  CREATE_NEW_INVITE_LINK_INTENT,
  DEACTIVATE_INVITE_LINK_INTENT,
  INVITE_BY_EMAIL_INTENT,
} from "~/features/organizations/settings/team-members/team-members-constants";
import { createPopulatedUserAccount } from "~/features/user-accounts/user-accounts-factories.server";
import {
  deleteUserAccountFromDatabaseById,
  saveUserAccountToDatabase,
} from "~/features/user-accounts/user-accounts-model.server";
import { resendHandlers } from "~/test/mocks/handlers/resend";
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
import type { DataWithResponseInit } from "~/utils/http-responses.server";
import {
  badRequest,
  created,
  forbidden,
  notFound,
} from "~/utils/http-responses.server";
import { toFormData } from "~/utils/to-form-data";
import { getToast } from "~/utils/toast.server";

const createUrl = (slug: string) =>
  `http://localhost:3000/organizations/${slug}/settings/members`;

const pattern = "/organizations/:organizationSlug/settings/members";

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

async function setupMultipleMembers({
  memberCount,
  organizationId,
}: {
  memberCount: number;
  organizationId: Organization["id"];
}) {
  const users = Array.from({ length: memberCount }, () =>
    createPopulatedUserAccount(),
  );
  await Promise.all(users.map((user) => saveUserAccountToDatabase(user)));
  await addMembersToOrganizationInDatabaseById({
    id: organizationId,
    members: users.map((user) => user.id),
    role: OrganizationMembershipRole.member,
  });

  onTestFinished(async () => {
    await Promise.all(
      users.map((user) => deleteUserAccountFromDatabaseById(user.id)),
    );
  });

  return users;
}

const server = setupMockServerLifecycle(
  ...supabaseHandlers,
  ...resendHandlers,
  ...stripeHandlers,
);

describe(`${createUrl(":organizationSlug")} route action`, () => {
  test("given: an authenticated request, should: throw a redirect to the organizations page", async () => {
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
          `/login?redirectTo=%2Forganizations%2F${organization.slug}%2Fsettings%2Fmembers`,
        );
      }
    }
  });

  test("given: a user who is not a member of the organization, should: throw a 404", async () => {
    expect.assertions(1);
    const { user } = await setupUserWithOrgAndAddAsMember();
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

  test("given: an invalid intent, should: return a 400", async () => {
    const { user, organization } = await setupUserWithOrgAndAddAsMember({
      role: faker.helpers.arrayElement([
        OrganizationMembershipRole.admin,
        OrganizationMembershipRole.owner,
      ]),
    });

    const actual = await sendAuthenticatedRequest({
      formData: toFormData({}),
      organizationSlug: organization.slug,
      user,
    });
    const expected = badRequest({
      result: {
        error: {
          fieldErrors: {
            intent: ["Invalid input"],
          },
          formErrors: [],
        },
      },
    });

    expect(actual).toMatchObject({ data: expected.data });
  });

  test("given: a user who has the role of member, should: return a 403", async () => {
    const { user, organization } = await setupUserWithOrgAndAddAsMember({
      role: OrganizationMembershipRole.member,
    });

    const actual = await sendAuthenticatedRequest({
      formData: toFormData({}),
      organizationSlug: organization.slug,
      user,
    });
    const expected = forbidden();

    expect(actual).toEqual(expected);
  });

  describe(`${CREATE_NEW_INVITE_LINK_INTENT} intent`, () => {
    const intent = CREATE_NEW_INVITE_LINK_INTENT;

    // Admins & owners can create new invite links.
    test.each([
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ])(
      "given: an %s and no link exists for the organization, should: create a new invite link that expires in two days",
      async (role) => {
        const { user, organization } = await setupUserWithOrgAndAddAsMember({
          lookupKey: priceLookupKeysByTierAndInterval.mid.monthly,
          role,
        });

        const actual = await sendAuthenticatedRequest({
          formData: toFormData({ intent }),
          organizationSlug: organization.slug,
          user,
        });
        const expected = created();

        // It creates a new organization invite link.
        const latestLink =
          await retrieveLatestInviteLinkFromDatabaseByOrganizationId(
            organization.id,
          );
        expect(latestLink?.deactivatedAt).toEqual(null);
        expect(latestLink?.creatorId).toEqual(user.id);

        const expectedExpirationTime = subSeconds(addDays(new Date(), 2), 60);
        expect(latestLink?.expiresAt.getTime()).toBeGreaterThanOrEqual(
          expectedExpirationTime.getTime(),
        );

        expect(actual.data).toEqual(expected.data);
        expect(actual.init?.status).toEqual(expected.init?.status);
      },
    );

    test.each([
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ])(
      "given: an %s and a link already exists for the organization, should: deactivate the old link and creates a new invite link that expires in two days",
      async (role) => {
        const { user, organization } = await setupUserWithOrgAndAddAsMember({
          lookupKey: priceLookupKeysByTierAndInterval.mid.monthly,
          role,
        });
        const existingInviteLink = createPopulatedOrganizationInviteLink({
          creatorId: user.id,
          organizationId: organization.id,
        });

        await saveOrganizationInviteLinkToDatabase(existingInviteLink);

        const actual = await sendAuthenticatedRequest({
          formData: toFormData({ intent }),
          organizationSlug: organization.slug,
          user,
        });
        const expected = created();

        expect(actual.data).toEqual(expected.data);
        expect(actual.init?.status).toEqual(expected.init?.status);

        // It creates a new organization invite link.
        const latestLink =
          await retrieveLatestInviteLinkFromDatabaseByOrganizationId(
            organization.id,
          );
        expect(latestLink?.deactivatedAt).toEqual(null);
        expect(latestLink?.creatorId).toEqual(user.id);

        const expectedExpirationTime = subSeconds(addDays(new Date(), 2), 60);
        expect(latestLink?.expiresAt.getTime()).toBeGreaterThanOrEqual(
          expectedExpirationTime.getTime(),
        );

        // It deactivates the old link.
        const updatedLink =
          await retrieveOrganizationInviteLinkFromDatabaseById(
            existingInviteLink.id,
          );
        expect(updatedLink?.deactivatedAt).not.toEqual(null);
      },
    );

    test("given: a user on the lowest plan (low.monthly) and only one existing member, should: return 400 because the org is full", async () => {
      const { user, organization } = await setupUserWithOrgAndAddAsMember({
        lookupKey: priceLookupKeysByTierAndInterval.low.monthly,
        role: OrganizationMembershipRole.owner,
      });

      const actual = await sendAuthenticatedRequest({
        formData: toFormData({ intent: CREATE_NEW_INVITE_LINK_INTENT }),
        organizationSlug: organization.slug,
        user,
      });
      const expected = badRequest({
        result: {
          error: {
            fieldErrors: {
              email: [
                "organizations:settings.teamMembers.inviteByEmail.form.organizationFull",
              ],
            },
            formErrors: [],
          },
        },
      });

      expect(actual).toMatchObject({ data: expected.data });
    });

    test("given: a user on a trial plan with 25 members, should: return 400 because the org is full", async () => {
      const { user, organization } = await setupUserWithTrialOrgAndAddAsMember({
        role: OrganizationMembershipRole.owner,
      });
      await setupMultipleMembers({
        memberCount: 24,
        organizationId: organization.id,
      });

      const actual = await sendAuthenticatedRequest({
        formData: toFormData({ intent: CREATE_NEW_INVITE_LINK_INTENT }),
        organizationSlug: organization.slug,
        user,
      });
      const expected = badRequest({
        result: {
          error: {
            fieldErrors: {
              email: [
                "organizations:settings.teamMembers.inviteByEmail.form.organizationFull",
              ],
            },
            formErrors: [],
          },
        },
      });

      expect(actual).toMatchObject({ data: expected.data });
    });
  });

  describe(`${DEACTIVATE_INVITE_LINK_INTENT} intent`, () => {
    const intent = DEACTIVATE_INVITE_LINK_INTENT;

    test.each([
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ])(
      "given: no active link exists for the organization and user is %s, should: return a 200 and do nothing",
      async (role) => {
        const { user, organization } = await setupUserWithOrgAndAddAsMember({
          role,
        });

        const actual = await sendAuthenticatedRequest({
          formData: toFormData({ intent }),
          organizationSlug: organization.slug,
          user,
        });
        const expected = created();

        expect(actual.data).toEqual(expected.data);
        expect(actual.init?.status).toEqual(expected.init?.status);

        // Verify no links exist
        const latestLink =
          await retrieveLatestInviteLinkFromDatabaseByOrganizationId(
            organization.id,
          );
        expect(latestLink).toBeNull();
      },
    );

    test.each([
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ])(
      "given: a link exists and is active for the organization and user is %s, should: deactivate the link",
      async (role) => {
        const { user, organization } = await setupUserWithOrgAndAddAsMember({
          role,
        });

        // Create an active invite link
        const existingInviteLink = createPopulatedOrganizationInviteLink({
          creatorId: user.id,
          organizationId: organization.id,
        });
        await saveOrganizationInviteLinkToDatabase(existingInviteLink);

        const actual = await sendAuthenticatedRequest({
          formData: toFormData({ intent }),
          organizationSlug: organization.slug,
          user,
        });
        const expected = created();

        expect(actual.data).toEqual(expected.data);
        expect(actual.init?.status).toEqual(expected.init?.status);

        // Verify the link was deactivated
        const updatedLink =
          await retrieveOrganizationInviteLinkFromDatabaseById(
            existingInviteLink.id,
          );
        expect(updatedLink?.deactivatedAt).not.toBeNull();
      },
    );
  });

  describe(`${CHANGE_ROLE_INTENT} intent`, () => {
    const intent = CHANGE_ROLE_INTENT;

    async function setupTargetMember(
      organization: Organization,
      role: OrganizationMembershipRole,
    ) {
      const user = createPopulatedUserAccount();
      await saveUserAccountToDatabase(user);
      await addMembersToOrganizationInDatabaseById({
        id: organization.id,
        members: [user.id],
        role,
      });

      onTestFinished(async () => {
        await deleteUserAccountFromDatabaseById(user.id);
      });

      return user;
    }

    test.each([
      {
        body: { intent, role: OrganizationMembershipRole.member },
        expected: badRequest({
          result: {
            error: {
              fieldErrors: {
                userId: ["Invalid input: expected string, received undefined"],
              },
              formErrors: [],
            },
          },
        }),
        given: "no userId",
      },
      {
        body: { intent, userId: "some-user-id" },
        expected: badRequest({
          result: {
            error: {
              fieldErrors: {
                role: ["Invalid input"],
              },
              formErrors: [],
            },
          },
        }),
        given: "no role",
      },
      {
        body: {
          intent,
          role: "invalid-role",
          userId: "some-user-id",
        },
        expected: badRequest({
          result: {
            error: {
              fieldErrors: {
                role: ["Invalid input"],
              },
              formErrors: [],
            },
          },
        }),
        given: "invalid role value",
      },
    ])(
      "given: invalid form data ($given), should: return a 400 bad request",
      async ({ body, expected }) => {
        // Need an owner/admin to attempt the action, even with bad data,
        // to get past the initial permission check.
        const { user, organization } = await setupUserWithOrgAndAddAsMember({
          role: OrganizationMembershipRole.owner,
        });

        const actual = await sendAuthenticatedRequest({
          formData: toFormData(body),
          organizationSlug: organization.slug,
          user,
        });

        expect(actual).toMatchObject({ data: expected.data });
      },
    );

    test.each([
      {
        requestingUserRole: OrganizationMembershipRole.admin,
        targetRoleChange: OrganizationMembershipRole.member,
      },
      {
        requestingUserRole: OrganizationMembershipRole.owner,
        targetRoleChange: OrganizationMembershipRole.admin,
      },
      {
        requestingUserRole: OrganizationMembershipRole.owner,
        targetRoleChange: "deactivated" as const, // Explicitly type 'deactivated'
      },
    ])(
      "given: the user is an $requestingUserRole and tries to change their own role to $targetRoleChange, should: return a 403 forbidden",
      async ({ requestingUserRole, targetRoleChange }) => {
        const { user, organization } = await setupUserWithOrgAndAddAsMember({
          role: requestingUserRole,
        });

        const actual = await sendAuthenticatedRequest({
          formData: toFormData({
            intent,
            role: targetRoleChange,
            userId: user.id, // Targeting self
          }),
          organizationSlug: organization.slug,
          user,
        });
        const expected = forbidden({
          errors: { form: "You cannot change your own role or status." }, // Update message if needed
        });

        expect(actual).toEqual(expected);
      },
    );

    test.each([
      {
        description: "change owner role to admin",
        initialTargetRole: OrganizationMembershipRole.owner,
        newRole: OrganizationMembershipRole.admin,
      },
      {
        description: "deactivate owner",
        initialTargetRole: OrganizationMembershipRole.owner,
        newRole: "deactivated" as const,
      },
    ])(
      "given: the user is an admin and tries to $description, should: return a 403 forbidden",
      async ({ initialTargetRole, newRole }) => {
        const { user: adminUser, organization } =
          await setupUserWithOrgAndAddAsMember({
            role: OrganizationMembershipRole.admin,
          });
        const targetUser = await setupTargetMember(
          organization,
          initialTargetRole,
        );

        const actual = await sendAuthenticatedRequest({
          formData: toFormData({
            intent,
            role: newRole,
            userId: targetUser.id,
          }),
          organizationSlug: organization.slug,
          user: adminUser,
        });
        const expected = forbidden({
          errors: {
            form: "Administrators cannot modify the role or status of owners.",
          },
        });

        expect(actual).toEqual(expected);

        // Verify target user's role/status is unchanged
        const membership =
          await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
            { organizationId: organization.id, userId: targetUser.id },
          );
        expect(membership?.role).toEqual(initialTargetRole);
        expect(membership?.deactivatedAt).toBeNull();
      },
    );

    // --- Admin Success Cases ---
    test.each([
      {
        initialTargetRole: OrganizationMembershipRole.member,
        newRole: OrganizationMembershipRole.admin,
      },
      {
        initialTargetRole: OrganizationMembershipRole.admin,
        newRole: OrganizationMembershipRole.member,
      },
    ])(
      "given: the user is an admin and changes another member from $initialTargetRole to $newRole, should: return 200 ok and update the role",
      async ({ initialTargetRole, newRole }) => {
        // Add MSW event listener for Stripe subscription update - but it shouldn't be called
        let stripeUpdateCalled = false;
        const updateListener = ({ request }: { request: Request }) => {
          if (new URL(request.url).pathname.startsWith("/v1/subscriptions/")) {
            stripeUpdateCalled = true;
          }
        };
        server.events.on("response:mocked", updateListener);
        onTestFinished(() => {
          server.events.removeListener("response:mocked", updateListener);
        });

        const { user: adminUser, organization } =
          await setupUserWithOrgAndAddAsMember({
            role: OrganizationMembershipRole.admin,
          });
        const targetUser = await setupTargetMember(
          organization,
          initialTargetRole,
        );

        const actual = await sendAuthenticatedRequest({
          formData: toFormData({
            intent,
            role: newRole,
            userId: targetUser.id,
          }),
          organizationSlug: organization.slug,
          user: adminUser,
        });
        const expected = data({});

        expect(actual.data).toEqual(expected.data);
        expect(actual.init?.status).toEqual(expected.init?.status);

        // Verify target user's role is updated
        const membership =
          await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
            { organizationId: organization.id, userId: targetUser.id },
          );
        expect(membership?.role).toEqual(newRole);
        expect(membership?.deactivatedAt).toBeNull();

        // Verify Stripe was NOT called (since this is just a role change)
        expect(stripeUpdateCalled).toEqual(false);
      },
    );

    test.each([
      OrganizationMembershipRole.member,
      OrganizationMembershipRole.admin,
    ])(
      "given: the user is an admin and deactivates another member with role %s, should: return 200 ok and deactivate the membership",
      async (initialTargetRole) => {
        // Add MSW event listener for Stripe subscription update
        let stripeUpdateCalled = false;
        const updateListener = ({ request }: { request: Request }) => {
          if (new URL(request.url).pathname.startsWith("/v1/subscriptions/")) {
            stripeUpdateCalled = true;
          }
        };
        server.events.on("response:mocked", updateListener);
        onTestFinished(() => {
          server.events.removeListener("response:mocked", updateListener);
        });

        const { user: adminUser, organization } =
          await setupUserWithOrgAndAddAsMember({
            role: OrganizationMembershipRole.admin,
          });
        const targetUser = await setupTargetMember(
          organization,
          initialTargetRole,
        );
        const snapshot = new Date();

        const actual = await sendAuthenticatedRequest({
          formData: toFormData({
            intent,
            role: "deactivated",
            userId: targetUser.id,
          }),
          organizationSlug: organization.slug,
          user: adminUser,
        });
        const expected = data({});

        expect(actual.data).toEqual(expected.data);
        expect(actual.init?.status).toEqual(expected.init?.status);

        // Verify target user is deactivated
        const membership =
          await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
            { organizationId: organization.id, userId: targetUser.id },
          );
        expect(membership?.role).toEqual(initialTargetRole); // Role shouldn't change on deactivation
        expect(membership?.deactivatedAt).not.toBeNull();
        expect(membership?.deactivatedAt?.getTime()).toBeGreaterThanOrEqual(
          snapshot.getTime(),
        );

        // Verify Stripe was called to decrease seats
        expect(stripeUpdateCalled).toEqual(true);
      },
    );

    // --- Owner Success Cases ---
    test.each([
      {
        initialTargetRole: OrganizationMembershipRole.member,
        newRole: OrganizationMembershipRole.admin,
      },
      {
        initialTargetRole: OrganizationMembershipRole.member,
        newRole: OrganizationMembershipRole.owner,
      },
      {
        initialTargetRole: OrganizationMembershipRole.admin,
        newRole: OrganizationMembershipRole.member,
      },
      {
        initialTargetRole: OrganizationMembershipRole.admin,
        newRole: OrganizationMembershipRole.owner,
      },
      {
        initialTargetRole: OrganizationMembershipRole.owner,
        newRole: OrganizationMembershipRole.admin,
      },
      {
        initialTargetRole: OrganizationMembershipRole.owner,
        newRole: OrganizationMembershipRole.member,
      },
    ])(
      "given: the user is an owner and changes another member from $initialTargetRole to $newRole, should: return 200 ok and update the role",
      async ({ initialTargetRole, newRole }) => {
        // Add MSW event listener for Stripe subscription update - but it shouldn't be called
        let stripeUpdateCalled = false;
        const updateListener = ({ request }: { request: Request }) => {
          if (new URL(request.url).pathname.startsWith("/v1/subscriptions/")) {
            stripeUpdateCalled = true;
          }
        };
        server.events.on("response:mocked", updateListener);
        onTestFinished(() => {
          server.events.removeListener("response:mocked", updateListener);
        });

        const { user: ownerUser, organization } =
          await setupUserWithOrgAndAddAsMember({
            role: OrganizationMembershipRole.owner,
          });
        const targetUser = await setupTargetMember(
          organization,
          initialTargetRole,
        );

        const actual = await sendAuthenticatedRequest({
          formData: toFormData({
            intent,
            role: newRole,
            userId: targetUser.id,
          }),
          organizationSlug: organization.slug,
          user: ownerUser,
        });
        const expected = data({});

        expect(actual.data).toEqual(expected.data);
        expect(actual.init?.status).toEqual(expected.init?.status);

        // Verify target user's role is updated
        const membership =
          await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
            { organizationId: organization.id, userId: targetUser.id },
          );
        expect(membership?.role).toEqual(newRole);
        expect(membership?.deactivatedAt).toBeNull();

        // Verify Stripe was NOT called (since this is just a role change)
        expect(stripeUpdateCalled).toEqual(false);
      },
    );

    test.each([
      OrganizationMembershipRole.member,
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ])(
      "given: the user is an owner and deactivates another member with role %s, should: return 200 ok and deactivate the membership",
      async (initialTargetRole) => {
        // Add MSW event listener for Stripe subscription update
        let stripeUpdateCalled = false;
        const updateListener = ({ request }: { request: Request }) => {
          if (new URL(request.url).pathname.startsWith("/v1/subscriptions/")) {
            stripeUpdateCalled = true;
          }
        };
        server.events.on("response:mocked", updateListener);
        onTestFinished(() => {
          server.events.removeListener("response:mocked", updateListener);
        });

        const { user: ownerUser, organization } =
          await setupUserWithOrgAndAddAsMember({
            role: OrganizationMembershipRole.owner,
          });
        const targetUser = await setupTargetMember(
          organization,
          initialTargetRole,
        );
        const snapshot = new Date();

        const actual = await sendAuthenticatedRequest({
          formData: toFormData({
            intent,
            role: "deactivated",
            userId: targetUser.id,
          }),
          organizationSlug: organization.slug,
          user: ownerUser,
        });
        const expected = data({});

        expect(actual.data).toEqual(expected.data);
        expect(actual.init?.status).toEqual(expected.init?.status);

        // Verify target user is deactivated
        const membership =
          await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
            { organizationId: organization.id, userId: targetUser.id },
          );
        expect(membership?.role).toEqual(initialTargetRole); // Role shouldn't change on deactivation
        expect(membership?.deactivatedAt).not.toBeNull();
        expect(membership?.deactivatedAt?.getTime()).toBeGreaterThanOrEqual(
          snapshot.getTime(),
        );

        // Verify Stripe was called to decrease seats
        expect(stripeUpdateCalled).toEqual(true);
      },
    );

    test("given: an owner on the lowest plan (low.monthly) reactivating a deactivated member, should: return 400 because the org is full", async () => {
      const { user: ownerUser, organization } =
        await setupUserWithOrgAndAddAsMember({
          lookupKey: priceLookupKeysByTierAndInterval.low.monthly,
          role: OrganizationMembershipRole.owner,
        });

      const targetUser = await setupTargetMember(
        organization,
        OrganizationMembershipRole.member,
      );
      await updateOrganizationMembershipInDatabase({
        data: { deactivatedAt: new Date() },
        organizationId: organization.id,
        userId: targetUser.id,
      });

      const actual = await sendAuthenticatedRequest({
        formData: toFormData({
          intent: CHANGE_ROLE_INTENT,
          role: OrganizationMembershipRole.member,
          userId: targetUser.id,
        }),
        organizationSlug: organization.slug,
        user: ownerUser,
      });
      const expected = badRequest({
        result: {
          error: {
            fieldErrors: {
              email: [
                "organizations:settings.teamMembers.inviteByEmail.form.organizationFull",
              ],
            },
            formErrors: [],
          },
        },
      });

      expect(actual).toMatchObject({ data: expected.data });

      expect(actual.init?.status).toEqual(expected.init?.status);

      // Verify toast
      const maybeToast = (actual.init?.headers as Headers)?.get("Set-Cookie");
      const { toast } = await getToast(
        new Request(createUrl(organization.slug), {
          headers: { cookie: maybeToast ?? "" },
        }),
      );
      expect(toast).toMatchObject({
        description: "You've used up all your available seats.",
        title: "Organization is full",
        type: "error",
      });

      const membership =
        await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
          {
            organizationId: organization.id,
            userId: targetUser.id,
          },
        );
      expect(membership?.deactivatedAt).not.toBeNull();
    });

    test("given: an owner on a trial plan with 25 members reactivating someone, should: return 400 because the org is full", async () => {
      const { user: ownerUser, organization } =
        await setupUserWithTrialOrgAndAddAsMember({
          role: OrganizationMembershipRole.owner,
        });
      await setupMultipleMembers({
        memberCount: 24,
        organizationId: organization.id,
      });

      const targetUser = await setupTargetMember(
        organization,
        OrganizationMembershipRole.member,
      );
      await updateOrganizationMembershipInDatabase({
        data: { deactivatedAt: new Date() },
        organizationId: organization.id,
        userId: targetUser.id,
      });

      const actual = await sendAuthenticatedRequest({
        formData: toFormData({
          intent: CHANGE_ROLE_INTENT,
          role: OrganizationMembershipRole.member,
          userId: targetUser.id,
        }),
        organizationSlug: organization.slug,
        user: ownerUser,
      });
      const expected = badRequest({
        result: {
          error: {
            fieldErrors: {
              email: [
                "organizations:settings.teamMembers.inviteByEmail.form.organizationFull",
              ],
            },
            formErrors: [],
          },
        },
      });

      expect(actual).toMatchObject({ data: expected.data });

      expect(actual.init?.status).toEqual(expected.init?.status);

      // Verify toast
      const maybeToast = (actual.init?.headers as Headers)?.get("Set-Cookie");
      const { toast } = await getToast(
        new Request(createUrl(organization.slug), {
          headers: { cookie: maybeToast ?? "" },
        }),
      );
      expect(toast).toMatchObject({
        description: "You've used up all your available seats.",
        title: "Organization is full",
        type: "error",
      });

      const membership =
        await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
          {
            organizationId: organization.id,
            userId: targetUser.id,
          },
        );
      expect(membership?.deactivatedAt).not.toBeNull();
    });
  });

  describe(`${INVITE_BY_EMAIL_INTENT} intent`, () => {
    const intent = INVITE_BY_EMAIL_INTENT;

    test.each([
      {
        body: {
          intent,
          role: OrganizationMembershipRole.member,
        },
        expected: badRequest({
          result: {
            error: {
              fieldErrors: {
                email: [
                  "organizations:settings.teamMembers.inviteByEmail.form.emailInvalid",
                ],
              },
              formErrors: [],
            },
          },
        }),
        given: "no email",
      },
      {
        body: {
          email: "not-an-email",
          intent,
          role: OrganizationMembershipRole.member,
        },
        expected: badRequest({
          result: {
            error: {
              fieldErrors: {
                email: [
                  "organizations:settings.teamMembers.inviteByEmail.form.emailInvalid",
                ],
              },
              formErrors: [],
            },
          },
        }),
        given: "invalid email format",
      },
      {
        body: { email: faker.internet.email(), intent },
        expected: badRequest({
          result: {
            error: {
              fieldErrors: {
                role: [
                  'Invalid option: expected one of "owner"|"admin"|"member"',
                ],
              },
              formErrors: [],
            },
          },
        }),
        given: "no role",
      },
      {
        body: {
          email: faker.internet.email(),
          intent,
          role: "invalid-role",
        },
        expected: badRequest({
          result: {
            error: {
              fieldErrors: {
                role: [
                  'Invalid option: expected one of "owner"|"admin"|"member"',
                ],
              },
              formErrors: [],
            },
          },
        }),
        given: "invalid role value",
      },
      {
        body: {
          email: faker.internet.email(),
          intent,
          role: "deactivated",
        },
        expected: badRequest({
          result: {
            error: {
              fieldErrors: {
                role: [
                  'Invalid option: expected one of "owner"|"admin"|"member"',
                ],
              },
              formErrors: [],
            },
          },
        }),
        given: 'role is "deactivated"', // This shouldn't be possible for invites
      },
    ])(
      "given: invalid form data ($given), should: return a 400 bad request",
      async ({ body, expected }) => {
        // Need an owner/admin to attempt the action, even with bad data,
        // to get past the initial permission check.
        const { user, organization } = await setupUserWithOrgAndAddAsMember({
          role: faker.helpers.arrayElement([
            OrganizationMembershipRole.admin,
            OrganizationMembershipRole.owner,
          ]),
        });

        const actual = await sendAuthenticatedRequest({
          formData: toFormData(body),
          organizationSlug: organization.slug,
          user,
        });

        expect(actual).toMatchObject({ data: expected.data });
      },
    );

    test("given: user is admin and tries to invite as owner, should: return 403 forbidden", async () => {
      const { user: adminUser, organization } =
        await setupUserWithOrgAndAddAsMember({
          role: OrganizationMembershipRole.admin,
        });
      const targetEmail = faker.internet.email();

      const actual = await sendAuthenticatedRequest({
        formData: toFormData({
          email: targetEmail,
          intent,
          role: OrganizationMembershipRole.owner,
        }),
        organizationSlug: organization.slug,
        user: adminUser,
      });

      const expected = forbidden({
        errors: {
          message: "Only organization owners can invite as owners.",
        },
      });

      expect(actual).toEqual(expected);

      // Verify no invite was created
      const invites =
        await retrieveActiveEmailInviteLinksFromDatabaseByOrganizationId(
          organization.id,
        );
      expect(invites).toEqual([]);
    });

    test("given: inviting a user that is already a member of the organization, should: return a 400 bad request", async () => {
      const { user: adminUser, organization } =
        await setupUserWithOrgAndAddAsMember({
          role: OrganizationMembershipRole.admin,
        });

      const targeEmail = adminUser.email;

      const actual = await sendAuthenticatedRequest({
        formData: toFormData({
          email: targeEmail,
          intent,
          role: OrganizationMembershipRole.member,
        }),
        organizationSlug: organization.slug,
        user: adminUser,
      });
      const expected = badRequest({
        result: {
          error: {
            fieldErrors: {
              email: [`${targeEmail} is already a member`],
            },
            formErrors: [],
          },
        },
      });

      expect(actual).toMatchObject({ data: expected.data });
    });

    test.each([
      {
        inviteeRole: OrganizationMembershipRole.member,
        inviterRole: OrganizationMembershipRole.admin,
      },
      {
        inviteeRole: OrganizationMembershipRole.admin,
        inviterRole: OrganizationMembershipRole.admin,
      },
      {
        inviteeRole: OrganizationMembershipRole.member,
        inviterRole: OrganizationMembershipRole.owner,
      },
      {
        inviteeRole: OrganizationMembershipRole.admin,
        inviterRole: OrganizationMembershipRole.owner,
      },
      {
        inviteeRole: OrganizationMembershipRole.owner,
        inviterRole: OrganizationMembershipRole.owner,
      },
    ])(
      "given: the user is an $inviterRole and invites as $inviteeRole, should: create an email invite, send email (mocked), and return 200 ok with success toast",
      async ({ inviterRole, inviteeRole }) => {
        const { user: inviterUser, organization } =
          await setupUserWithOrgAndAddAsMember({ role: inviterRole });
        const targetEmail = faker.internet.email();

        const actual = (await sendAuthenticatedRequest({
          formData: toFormData({
            email: targetEmail,
            intent,
            role: inviteeRole,
          }),
          organizationSlug: organization.slug,
          user: inviterUser,
        })) as DataWithResponseInit<Record<string, never>>;
        const expected = data({ success: targetEmail });

        // Check response is OK
        expect(actual.data).toEqual(expected.data);
        expect(actual.init?.status).toEqual(expected.init?.status);

        // Verify email invite was created in the database
        const invites =
          await retrieveActiveEmailInviteLinksFromDatabaseByOrganizationId(
            organization.id,
          );
        const createdInvite = invites.find(
          (invite) => invite.email === targetEmail,
        );

        expect(createdInvite).toBeDefined();
        expect(createdInvite?.role).toEqual(inviteeRole);
        expect(createdInvite?.organizationId).toEqual(organization.id);
        expect(createdInvite?.invitedById).toEqual(inviterUser.id);
        expect(createdInvite?.invitedBy?.name).toEqual(inviterUser.name);

        // Verify expiration date (approx 2 days from now)
        const expectedExpirationTime = subSeconds(addDays(new Date(), 2), 60);
        expect(createdInvite?.expiresAt.getTime()).toBeGreaterThanOrEqual(
          expectedExpirationTime.getTime(),
        );

        // Verify success toast header
        const maybeToast = (actual.init?.headers as Headers)?.get("Set-Cookie");
        const { toast } = await getToast(
          new Request(createUrl(organization.slug), {
            headers: { cookie: maybeToast ?? "" },
          }),
        );
        expect(toast).toMatchObject({
          id: expect.any(String) as string,
          title: "Email invitation sent",
          type: "success",
        });
      },
    );

    test("given: a user on the lowest plan (low.monthly) trying to invite anyone, should: return 400 because the org is full", async () => {
      const { user, organization } = await setupUserWithOrgAndAddAsMember({
        lookupKey: priceLookupKeysByTierAndInterval.low.monthly,
        role: OrganizationMembershipRole.owner,
      });

      const actual = await sendAuthenticatedRequest({
        formData: toFormData({
          email: faker.internet.email(),
          intent: INVITE_BY_EMAIL_INTENT,
          role: OrganizationMembershipRole.member,
        }),
        organizationSlug: organization.slug,
        user,
      });
      const expected = badRequest({
        result: {
          error: {
            fieldErrors: {
              email: [
                "organizations:settings.teamMembers.inviteByEmail.form.organizationFull",
              ],
            },
            formErrors: [],
          },
        },
      });

      expect(actual).toMatchObject({ data: expected.data });
    });

    test("given: a user on a trial plan with 25 members trying to invite, should: return 400 because the org is full", async () => {
      const { user, organization } = await setupUserWithTrialOrgAndAddAsMember({
        role: OrganizationMembershipRole.owner,
      });
      await setupMultipleMembers({
        memberCount: 24,
        organizationId: organization.id,
      });

      const actual = await sendAuthenticatedRequest({
        formData: toFormData({
          email: faker.internet.email(),
          intent: INVITE_BY_EMAIL_INTENT,
          role: OrganizationMembershipRole.member,
        }),
        organizationSlug: organization.slug,
        user,
      });
      const expected = badRequest({
        result: {
          error: {
            fieldErrors: {
              email: [
                "organizations:settings.teamMembers.inviteByEmail.form.organizationFull",
              ],
            },
            formErrors: [],
          },
        },
      });

      expect(actual).toMatchObject({ data: expected.data });
    });
  });
});
