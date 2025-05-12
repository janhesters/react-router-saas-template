import { onTestFinished } from 'vitest';

import {
  createUserWithOrgAndAddAsMember,
  teardownOrganizationAndMember,
} from './test-utils';

/**
 * Creates a user with an organization and adds the user as a member of the
 * organization.
 * Also automatically tears down the organization and user after the test is
 * finished.
 *
 * @param args - The arguments to pass to the `createUserWithOrgAndAddAsMember`
 * function.
 * @returns The organization and user.
 */
export async function setupUserWithOrgAndAddAsMember(
  ...args: Parameters<typeof createUserWithOrgAndAddAsMember>
) {
  const { organization, user, subscription } =
    await createUserWithOrgAndAddAsMember(...args);

  onTestFinished(async () => {
    await teardownOrganizationAndMember({ organization, user });
  });

  return { organization, user, subscription };
}
