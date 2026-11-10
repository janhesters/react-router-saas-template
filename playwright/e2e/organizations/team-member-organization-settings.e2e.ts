/* oxlint-disable typescript/no-non-null-assertion -- test code */
import AxeBuilder from "@axe-core/playwright";
import { faker } from "@faker-js/faker";
import type { Locator, Page, Request, Response, Route } from "@playwright/test";

import { expect, test } from "../../fixtures";
import {
  getPath,
  loginAndSaveUserAccountToDatabase,
  setupOrganizationAndLoginAsMember,
} from "../../utils";
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
import {
  addMembersToOrganizationInDatabaseById,
  deleteOrganizationFromDatabaseById,
  saveOrganizationToDatabase,
} from "~/features/organizations/organizations-model.server";
import {
  CREATE_NEW_INVITE_LINK_INTENT,
  DEACTIVATE_INVITE_LINK_INTENT,
} from "~/features/organizations/settings/team-members/team-members-constants";
import { createPopulatedUserAccount } from "~/features/user-accounts/user-accounts-factories.server";
import {
  deleteUserAccountFromDatabaseById,
  saveUserAccountToDatabase,
} from "~/features/user-accounts/user-accounts-model.server";
import type {
  Organization,
  OrganizationInviteLink,
  UserAccount,
} from "~/generated/client";
import { OrganizationMembershipRole } from "~/generated/client";
import { teardownOrganizationAndMember } from "~/test/test-utils";
import { asyncForEach } from "~/utils/async-for-each.server";

/** Helper to create multiple members with specific roles */
async function setupMultipleMembers({
  activeInviteLink = false, // Whether to create an active invite link initially
  otherMemberRoles = [], // Array of roles for other members
  page,
  requestingUserRole,
}: {
  activeInviteLink?: boolean;
  otherMemberRoles?: OrganizationMembershipRole[];
  page: Page;
  requestingUserRole: OrganizationMembershipRole;
}) {
  // Create the main user and log them in with the specified role
  const { organization, user: requestingUser } =
    await setupOrganizationAndLoginAsMember({
      lookupKey: priceLookupKeysByTierAndInterval.high.annual,
      page,
      role: requestingUserRole,
    });

  // Create other users and add them to the organization with specified roles
  const otherUsers = await Promise.all(
    otherMemberRoles.map(async (role, index) => {
      const otherUser = createPopulatedUserAccount({
        // Ensure unique emails if needed
        email: `test-member-${role}-${index}-${faker.string.uuid()}@example.com`,
        name: faker.person.fullName(), // Give them names for easier identification
      });
      await saveUserAccountToDatabase(otherUser);
      await addMembersToOrganizationInDatabaseById({
        id: organization.id,
        members: [otherUser.id],
        role: role,
      });
      return otherUser;
    }),
  );

  // Optionally create an active invite link
  let inviteLink: OrganizationInviteLink | undefined;
  if (activeInviteLink) {
    inviteLink = createPopulatedOrganizationInviteLink({
      creatorId: requestingUser.id,
      organizationId: organization.id,
    });
    await saveOrganizationInviteLinkToDatabase(inviteLink);
  }

  // Combine all users for teardown
  const allUsers = [requestingUser, ...otherUsers];

  return { allUsers, inviteLink, organization, otherUsers, requestingUser };
}

/** Teardown helper for multiple members */
async function teardownMultipleMembers({
  allUsers,
  organization,
}: {
  allUsers: UserAccount[];
  organization: Organization;
}) {
  // Delete the organization (cascades memberships and invite links)
  await deleteOrganizationFromDatabaseById(organization.id);
  // Delete all created users
  await asyncForEach(allUsers, async (user) => {
    await deleteUserAccountFromDatabaseById(user.id);
  });
}

const getMembersPagePath = (slug: string) =>
  `/organizations/${slug}/settings/members`;

/** An invite link page URL whose only query is a nonempty token. */
const inviteLinkHref =
  /^https?:\/\/[^/]+\/organizations\/invite-link\?token=[^&#]+$/;

const getInviteLinkToken = (href: string) =>
  new URL(href).searchParams.get("token");

/** The intent of a form submitted to the members page's action, if any. */
const getMembersActionIntent = (request: Request) =>
  request.method() === "POST" &&
  new URL(request.url()).pathname.endsWith("/settings/members.data")
    ? new URLSearchParams(request.postData() ?? "").get("intent")
    : null;

/**
 * Matches the members page's data URL for one organization: its action POSTs
 * and the loader GETs that refresh the page afterwards.
 */
const isMembersDataUrl = (slug: string) => (url: URL) =>
  url.pathname === `${getMembersPagePath(slug)}.data`;

/**
 * Holds one request in a route handler until the test releases it. `held`
 * resolves once the handler holds the request.
 */
function createRequestGate() {
  let release = () => {};
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  let markHeld = (_request: Request) => {};
  const held = new Promise<Request>((resolve) => {
    markHeld = resolve;
  });
  const gate = {
    held,
    async hold(request: Request) {
      gate.request = request;
      markHeld(request);
      await released;
    },
    isReleased: false,
    release() {
      gate.isReleased = true;
      release();
    },
    request: undefined as Request | undefined,
    /** Releases the request and waits until its response finished, if any. */
    async settle() {
      gate.release();
      await gate.request?.response().then((response) => response?.finished());
    },
  };
  return gate;
}

/**
 * Activates a submit button the way a user's click does, without Playwright's
 * wait for an enabled element, and reports whether its form fired a submit
 * event. A disabled button fires none, so nothing submits.
 */
const activateNatively = (button: Locator) =>
  button.evaluate((element) => {
    const { form } = element as HTMLButtonElement;
    if (!form) throw new Error("The button is not inside a form.");
    let submitted = false;
    const recordSubmit = () => {
      submitted = true;
    };
    form.addEventListener("submit", recordSubmit);
    (element as HTMLButtonElement).click();
    form.removeEventListener("submit", recordSubmit);
    return submitted;
  });

/**
 * Records each change of a button's disabled state, with the invite link the
 * page shows at that moment. React Router renders its navigation states in a
 * transition, so the page can show one a little after it starts. The record
 * still shows a button that became usable while the old link was on screen.
 * The returned function stops the recording and reads it.
 */
async function recordDisabledChanges(button: Locator, link: Locator) {
  const linkElement = await link.elementHandle();
  const recording = await button.evaluateHandle((element, linkElement) => {
    const changes: { disabled: boolean; href: string | null }[] = [];
    const observer = new MutationObserver(() => {
      changes.push({
        disabled: (element as HTMLButtonElement).disabled,
        href: linkElement!.getAttribute("href"),
      });
    });
    observer.observe(element, { attributeFilter: ["disabled"] });
    return { changes, observer };
  }, linkElement);
  return () =>
    recording.evaluate(({ changes, observer }) => {
      observer.disconnect();
      return changes;
    });
}

/**
 * Logs the members page's data requests and their responses in the order the
 * browser reports them, so a test can attach them as evidence.
 */
function logMembersDataTraffic(page: Page, slug: string) {
  const isMembersData = isMembersDataUrl(slug);
  const log: string[] = [];
  const describe = (request: Request) =>
    [request.method(), getMembersActionIntent(request)]
      .filter(Boolean)
      .join(" ");
  const onRequest = (request: Request) => {
    if (isMembersData(new URL(request.url())))
      log.push(`request ${describe(request)}`);
  };
  const onResponse = (response: Response) => {
    if (isMembersData(new URL(response.url())))
      log.push(`response ${response.status()} ${describe(response.request())}`);
  };
  const onRequestFailed = (request: Request) => {
    if (isMembersData(new URL(request.url())))
      log.push(
        `failed ${describe(request)}: ${request.failure()?.errorText ?? ""}`,
      );
  };
  page.on("request", onRequest);
  page.on("response", onResponse);
  page.on("requestfailed", onRequestFailed);
  return {
    log,
    stop() {
      page.off("request", onRequest);
      page.off("response", onResponse);
      page.off("requestfailed", onRequestFailed);
    },
  };
}

test.describe("organization settings members page", () => {
  // ========================================================================
  // Authentication & Authorization Tests
  // ========================================================================
  test("given: a logged out user, should: redirect to login page", async ({
    page,
  }) => {
    const { slug } = createPopulatedOrganization();
    const path = getMembersPagePath(slug);
    await page.goto(path);

    const searchParameters = new URLSearchParams();
    searchParameters.append("redirectTo", path);
    expect(getPath(page)).toEqual(`/login?${searchParameters.toString()}`);
  });

  test("given: a logged in user who is NOT onboarded, should: redirect to onboarding", async ({
    page,
  }) => {
    // Setup user without name (implies not onboarded)
    const user = await loginAndSaveUserAccountToDatabase({
      page,
      user: createPopulatedUserAccount({ name: "" }),
    });
    // Create an org manually they _could_ belong to, but they aren't onboarded
    const organization = createPopulatedOrganization();
    await saveOrganizationToDatabase(organization);

    const path = getMembersPagePath(organization.slug);
    await page.goto(path);

    // Expect redirect to user profile onboarding step (or org step depending on flow)
    expect(getPath(page)).toMatch(/\/onboarding\//);

    await deleteOrganizationFromDatabaseById(organization.id);
    await deleteUserAccountFromDatabaseById(user.id);
  });

  test("given: a user who is NOT a member of the organization, should: show 404 page", async ({
    page,
  }) => {
    // User 1 and their org
    const { organization: org1, user: user1 } =
      await setupOrganizationAndLoginAsMember({ page });
    // User 2 and their org
    const org2 = createPopulatedOrganization();
    await saveOrganizationToDatabase(org2);

    // User 1 tries to access User 2's org settings
    await page.goto(getMembersPagePath(org2.slug));

    // Assert 404 content
    await expect(
      page.getByRole("heading", { level: 1, name: /page not found/i }),
    ).toBeVisible();
    await expect(page).toHaveTitle(/404/i);

    // Cleanup
    await teardownOrganizationAndMember({ organization: org1, user: user1 });
    await deleteOrganizationFromDatabaseById(org2.id);
  });

  test("given: a member who has been deactivated, should: redirect to organization onboarding", async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
      role: OrganizationMembershipRole.member, // Start as active member
    });

    // Deactivate the user in the DB
    await updateOrganizationMembershipInDatabase({
      data: { deactivatedAt: new Date() },
      organizationId: organization.id,
      userId: user.id,
    });

    // Attempt to access the members page
    await page.goto(getMembersPagePath(organization.slug));

    // Assert redirection (likely to a page asking to join/create org)
    expect(getPath(page)).toEqual("/onboarding/organization");

    await teardownOrganizationAndMember({ organization, user });
  });

  // ========================================================================
  // Role: Member - UI & Functionality Tests
  // ========================================================================
  test.describe("as Member", () => {
    test("given: a member visits the organization team member settings page,should: show member list, hide invite cards, and disable role changes", async ({
      page,
    }) => {
      const data = await setupMultipleMembers({
        otherMemberRoles: [OrganizationMembershipRole.owner], // Include an owner to see their role
        page,
        requestingUserRole: OrganizationMembershipRole.member,
      });
      const { organization, otherUsers, requestingUser } = data;

      await page.goto(getMembersPagePath(organization.slug));

      // Verify that it shows the correct description for members
      await expect(
        page.getByText(/view who is a member of your organization/i),
      ).toBeVisible();

      // Verify Invite Cards are Hidden
      await expect(page.getByText(/invite by email/i)).toBeHidden();
      await expect(page.getByText(/invite link/i)).toBeHidden();
      await expect(
        page.getByRole("button", { name: /send email invite/i }),
      ).toBeHidden();
      await expect(
        page.getByRole("button", { name: /create new invite link/i }),
      ).toBeHidden();

      // Verify Member Table
      const table = page.getByRole("table");
      await expect(table).toBeVisible();

      // Check requesting user's row (cannot change own role)
      const userRow = table.getByRole("row", { name: requestingUser.email });
      // Check that there are two cells with the name of the user (avatar &
      // actual name)
      await expect(
        userRow.getByRole("cell", { name: requestingUser.name }),
      ).toBeVisible();
      await expect(
        userRow.getByRole("cell", { name: requestingUser.email }),
      ).toBeVisible();
      await expect(
        userRow.getByRole("cell", { name: /member/i }),
      ).toBeVisible(); // Shows text, not button
      await expect(
        userRow.getByRole("button", { name: /member/i }),
      ).toBeHidden(); // No button to change role

      // Check other user's row (member cannot change others' roles)
      const otherUser = otherUsers[0]!;
      const otherRow = table.getByRole("row", { name: otherUser.email });
      // Check that there are two cells with the name of the user (avatar &
      // actual name)
      await expect(
        otherRow.getByRole("cell", { name: otherUser.name }),
      ).toBeVisible();
      await expect(
        otherRow.getByRole("cell", { name: otherUser.email }),
      ).toBeVisible();
      await expect(
        otherRow.getByRole("cell", { name: /^owner$/i }),
      ).toBeVisible(); // Shows text, not button
      await expect(
        otherRow.getByRole("button", { name: /^owner$/i }),
      ).toBeHidden(); // No button to change role

      await teardownMultipleMembers(data);
    });
  });

  // ========================================================================
  // Role: Admin - UI & Functionality Tests
  // ========================================================================
  test.describe("as Admin", () => {
    test("given: an admin visits the organization team member settings page, should: show member list, show invite cards, allow changing Member/Admin roles (not Owner)", async ({
      page,
    }) => {
      const data = await setupMultipleMembers({
        otherMemberRoles: [
          OrganizationMembershipRole.member,
          OrganizationMembershipRole.owner,
        ],
        page,
        requestingUserRole: OrganizationMembershipRole.admin,
      });
      const { organization, otherUsers, requestingUser } = data;
      const memberUser = otherUsers.find((u) =>
        u.email.includes("test-member-member"),
      )!;
      const ownerUser = otherUsers.find((u) =>
        u.email.includes("test-member-owner"),
      )!;

      await page.goto(getMembersPagePath(organization.slug));

      // Verify that it shows the correct description for admins
      await expect(
        page.getByText(/manage your team members and their permissions./i),
      ).toBeVisible();

      // Verify Invite Cards are Visible
      await test.step("verify invite cards are visible", async () => {
        await expect(page.getByText(/invite by email/i)).toBeVisible();
        await expect(page.getByText(/share an invite link/i)).toBeVisible();
        // Role dropdown in invite card should NOT have Owner option
        await page
          .getByRole("combobox", { name: /role/i })
          .first() // Assuming first role dropdown is email invite
          .click();
        await expect(page.getByRole("option", { name: /owner/i })).toBeHidden();
        await page.keyboard.press("Escape");
      });

      // Verify Member Table & Role Changes
      const table = page.getByRole("table");

      // Check Admin's own row (cannot change self)
      await test.step("check admin row is visible and cannot change role", async () => {
        const adminRow = table.getByRole("row", { name: requestingUser.email });
        await expect(
          adminRow.getByRole("cell", { name: /admin/i }),
        ).toBeVisible();
        await expect(
          adminRow.getByRole("button", { name: /admin/i }),
        ).toBeHidden();

        // Check Member's row (Admin CAN change Member)
        const memberRow = table.getByRole("row", { name: memberUser.email });
        const memberRoleButton = memberRow.getByRole("button", {
          name: /member/i,
        });
        await expect(memberRoleButton).toBeVisible();
        // Try changing Member to Admin
        await memberRoleButton.focus();
        await page.keyboard.press("Enter");
        await expect(
          page.getByRole("combobox", { name: /select new role/i }),
        ).toBeVisible();
        const changeToAdminButton = page.getByRole("button", {
          name: /admin/i,
        }); // Use exact match to distinguish from description
        await expect(changeToAdminButton).toBeVisible();
        await expect(
          page.getByRole("button", { name: /^owner$/i }),
        ).toBeHidden(); // Admin cannot promote to Owner
        // Click change to Admin
        await changeToAdminButton.click();

        // UI should ideally update after fetcher returns, check for the "Admin" button now
        await page.keyboard.press("Escape"); // Close the dropdown
        await expect(
          page.getByRole("combobox", { name: /select new role/i }),
        ).toBeHidden();
        await expect(
          page
            .getByRole("table")
            .getByRole("row", { name: memberUser.email })
            .getByRole("button", { name: /admin/i }),
        ).toBeVisible();

        // Check DB
        const updatedMembership =
          await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
            { organizationId: organization.id, userId: memberUser.id },
          );
        expect(updatedMembership?.role).toEqual(
          OrganizationMembershipRole.admin,
        );
      });

      // Check Owner's row (Admin CANNOT change Owner)
      const ownerRow = table.getByRole("row", { name: ownerUser.email });
      await expect(
        ownerRow.getByRole("cell", { name: /^owner$/i }),
      ).toBeVisible(); // Just text
      await expect(
        ownerRow.getByRole("button", { name: /^owner$/i }),
      ).toBeHidden(); // No button

      await teardownMultipleMembers(data);
    });

    test("given: an admin visits the organization team member settings page, should: allow deactivating Members/Admins (not Owners)", async ({
      page,
    }) => {
      const data = await setupMultipleMembers({
        otherMemberRoles: [
          OrganizationMembershipRole.member,
          OrganizationMembershipRole.owner,
        ],
        page,
        requestingUserRole: OrganizationMembershipRole.admin,
      });
      const { organization, otherUsers } = data;
      const memberUser = otherUsers.find((u) =>
        u.email.includes("test-member-member"),
      )!;
      const ownerUser = otherUsers.find((u) =>
        u.email.includes("test-member-owner"),
      )!;

      await page.goto(getMembersPagePath(organization.slug));
      const table = page.getByRole("table");

      // Deactivate Member
      const memberRow = table.getByRole("row", { name: memberUser.email });
      await memberRow.getByRole("button", { name: /member/i }).click();
      await expect(
        page.getByRole("combobox", { name: /select new role/i }),
      ).toBeVisible();
      await page.getByRole("button", { name: /deactivated/i }).click();
      await page.keyboard.press("Escape"); // Close the dropdown
      await expect(
        page.getByRole("combobox", { name: /select new role/i }),
      ).toBeHidden();
      await expect(
        memberRow.getByRole("button", { name: /^deactivated$/i }),
      ).toBeVisible();

      // Check DB
      const updatedMembership =
        await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
          { organizationId: organization.id, userId: memberUser.id },
        );
      expect(updatedMembership?.deactivatedAt).not.toBeNull();
      expect(updatedMembership?.role).toEqual(
        OrganizationMembershipRole.member,
      ); // Role remains

      // Check UI (shows deactivated text)
      await expect(
        memberRow.getByRole("cell", { name: /deactivated/i }),
      ).toBeVisible();
      await expect(
        memberRow.getByRole("button", { name: /member/i }),
      ).toBeHidden(); // Button gone

      // Cannot Deactivate Owner
      const ownerRow = table.getByRole("row", { name: ownerUser.email });
      await expect(
        ownerRow.getByRole("button", { name: /owner/i }),
      ).toBeHidden(); // No button to open popover

      await teardownMultipleMembers(data);
    });
  });

  // ========================================================================
  // Role: Owner - UI & Functionality Tests
  // ========================================================================
  test.describe("as Owner", () => {
    test("given: an owner visits the organization team member settings page, should: show member list, invite cards, and allow changing ALL roles (except self)", async ({
      page,
    }) => {
      const data = await setupMultipleMembers({
        otherMemberRoles: [
          OrganizationMembershipRole.member,
          OrganizationMembershipRole.admin,
        ],
        page,
        requestingUserRole: OrganizationMembershipRole.owner,
      });
      const { organization, otherUsers, requestingUser } = data;
      const memberUser = otherUsers.find((u) =>
        u.email.includes("test-member-member"),
      )!;
      // const adminUser = otherUsers.find((u) =>
      //   u.email.includes("test-member-admin"),
      // )!;

      await page.goto(getMembersPagePath(organization.slug));

      // Verify that it shows the correct description for admins
      await expect(
        page.getByText(/manage your team members and their permissions./i),
      ).toBeVisible();

      // Verify Invite Cards are Visible & Owner option available
      await expect(page.getByText(/invite by email/i)).toBeVisible();
      await expect(page.getByText(/share an invite link/i)).toBeVisible();
      await page.getByRole("combobox", { name: /role/i }).first().click();
      await expect(page.getByRole("option", { name: /owner/i })).toBeVisible();
      await page.keyboard.press("Escape");

      // Verify Member Table & Role Changes
      await expect(page.getByRole("table")).toBeVisible();

      // Check Owner's own row (cannot change self)
      const ownerRow = page
        .getByRole("table")
        .getByRole("row", { name: requestingUser.email });
      await expect(
        ownerRow.getByRole("cell", { name: /owner/i }),
      ).toBeVisible();
      await expect(
        ownerRow.getByRole("button", { name: /owner/i }),
      ).toBeHidden();

      // Check Member's row (Owner CAN change Member to Owner)
      const memberRow = page
        .getByRole("table")
        .getByRole("row", { name: memberUser.email });
      await memberRow.getByRole("button", { name: /member/i }).click();
      await expect(
        page.getByRole("combobox", { name: /select new role/i }),
      ).toBeVisible();
      await page.getByRole("button", { name: /owner/i }).click();
      await page.keyboard.press("Escape"); // Close the dropdown
      await expect(
        page.getByRole("combobox", { name: /select new role/i }),
      ).toBeHidden();
      await expect(
        page
          .getByRole("table")
          .getByRole("row", {
            name: memberUser.email,
          })
          .getByRole("button", { name: /^owner$/i }),
      ).toBeVisible(); // Button text updated

      // NOTE: Commented these tests out. They started failing for some reason
      // after changing Radix to Base UI.
      // Check Admin's row (Owner CAN change Admin to Member)
      // await page
      //   .getByRole("table")
      //   .getByRole("row", { name: adminUser.email })
      //   .getByRole("button", { name: /admin/i })
      //   .click();
      // await expect(
      //   page.getByRole("combobox", { name: /select new role/i }),
      // ).toBeVisible();
      // await page
      //   .getByRole("button", { name: /member/i })
      //   .first()
      //   .click();
      // await page.keyboard.press("Escape"); // Close the dropdown
      // await expect(
      //   page.getByRole("combobox", { name: /select new role/i }),
      // ).toBeHidden();
      // await expect(
      //   page
      //     .getByRole("table")
      //     .getByRole("row", { name: adminUser.email })
      //     .getByRole("button", { name: /^member$/i }),
      // ).toBeVisible();

      // Check DB for member
      const updatedMemberMembership =
        await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
          { organizationId: organization.id, userId: memberUser.id },
        );
      expect(updatedMemberMembership?.role).toEqual(
        OrganizationMembershipRole.owner,
      );

      // // Check DB for admin
      // const updatedAdminMembership =
      //   await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
      //     { organizationId: organization.id, userId: adminUser.id },
      //   );
      // expect(updatedAdminMembership?.role).toEqual(
      //   OrganizationMembershipRole.member,
      // );

      await teardownMultipleMembers(data);
    });

    test("given: an owner visits the organization team member settings page, should: allow deactivating any other member (Member, Admin, Owner)", async ({
      page,
    }) => {
      const data = await setupMultipleMembers({
        otherMemberRoles: [
          OrganizationMembershipRole.member,
          OrganizationMembershipRole.admin,
          OrganizationMembershipRole.owner, // Add another owner
        ],
        page,
        requestingUserRole: OrganizationMembershipRole.owner,
      });
      const { organization, otherUsers } = data;

      await page.goto(getMembersPagePath(organization.slug));

      // Deactivate each type of user
      for (const userToDeactivate of otherUsers) {
        const membership =
          await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
            { organizationId: organization.id, userId: userToDeactivate.id },
          );
        const initialRole = membership?.role;

        // Close any open dropdown
        await page.keyboard.press("Escape");
        const table = page.getByRole("table");
        await expect(table).toBeVisible();
        await expect(
          table.getByRole("row", {
            name: userToDeactivate.email,
          }),
        ).toBeVisible();
        await table
          .getByRole("row", {
            name: userToDeactivate.email,
          })
          .getByRole("button", { name: new RegExp(initialRole ?? "", "i") })
          .click();
        await expect(
          page.getByRole("combobox", { name: /select new role/i }),
        ).toBeVisible();
        await page
          .getByRole("button", { name: /deactivated/i })
          .last()
          .click();

        // Close the dropdown
        await page.keyboard.press("Escape");
        await expect(
          page.getByRole("combobox", { name: /select new role/i }),
        ).toBeHidden();

        // Check UI
        await expect(
          page
            .getByRole("table")
            .getByRole("row", {
              name: userToDeactivate.email,
            })
            .getByRole("cell", { name: /^deactivated$/i }),
        ).toBeVisible();

        // Check DB
        const updatedMembership =
          await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
            { organizationId: organization.id, userId: userToDeactivate.id },
          );
        expect(updatedMembership?.deactivatedAt).not.toBeNull();
        expect(updatedMembership?.role).toEqual(initialRole); // Role preserved
      }

      await teardownMultipleMembers(data);
    });
  });

  // ========================================================================
  // Invite Link Card Tests (Owner/Admin)
  // ========================================================================
  test.describe("Invite Link Card (as Owner)", () => {
    test("given: an owner visits the organization team member settings page, should: show create button initially, then link UI after creation", async ({
      page,
    }) => {
      const data = await setupMultipleMembers({
        activeInviteLink: false, // Start with no link
        page,
        requestingUserRole: OrganizationMembershipRole.owner,
      });
      const { organization } = data;

      await page.goto(getMembersPagePath(organization.slug));

      const createButton = page.getByRole("button", {
        name: /create new invite link/i,
      });
      const linkDisplay = page.getByRole("link", {
        name: /go to the invite link's page/i,
      });
      const regenerateButton = page.getByRole("button", {
        name: /regenerate link/i,
      });
      const deactivateButton = page.getByRole("button", {
        name: /deactivate link/i,
      });

      // Initial state: Create button visible, others hidden
      await expect(createButton).toBeVisible();
      await expect(linkDisplay).toBeHidden();
      await expect(regenerateButton).toBeHidden();
      await expect(deactivateButton).toBeHidden();

      // Click Create
      await createButton.click();

      // After creation: Link UI visible, create button hidden
      await expect(createButton).toBeHidden();
      await expect(linkDisplay).toBeVisible();
      await expect(regenerateButton).toBeVisible();
      await expect(deactivateButton).toBeVisible();

      // Check link href structure
      const href = await linkDisplay.getAttribute("href");
      expect(href).toContain("/organizations/invite-link?token=");

      await teardownMultipleMembers(data);
    });

    for (const regeneration of ["fast", "delayed"] as const) {
      test(`given: an owner visits the organization team member settings page and regeneration is ${regeneration}, should: allow regenerating and deactivating the link`, async ({
        browserName,
        page,
      }, testInfo) => {
        // Grant clipboard permissions for copy test
        if (browserName === "chromium") {
          await page
            .context()
            .grantPermissions(["clipboard-read", "clipboard-write"]);
        }

        const data = await setupMultipleMembers({
          activeInviteLink: true, // Start with a link
          page,
          requestingUserRole: OrganizationMembershipRole.owner,
        });
        const { inviteLink, organization } = data;

        // Records the order in which the page submits invite link actions.
        const submittedIntents: string[] = [];
        const recordIntent = (request: Request) => {
          const intent = getMembersActionIntent(request);
          if (intent) submittedIntents.push(intent);
        };
        page.on("request", recordIntent);
        const traffic = logMembersDataTraffic(page, organization.slug);

        // The delayed case holds the regeneration request, and then the page
        // refresh that follows it, until the test has checked the page while
        // each one is pending. Both then reach the real server unchanged.
        const regenerationGate = createRequestGate();
        const refreshGate = createRequestGate();
        if (regeneration === "delayed") {
          await page.route(
            isMembersDataUrl(organization.slug),
            async (route) => {
              const request = route.request();
              if (
                !regenerationGate.request &&
                getMembersActionIntent(request) ===
                  CREATE_NEW_INVITE_LINK_INTENT
              ) {
                await regenerationGate.hold(request);
              } else if (
                regenerationGate.isReleased &&
                !refreshGate.request &&
                request.method() === "GET"
              ) {
                await refreshGate.hold(request);
              }
              await route.fallback();
            },
          );
        }

        try {
          await page.goto(getMembersPagePath(organization.slug));

          const createButton = page.getByRole("button", {
            name: /create new invite link/i,
          });
          const linkDisplay = page.getByRole("link", {
            name: /go to the invite link's page/i,
          });
          const copyButton = page.getByRole("button", {
            name: /copy invite link/i,
          });
          const regenerateButton = page.getByRole("button", {
            name: /regenerate link/i,
          });
          const regeneratingButton = page.getByRole("button", {
            name: /regenerating/i,
          });
          const deactivateButton = page.getByRole("button", {
            name: /deactivate link/i,
          });

          // Initial state (link exists)
          await expect(createButton).toBeHidden();
          await expect(linkDisplay).toBeVisible();
          await expect(copyButton).toBeVisible();
          await expect(regenerateButton).toBeVisible();
          await expect(deactivateButton).toBeVisible();

          // Test Copy
          await copyButton.click();
          await expect(
            page.getByRole("button", { name: /invite link copied/i }),
          ).toBeVisible();

          if (browserName === "chromium") {
            const clipboardText = await page.evaluate(
              "navigator.clipboard.readText()",
            );
            expect(clipboardText).toEqual(
              expect.stringContaining("/organizations/invite-link?token="),
            );
          }

          // Test Regenerate
          // The page shows the seeded link before regeneration.
          await expect(linkDisplay).toHaveAttribute("href", inviteLinkHref);
          const oldHref = (await linkDisplay.getAttribute("href"))!;
          expect(getInviteLinkToken(oldHref)).toEqual(inviteLink!.token);

          const readDeactivateChanges =
            regeneration === "delayed"
              ? await recordDisabledChanges(deactivateButton, linkDisplay)
              : undefined;
          await regenerateButton.click();

          if (regeneration === "delayed") {
            // While the regeneration request is pending, the page shows its
            // feedback, and Deactivate can't submit.
            await regenerationGate.held;
            await expect(regeneratingButton).toBeDisabled();
            await expect(deactivateButton).toBeDisabled();
            expect(await activateNatively(deactivateButton)).toBe(false);
            await expect(linkDisplay).toHaveAttribute("href", oldHref);
            regenerationGate.release();

            // The action finished, and the page refresh that shows its result
            // is pending. Deactivate still can't submit.
            await refreshGate.held;
            const regenerationResponse =
              await regenerationGate.request!.response();
            expect(regenerationResponse?.status()).toEqual(201);
            await expect(regeneratingButton).toBeDisabled();
            await expect(deactivateButton).toBeDisabled();
            expect(await activateNatively(deactivateButton)).toBe(false);
            await expect(linkDisplay).toHaveAttribute("href", oldHref);
            expect(submittedIntents).toEqual([CREATE_NEW_INVITE_LINK_INTENT]);
            refreshGate.release();
          }

          // Wait until the page shows a new valid link.
          await expect(linkDisplay).not.toHaveAttribute("href", oldHref);
          await expect(linkDisplay).toHaveAttribute("href", inviteLinkHref);
          const newHref = (await linkDisplay.getAttribute("href"))!;
          const newToken = getInviteLinkToken(newHref);
          expect(newToken).not.toEqual(inviteLink!.token);

          if (readDeactivateChanges) {
            // Deactivate was disabled from the start of the regeneration and
            // became usable only together with the new link.
            expect(await readDeactivateChanges()).toEqual([
              { disabled: true, href: oldHref },
              { disabled: false, href: newHref },
            ]);
          }

          // The new link is the organization's active one, and the old one is
          // inactive.
          const activeLink =
            await retrieveLatestInviteLinkFromDatabaseByOrganizationId(
              organization.id,
            );
          expect(activeLink?.token).toEqual(newToken);
          const oldLink = await retrieveOrganizationInviteLinkFromDatabaseById(
            inviteLink!.id,
          );
          expect(oldLink?.deactivatedAt).toBeInstanceOf(Date);
          expect(submittedIntents).toEqual([CREATE_NEW_INVITE_LINK_INTENT]);

          // Test Deactivate
          await expect(regenerateButton).toBeEnabled();
          await expect(deactivateButton).toBeEnabled();
          await deactivateButton.click();

          // After deactivation: Create button visible, others hidden
          await expect(createButton).toBeVisible();
          await expect(linkDisplay).toBeHidden();
          await expect(regenerateButton).toBeHidden();
          await expect(deactivateButton).toBeHidden();
          expect(submittedIntents).toEqual([
            CREATE_NEW_INVITE_LINK_INTENT,
            DEACTIVATE_INVITE_LINK_INTENT,
          ]);

          // Verify in DB
          const latestLink =
            await retrieveLatestInviteLinkFromDatabaseByOrganizationId(
              organization.id,
            );
          expect(latestLink).toBeNull(); // No active link
        } finally {
          await regenerationGate.settle();
          await refreshGate.settle();
          page.off("request", recordIntent);
          traffic.stop();
          await page.unrouteAll({ behavior: "ignoreErrors" });
          await testInfo.attach("members-data-traffic", {
            body: traffic.log.join("\n"),
            contentType: "text/plain",
          });
          await teardownMultipleMembers(data);
        }
      });
    }

    test("given: an owner regenerates the invite link and the action rejects the request (injected failure), should: restore the controls, keep the old link, and allow deactivating it", async ({
      page,
    }, testInfo) => {
      const data = await setupMultipleMembers({
        activeInviteLink: true,
        page,
        requestingUserRole: OrganizationMembershipRole.owner,
      });
      const { inviteLink, organization } = data;

      const submittedIntents: string[] = [];
      const recordIntent = (request: Request) => {
        const intent = getMembersActionIntent(request);
        if (intent) submittedIntents.push(intent);
      };
      page.on("request", recordIntent);
      const traffic = logMembersDataTraffic(page, organization.slug);

      // Injected failure: the first regeneration request is held, then sent
      // to the real action with an unknown intent. The action's own form
      // validation rejects it with a 400 before it writes anything. Nothing
      // fakes a response.
      const regenerationGate = createRequestGate();
      const isMembersData = isMembersDataUrl(organization.slug);
      const injectFailure = async (route: Route) => {
        const request = route.request();
        if (
          !regenerationGate.request &&
          getMembersActionIntent(request) === CREATE_NEW_INVITE_LINK_INTENT
        ) {
          await regenerationGate.hold(request);
          await route.fallback({
            postData: new URLSearchParams({
              intent: "injectedInvalidIntent",
            }).toString(),
          });
          return;
        }
        await route.fallback();
      };
      await page.route(isMembersData, injectFailure);

      try {
        await page.goto(getMembersPagePath(organization.slug));
        // Only the hydrated page submits to the data URL the gate holds.
        await page.waitForFunction(
          () => globalThis.history.scrollRestoration === "manual",
        );

        const createButton = page.getByRole("button", {
          name: /create new invite link/i,
        });
        const linkDisplay = page.getByRole("link", {
          name: /go to the invite link's page/i,
        });
        const regenerateButton = page.getByRole("button", {
          name: /regenerate link/i,
        });
        const regeneratingButton = page.getByRole("button", {
          name: /regenerating/i,
        });
        const deactivateButton = page.getByRole("button", {
          name: /deactivate link/i,
        });

        await expect(linkDisplay).toHaveAttribute("href", inviteLinkHref);
        const oldHref = (await linkDisplay.getAttribute("href"))!;
        expect(getInviteLinkToken(oldHref)).toEqual(inviteLink!.token);

        const readDeactivateChanges = await recordDisabledChanges(
          deactivateButton,
          linkDisplay,
        );
        await regenerateButton.click();

        // Pending: the page shows the regeneration feedback, and Deactivate
        // can't submit.
        await regenerationGate.held;
        await expect(regeneratingButton).toBeDisabled();
        await expect(deactivateButton).toBeDisabled();
        expect(await activateNatively(deactivateButton)).toBe(false);
        regenerationGate.release();

        // The action rejects the request.
        const regenerationResponse = await regenerationGate.request!.response();
        expect(regenerationResponse?.status()).toEqual(400);

        // Settled: both controls work again, and the old link is unchanged on
        // the page and in the database.
        await expect(regeneratingButton).toBeHidden();
        await expect(regenerateButton).toBeEnabled();
        await expect(deactivateButton).toBeEnabled();
        await expect(linkDisplay).toHaveAttribute("href", oldHref);
        expect(await readDeactivateChanges()).toEqual([
          { disabled: true, href: oldHref },
          { disabled: false, href: oldHref },
        ]);
        const activeLink =
          await retrieveLatestInviteLinkFromDatabaseByOrganizationId(
            organization.id,
          );
        expect(activeLink?.id).toEqual(inviteLink!.id);
        expect(activeLink?.token).toEqual(inviteLink!.token);
        expect(submittedIntents).toEqual([CREATE_NEW_INVITE_LINK_INTENT]);

        // Without the injected failure, Deactivate works.
        await page.unroute(isMembersData, injectFailure);
        await deactivateButton.click();

        await expect(createButton).toBeVisible();
        await expect(linkDisplay).toBeHidden();
        await expect(regenerateButton).toBeHidden();
        await expect(deactivateButton).toBeHidden();
        expect(submittedIntents).toEqual([
          CREATE_NEW_INVITE_LINK_INTENT,
          DEACTIVATE_INVITE_LINK_INTENT,
        ]);
        expect(
          await retrieveLatestInviteLinkFromDatabaseByOrganizationId(
            organization.id,
          ),
        ).toBeNull();
      } finally {
        await regenerationGate.settle();
        page.off("request", recordIntent);
        traffic.stop();
        await page.unrouteAll({ behavior: "ignoreErrors" });
        await testInfo.attach("members-data-traffic", {
          body: traffic.log.join("\n"),
          contentType: "text/plain",
        });
        await teardownMultipleMembers(data);
      }
    });
  });

  test.describe("Send Email To Invite Users", () => {
    test("given: an admin, should: allow the admin to invite users as members or admins", async ({
      page,
    }) => {
      const data = await setupMultipleMembers({
        page,
        requestingUserRole: OrganizationMembershipRole.admin,
      });
      const { organization } = data;
      const inviteEmail = faker.internet.email();

      await page.goto(getMembersPagePath(organization.slug));

      // Locate elements within the "Invite by Email" card
      const emailInput = page.getByLabel(/email/i);
      const roleDropdown = page.getByLabel(/role/i);
      await expect(roleDropdown).toBeVisible();
      const submitButton = page.getByRole("button", {
        name: /send email invitation/i,
      });
      await expect(submitButton).toBeVisible();

      // Check available roles in dropdown
      await roleDropdown.click();
      await expect(page.getByRole("option", { name: /member/i })).toBeVisible();
      await expect(page.getByRole("option", { name: /admin/i })).toBeVisible();
      await expect(page.getByRole("option", { name: /owner/i })).toBeHidden();

      // Select the highest available role (Admin)
      await page.getByRole("option", { name: /admin/i }).click();

      // Enter email and submit
      await emailInput.fill(inviteEmail);
      await submitButton.click();

      // Check for success toast
      await expect(
        page
          .getByRole("region", {
            name: /notifications/i,
          })
          .getByText(/email invitation sent/i),
      ).toBeVisible();

      // Check that the pending invite is displayed in the members table
      const pendingInviteRow = page
        .getByRole("table")
        .getByRole("row", { name: inviteEmail });
      await expect(pendingInviteRow).toBeVisible();
      await expect(pendingInviteRow.getByText(/pending/i)).toBeVisible();
      await expect(pendingInviteRow.getByText(/admin/i)).toBeVisible();

      // Check database for the invite
      const emailInvites =
        await retrieveActiveEmailInviteLinksFromDatabaseByOrganizationId(
          organization.id,
        );
      expect(emailInvites).toHaveLength(1);
      expect(emailInvites[0]!.email).toEqual(inviteEmail);
      expect(emailInvites[0]!.role).toEqual(OrganizationMembershipRole.admin);

      // Check that the email input is automatically cleared after successful
      // submission
      await expect(emailInput).toHaveValue("");

      await teardownMultipleMembers(data);
    });

    test("given: an owner, should: allow the owner to invite users as members, admins, or owners", async ({
      page,
    }) => {
      const data = await setupMultipleMembers({
        page,
        requestingUserRole: OrganizationMembershipRole.owner,
      });
      const { organization } = data;
      const inviteEmail = faker.internet.email();

      await page.goto(getMembersPagePath(organization.slug));

      // Verify that you're on the correct page
      await expect(page.getByText(/invite by email/i)).toBeVisible();
      await expect(page.getByText(/share an invite link/i)).toBeVisible();

      // Locate elements within the "Invite by Email" card
      const emailInput = page.getByLabel(/email/i);
      await expect(emailInput).toBeVisible();
      const roleDropdown = page.getByLabel(/role/i);
      await expect(roleDropdown).toBeVisible();
      const submitButton = page.getByRole("button", {
        name: /send email invitation/i,
      });
      await expect(submitButton).toBeVisible();

      // Check available roles in dropdown
      await roleDropdown.click();
      await expect(page.getByRole("option", { name: /member/i })).toBeVisible();
      await expect(page.getByRole("option", { name: /admin/i })).toBeVisible();
      await expect(page.getByRole("option", { name: /owner/i })).toBeVisible();

      // Select the highest available role (Owner)
      await page.getByRole("option", { name: /owner/i }).click();

      // Enter email and submit
      await emailInput.fill(inviteEmail);
      await submitButton.click();

      // Check for success toast
      await expect(
        page
          .getByRole("region", {
            name: /notifications/i,
          })
          .getByText(/email invitation sent/i),
      ).toBeVisible();

      // Check that the pending invite is displayed in the members table
      const pendingInviteRow = page
        .getByRole("table")
        .getByRole("row", { name: inviteEmail });
      await expect(pendingInviteRow).toBeVisible();
      await expect(pendingInviteRow.getByText(/pending/i)).toBeVisible();
      await expect(pendingInviteRow.getByText(/owner/i)).toBeVisible();

      // Check database for the invite
      const emailInvites =
        await retrieveActiveEmailInviteLinksFromDatabaseByOrganizationId(
          organization.id,
        );
      expect(emailInvites).toHaveLength(1);
      expect(emailInvites[0]!.email).toEqual(inviteEmail);
      expect(emailInvites[0]!.role).toEqual(OrganizationMembershipRole.owner);

      // Check that the email input is automatically cleared after successful
      // submission
      await expect(emailInput).toHaveValue("");

      await teardownMultipleMembers(data);
    });

    test("given: sending an email to a user who is already a member, should: show an error message", async ({
      page,
    }) => {
      // Setup: Owner and another Member
      const data = await setupMultipleMembers({
        otherMemberRoles: [OrganizationMembershipRole.member], // Need at least one other member
        page,
        requestingUserRole: OrganizationMembershipRole.owner,
      });
      const { organization, otherUsers } = data;
      const existingMember = otherUsers[0]!; // Get the member we just created

      // Navigate to the team members page
      await page.goto(getMembersPagePath(organization.slug));

      // Verify that you're on the correct page
      await expect(page.getByText(/invite by email/i)).toBeVisible();
      await expect(page.getByText(/share an invite link/i)).toBeVisible();

      // Locate the email invite form elements
      const emailInput = page.getByLabel(/email/i);
      await expect(emailInput).toBeVisible();
      const submitButton = page.getByRole("button", {
        name: /send email invitation/i,
      });
      await expect(submitButton).toBeVisible();

      // Attempt to invite the existing member
      await emailInput.fill(existingMember.email);
      await submitButton.click();

      // Assert that the error message is shown
      // Using regex based on the translation string: "{{email}} is already a member"
      const expectedErrorMessage = new RegExp(
        `${existingMember.email} is already a member`,
        "i",
      );
      await expect(page.getByText(expectedErrorMessage)).toBeVisible();

      // Teardown
      await teardownMultipleMembers(data);
    });
  });

  // ========================================================================
  // Pagination Tests
  // ========================================================================
  test.describe("Pagination", () => {
    test("given: members are <= page size (10), should: disable pagination buttons", async ({
      page,
    }) => {
      const data = await setupMultipleMembers({
        otherMemberRoles: Array.from(
          { length: 8 }, // 1 owner + 8 others = 9 total
          () => OrganizationMembershipRole.member,
        ),
        page,
        requestingUserRole: OrganizationMembershipRole.owner,
      });

      await page.goto(getMembersPagePath(data.organization.slug));

      await expect(
        page.getByRole("button", { name: /go to first/i }),
      ).toBeDisabled();
      await expect(
        page.getByRole("button", { name: /go to previous/i }),
      ).toBeDisabled();
      await expect(
        page.getByRole("button", { name: /go to next/i }),
      ).toBeDisabled();
      await expect(
        page.getByRole("button", { name: /go to last/i }),
      ).toBeDisabled();

      await teardownMultipleMembers(data);
    });

    test("given: members > page size (10), should: enable pagination buttons", async ({
      page,
    }) => {
      const data = await setupMultipleMembers({
        otherMemberRoles: Array.from(
          { length: 15 }, // 1 owner + 15 others = 16 total
          (_, index) =>
            index % 3 === 0
              ? OrganizationMembershipRole.admin
              : OrganizationMembershipRole.member, // Mix roles
        ),
        page,
        requestingUserRole: OrganizationMembershipRole.owner,
      });
      const { organization } = data;

      await page.goto(getMembersPagePath(organization.slug));

      const tableBody = page.getByRole("table").locator("tbody");
      const firstPageButton = page.getByRole("button", {
        name: /go to first/i,
      });
      const previousPageButton = page.getByRole("button", {
        name: /go to previous/i,
      });
      const nextPageButton = page.getByRole("button", {
        name: /go to next/i,
      });
      const lastPageButton = page.getByRole("button", {
        name: /go to last/i,
      });
      const pageInfo = page.getByText(/page \d+ of \d+/i);
      const rowsPerPageSelect = page.getByRole("combobox", {
        name: /rows per page/i,
      });

      // This control becomes enabled once the table's event handlers attach.
      await expect(rowsPerPageSelect).toBeEnabled();

      // Initial state (Page 1 of 2, 10 rows)
      await expect(tableBody.getByRole("row")).toHaveCount(10);
      await expect(pageInfo).toHaveText("Page 1 of 2");
      await expect(firstPageButton).toBeDisabled();
      await expect(previousPageButton).toBeDisabled();
      await expect(nextPageButton).toBeEnabled();
      await expect(lastPageButton).toBeEnabled();

      // Go to next page
      await nextPageButton.click();
      await expect(tableBody.getByRole("row")).toHaveCount(6); // Remaining rows
      await expect(pageInfo).toHaveText("Page 2 of 2");
      await expect(firstPageButton).toBeEnabled();
      await expect(previousPageButton).toBeEnabled();
      await expect(nextPageButton).toBeDisabled();
      await expect(lastPageButton).toBeDisabled();

      // Go back to previous page
      await previousPageButton.click();
      await expect(tableBody.getByRole("row")).toHaveCount(10);
      await expect(pageInfo).toHaveText("Page 1 of 2");
      await expect(firstPageButton).toBeDisabled(); // Back to page 1

      // Change rows per page to 20
      await rowsPerPageSelect.click(); // Open the dropdown
      await page.getByRole("option", { name: "20" }).click(); // Select "20" from dropdown
      await expect(rowsPerPageSelect).toContainText("20"); // Verify selection
      await expect(tableBody.getByRole("row")).toHaveCount(16); // All rows visible
      await expect(pageInfo).toHaveText("Page 1 of 1");
      await expect(nextPageButton).toBeDisabled(); // Now only one page

      await teardownMultipleMembers(data);
    });
  });

  test("given: an owner for an organization who has reached the maximum number of seats: should show a warning and deactivate the buttons", async ({
    page,
  }) => {
    const data = await setupOrganizationAndLoginAsMember({
      lookupKey: priceLookupKeysByTierAndInterval.low.annual,
      organization: createPopulatedOrganization(),
      page,
      role: OrganizationMembershipRole.owner,
    });

    await page.goto(getMembersPagePath(data.organization.slug));

    // 1. Alert/banner is visible with appropriate text
    const alertBanner = page.getByRole("alert");
    await expect(alertBanner.getByText(/no seats remaining/i)).toBeVisible();
    await expect(
      alertBanner.getByText(
        /switch to a higher-tier plan or contact sales to invite new members./i,
      ),
    ).toBeVisible();
    await expect(
      alertBanner.getByRole("link", { name: /go to billing/i }),
    ).toHaveAttribute(
      "href",
      `/organizations/${data.organization.slug}/settings/billing`,
    );

    // 2. Invite-by-link button is disabled
    const createLinkButton = page.getByRole("button", {
      name: /create new invite link/i,
    });
    await expect(createLinkButton).toBeDisabled();

    // 3. Send-email-invitation button is disabled
    const sendEmailButton = page.getByRole("button", {
      name: /send email invitation/i,
    });
    await expect(sendEmailButton).toBeDisabled();

    // teardown
    await teardownOrganizationAndMember(data);
  });

  // ========================================================================
  // Accessibility Tests
  // ========================================================================
  test("given: an owner user, should: lack automatically detectable accessibility issues", async ({
    page,
  }) => {
    const data = await setupMultipleMembers({
      activeInviteLink: true,
      otherMemberRoles: [OrganizationMembershipRole.member],
      page,
      requestingUserRole: OrganizationMembershipRole.owner,
    });

    await page.goto(getMembersPagePath(data.organization.slug));

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(["color-contrast"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    await teardownMultipleMembers(data);
  });
});
