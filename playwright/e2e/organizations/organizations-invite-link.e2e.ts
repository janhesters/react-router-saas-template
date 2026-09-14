import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { promiseHash } from "remix-utils/promise";

import { expect, test } from "../../fixtures";
import { getPath, setupOrganizationAndLoginAsMember } from "../../utils";
import { priceLookupKeysByTierAndInterval } from "~/features/billing/billing-constants";
import { retrieveInviteLinkUseFromDatabaseByUserIdAndLinkId } from "~/features/organizations/accept-invite-link/invite-link-use-model.server";
import { retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId } from "~/features/organizations/organization-membership-model.server";
import { createPopulatedOrganizationInviteLink } from "~/features/organizations/organizations-factories.server";
import { saveOrganizationInviteLinkToDatabase } from "~/features/organizations/organizations-invite-link-model.server";
import type { OrganizationInviteLink } from "~/generated/client";
import {
  createUserWithOrgAndAddAsMember,
  teardownOrganizationAndMember,
} from "~/test/test-utils";

const getInviteLinkPagePath = (token?: string) =>
  `/organizations/invite-link${token ? `?token=${token}` : ""}`;

test.describe("organizations invite link page", () => {
  test.describe("given: a logged out user", () => {
    async function setup(
      deactivatedAt?: OrganizationInviteLink["deactivatedAt"],
    ) {
      const { organization, user } = await createUserWithOrgAndAddAsMember();
      const link = createPopulatedOrganizationInviteLink({
        creatorId: user.id,
        deactivatedAt,
        organizationId: organization.id,
      });
      await saveOrganizationInviteLinkToDatabase(link);

      return { link, organization, user };
    }

    test("given: an invalid token, should: show a 404 page", async ({
      page,
    }) => {
      const { organization, user } = await setup();

      await page.goto(getInviteLinkPagePath("invalid-token"));

      await expect(
        page.getByRole("heading", { level: 1, name: /page not found/i }),
      ).toBeVisible();
      await expect(page).toHaveTitle(/404/i);

      await teardownOrganizationAndMember({ organization, user });
    });

    test("given: a valid token, should: redirect to the register page", async ({
      page,
    }) => {
      const { link, organization, user } = await setup();

      await page.goto(getInviteLinkPagePath(link.token));

      // Click the accept invite button.
      await page.getByRole("button", { name: /accept invite/i }).click();

      // The page title is correct.
      await expect(page).toHaveTitle(/register | react router saas template/i);
      await expect(
        page.getByText(
          new RegExp(`register to join ${organization.name}`, "i"),
        ),
      ).toBeVisible();
      await expect(
        page.getByText(
          new RegExp(
            `${user.name} has invited you to join ${organization.name}`,
            "i",
          ),
        ),
      ).toBeVisible();

      await teardownOrganizationAndMember({ organization, user });
    });

    test("given: a valid token for a deactivated invite link, should: show a 404 page ", async ({
      page,
    }) => {
      const { link, organization, user } = await setup(new Date());

      await page.goto(getInviteLinkPagePath(link.token));

      await expect(
        page.getByRole("heading", { level: 1, name: /page not found/i }),
      ).toBeVisible();
      await expect(page).toHaveTitle(/404/i);

      await teardownOrganizationAndMember({ organization, user });
    });

    test("given a valid token, should: lack any automatically detectable accessibility issues", async ({
      page,
    }) => {
      const data = await setup();

      await page.goto(getInviteLinkPagePath(data.link.token));

      const accessibilityScanResults = await new AxeBuilder({ page })
        .disableRules(["color-contrast"])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);

      await teardownOrganizationAndMember(data);
    });
  });

  test.describe("given: a logged in user", () => {
    async function setup({
      deactivatedAt,
      page,
    }: {
      deactivatedAt?: OrganizationInviteLink["deactivatedAt"];
      page: Page;
    }) {
      const { auth, data } = await promiseHash({
        auth: setupOrganizationAndLoginAsMember({ page }),
        data: createUserWithOrgAndAddAsMember(),
      });
      const link = createPopulatedOrganizationInviteLink({
        creatorId: data.user.id,
        deactivatedAt,
        organizationId: data.organization.id,
      });
      await saveOrganizationInviteLinkToDatabase(link);

      return {
        // auth's user & organization are for the authenticated user.
        auth,
        // data's user & organization are for the existing organization
        // for which the authenticated user received an invite link.
        data,
        link,
      };
    }

    test("given: an invalid token, should: show a 404 page", async ({
      page,
    }) => {
      const { auth, data } = await setup({
        page,
      });

      await page.goto(getInviteLinkPagePath("invalid-token"));

      await expect(
        page.getByRole("heading", { level: 1, name: /page not found/i }),
      ).toBeVisible();
      await expect(page).toHaveTitle(/404/i);

      await teardownOrganizationAndMember(data);
      await teardownOrganizationAndMember(auth);
    });

    test("given: a valid token accepted twice, should: join once and then show an informational toast", async ({
      page,
    }) => {
      const { auth, data, link } = await setup({ page });

      await page.goto(getInviteLinkPagePath(link.token));

      // It renders the correct page & heading.
      await expect(page.getByText(/welcome to /i)).toBeVisible();
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: new RegExp(
            `${data.user.name} invites you to join ${data.organization.name}`,
            "i",
          ),
        }),
      ).toBeVisible();
      await expect(
        page.getByText(/click the button below to sign up/i),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /accept invite/i }),
      ).toBeVisible();

      // It has a button to accept the invite, shows a success toast and
      // redirects to the organization's dashboard.
      await page.getByRole("button", { name: /accept invite/i }).click();
      await expect(
        page.getByRole("button", { name: /accepting invite/i }),
      ).toBeDisabled();
      await expect(
        page.getByRole("heading", { level: 1, name: /dashboard/i }),
      ).toBeVisible();
      await expect(
        page
          .getByRole("region", {
            name: /notifications/i,
          })
          .getByText(/successfully joined organization/i),
      ).toBeVisible();
      expect(getPath(page)).toEqual(
        `/organizations/${data.organization.slug}/dashboard`,
      );

      const membership =
        await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
          {
            organizationId: data.organization.id,
            userId: auth.user.id,
          },
        );
      const usage = await retrieveInviteLinkUseFromDatabaseByUserIdAndLinkId({
        inviteLinkId: link.id,
        userId: auth.user.id,
      });
      expect(membership).not.toBeNull();
      expect(usage).not.toBeNull();

      await page.goto(getInviteLinkPagePath(link.token));
      await page.getByRole("button", { name: /accept invite/i }).click();
      await expect(
        page.getByRole("heading", { level: 1, name: /dashboard/i }),
      ).toBeVisible();
      expect(getPath(page)).toEqual(
        `/organizations/${data.organization.slug}/dashboard`,
      );
      await expect(
        page
          .getByRole("region", { name: /notifications/i })
          .getByText(`You are already a member of ${data.organization.name}`),
      ).toBeVisible();
      expect(
        await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
          {
            organizationId: data.organization.id,
            userId: auth.user.id,
          },
        ),
      ).toEqual(membership);
      expect(
        await retrieveInviteLinkUseFromDatabaseByUserIdAndLinkId({
          inviteLinkId: link.id,
          userId: auth.user.id,
        }),
      ).toEqual(usage);

      await teardownOrganizationAndMember(data);
      await teardownOrganizationAndMember(auth);
    });

    test("given: a valid token for a deactivated invite link, should: show a 404 page ", async ({
      page,
    }) => {
      const { auth, data, link } = await setup({
        deactivatedAt: new Date(),
        page,
      });

      await page.goto(getInviteLinkPagePath(link.token));

      await expect(
        page.getByRole("heading", { level: 1, name: /page not found/i }),
      ).toBeVisible();
      await expect(page).toHaveTitle(/404/i);
      await teardownOrganizationAndMember(data);
      await teardownOrganizationAndMember(auth);
    });

    test("given: a valid token for an organization that is already full, should: NOT let the user join the organization and show a toast with a message letting the user know what is happening", async ({
      page,
    }) => {
      // Create an organization with the low tier plan (1 seat limit)
      const { auth, data } = await promiseHash({
        auth: setupOrganizationAndLoginAsMember({ page }),
        data: createUserWithOrgAndAddAsMember({
          lookupKey: priceLookupKeysByTierAndInterval.low.annual,
        }),
      });

      // Create an invite link for this organization
      const link = createPopulatedOrganizationInviteLink({
        creatorId: data.user.id,
        organizationId: data.organization.id,
      });
      await saveOrganizationInviteLinkToDatabase(link);

      // Visit the invite link page
      await page.goto(getInviteLinkPagePath(link.token));

      // Click the accept invite button
      await page.getByRole("button", { name: /accept invite/i }).click();

      // Verify toast message
      await expect(
        page
          .getByRole("region", { name: /notifications/i })
          .getByText(/organization has reached its member limit/i),
      ).toBeVisible();

      // Verify we're still on the same page (not redirected)
      expect(getPath(page)).toEqual(getInviteLinkPagePath(link.token));

      await teardownOrganizationAndMember(data);
      await teardownOrganizationAndMember(auth);
    });

    test("given: an existing member accepting an invite to a full organization, should: redirect to its dashboard with an informational toast and preserve membership", async ({
      page,
    }) => {
      // Create an organization and make the user a member and log in as that
      // user
      const { organization, user } = await setupOrganizationAndLoginAsMember({
        lookupKey: priceLookupKeysByTierAndInterval.low.annual,
        page,
      });

      const originalMembership =
        await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
          {
            organizationId: organization.id,
            userId: user.id,
          },
        );

      // Create an invite link for the same organization
      const link = createPopulatedOrganizationInviteLink({
        creatorId: user.id,
        organizationId: organization.id,
      });
      await saveOrganizationInviteLinkToDatabase(link);

      // Visit the invite link page
      await page.goto(getInviteLinkPagePath(link.token));

      // Click the accept invite button
      await page.getByRole("button", { name: /accept invite/i }).click();

      // Verify redirect to organization dashboard
      await expect(
        page.getByRole("heading", { level: 1, name: /dashboard/i }),
      ).toBeVisible();
      expect(getPath(page)).toEqual(
        `/organizations/${organization.slug}/dashboard`,
      );

      // Verify toast message
      await expect(
        page
          .getByRole("region", { name: /notifications/i })
          .getByText(
            new RegExp(`You are already a member of ${organization.name}`, "i"),
          ),
      ).toBeVisible();

      expect(
        await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
          {
            organizationId: organization.id,
            userId: user.id,
          },
        ),
      ).toEqual(originalMembership);
      expect(
        await retrieveInviteLinkUseFromDatabaseByUserIdAndLinkId({
          inviteLinkId: link.id,
          userId: user.id,
        }),
      ).toBeNull();

      await teardownOrganizationAndMember({ organization, user });
    });

    test("given a valid token, should: lack any automatically detectable accessibility issues", async ({
      page,
    }) => {
      const { auth, data, link } = await setup({ page });

      await page.goto(getInviteLinkPagePath(link.token));

      const accessibilityScanResults = await new AxeBuilder({ page })
        .disableRules(["color-contrast"])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);

      await teardownOrganizationAndMember(data);
      await teardownOrganizationAndMember(auth);
    });
  });
});
