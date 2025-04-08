/* eslint-disable unicorn/consistent-function-scoping */
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import type { OrganizationInviteLink } from '@prisma/client';
import { promiseHash } from 'remix-utils/promise';

import { saveOrganizationInviteLinkToDatabase } from '~/features/organizations/organization-invite-link-model.server';
import { createPopulatedOrganizationInviteLink } from '~/features/organizations/organizations-factories.server';
import {
  createUserWithOrgAndAddAsMember,
  teardownOrganizationAndMember,
} from '~/test/test-utils';

import { getPath, setupOrganizationAndLoginAsMember } from '../../utils';

const getInviteLinkPagePath = (token?: string) =>
  `/organizations/invite-link${token ? `?token=${token}` : ''}`;

test.describe('organizations invite link page', () => {
  test.describe('given: a logged out user', () => {
    async function setup() {
      const { user, organization } = await createUserWithOrgAndAddAsMember();
      const link = createPopulatedOrganizationInviteLink({
        creatorId: user.id,
        organizationId: organization.id,
      });
      await saveOrganizationInviteLinkToDatabase(link);

      return { link, organization, user };
    }

    test('given: an invalid token, should: show a 404 page', async ({
      page,
    }) => {
      const { user, organization } = await setup();

      await page.goto(getInviteLinkPagePath('invalid-token'));

      await expect(
        page.getByRole('heading', { name: /page not found/i, level: 1 }),
      ).toBeVisible();
      await expect(page).toHaveTitle(/404/i);

      await teardownOrganizationAndMember({ organization, user });
    });

    test('given: a valid token, should: redirect to the register page', async ({
      page,
    }) => {
      const { link, user, organization } = await setup();

      await page.goto(getInviteLinkPagePath(link.token));

      // Click the accept invite button.
      await page.getByRole('button', { name: /accept invite/i }).click();

      // The page title is correct.
      await expect(page).toHaveTitle(/register | react router saas template/i);

      await teardownOrganizationAndMember({ organization, user });
    });

    test('given a valid token, should: lack any automatically detectable accessibility issues', async ({
      page,
    }) => {
      const data = await setup();

      await page.goto(getInviteLinkPagePath(data.link.token));

      const accessibilityScanResults = await new AxeBuilder({ page })
        .disableRules(['color-contrast'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);

      await teardownOrganizationAndMember(data);
    });
  });

  test.describe('given: a logged in user', () => {
    async function setup({
      page,
      deactivatedAt,
    }: {
      page: Page;
      deactivatedAt?: OrganizationInviteLink['deactivatedAt'];
    }) {
      const { auth, data } = await promiseHash({
        auth: setupOrganizationAndLoginAsMember({ page }),
        data: createUserWithOrgAndAddAsMember(),
      });
      const link = createPopulatedOrganizationInviteLink({
        deactivatedAt,
        creatorId: data.user.id,
        organizationId: data.organization.id,
      });
      await saveOrganizationInviteLinkToDatabase(link);

      return {
        link,
        // auth's user & organization are for the authenticated user.
        auth,
        // data's user & organization are for the existing organization
        // for which the authenticated user received an invite link.
        data,
      };
    }

    test('given: an invalid token, should: show a 404 page', async ({
      page,
    }) => {
      const { auth, data } = await setup({
        page,
      });

      await page.goto(getInviteLinkPagePath('invalid-token'));

      await expect(
        page.getByRole('heading', { name: /page not found/i, level: 1 }),
      ).toBeVisible();
      await expect(page).toHaveTitle(/404/i);

      await teardownOrganizationAndMember(data);
      await teardownOrganizationAndMember(auth);
    });

    test('given: a valid token, should: let the user join the organization', async ({
      page,
    }) => {
      const { link, auth, data } = await setup({ page });

      await page.goto(getInviteLinkPagePath(link.token));

      // It renders the correct page & heading.
      await expect(
        page.getByRole('heading', {
          name: new RegExp(
            `${data.user.name} invites you to join ${data.organization.name}`,
            'i',
          ),
          level: 1,
        }),
      ).toBeVisible();
      await expect(
        page.getByText(/click the button below to sign up/i),
      ).toBeVisible();

      // It has a button to accept the invite, shows a success toast and
      // redirects to the organization's dashboard.
      await page.getByRole('button', { name: /accept invite/i }).click();
      await expect(
        page.getByRole('button', { name: /accepting invite/i }),
      ).toBeDisabled();
      await expect(
        page.getByRole('heading', { name: /dashboard/i, level: 1 }),
      ).toBeVisible();
      await expect(
        page
          .getByRole('region', {
            name: /notifications/i,
          })
          .getByText(/successfully joined organization/i),
      ).toBeVisible();
      expect(getPath(page)).toEqual(
        `/organizations/${data.organization.slug}/dashboard`,
      );

      await teardownOrganizationAndMember(data);
      await teardownOrganizationAndMember(auth);
    });

    test('given a valid token, should: lack any automatically detectable accessibility issues', async ({
      page,
    }) => {
      const { link, auth, data } = await setup({ page });

      await page.goto(getInviteLinkPagePath(link.token));

      const accessibilityScanResults = await new AxeBuilder({ page })
        .disableRules(['color-contrast'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);

      await teardownOrganizationAndMember(data);
      await teardownOrganizationAndMember(auth);
    });
  });
});
