import { expect, test } from '@playwright/test';

import { teardownOrganizationAndMember } from '~/test/test-utils';

import { getPath, setupOrganizationAndLoginAsMember } from '../../utils';

const createPath = (slug: string) => `/organizations/${slug}`;

test.describe('logout', () => {
  test('given: a logged in onboarded user clicked logout, should: log the user out', async ({
    page,
  }) => {
    const { organization, user } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await page.goto(createPath(organization.slug), { waitUntil: 'load' });

    // Delay a bit so everything loads
    await expect(
      page.getByRole('heading', { name: /dashboard/i, level: 1 }),
    ).toBeVisible();
    expect(getPath(page)).toEqual(
      `/organizations/${organization.slug}/dashboard`,
    );
    await expect(
      page.getByRole('button', { name: /open theme menu/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /open unread notifications/i }),
    ).toBeVisible();

    // Open the user menu and click logout.
    await page.getByRole('button', { name: /open user menu/i }).click();
    await page.getByRole('menuitem', { name: /log out/i }).click();

    // Verify the user is redirected to the landing page and logged out.
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: /react router saas template/i,
      }),
    ).toBeVisible();

    expect(getPath(page)).toEqual('/');

    await teardownOrganizationAndMember({ organization, user });
  });
});
