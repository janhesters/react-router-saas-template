import type { Organization } from '@prisma/client';

import { notFound } from '~/utils/http-responses.server';
import { throwIfEntityIsMissing } from '~/utils/throw-if-entity-is-missing.server';

import type { OnboardingUser } from '../onboarding/onboarding-helpers.server';
import { requireOnboardedUserAccountExists } from '../onboarding/onboarding-helpers.server';

/**
 * Finds an organization by ID if the given user is a member of it.
 *
 * @param user - The user to check membership for.
 * @param organizationId - The ID of the organization to find.
 * @returns The organization if found and user is a member.
 * @throws {Response} 404 Not Found if user is not a member or organization
 * doesn't exist.
 */
export function findOrganizationIfUserIsMemberById<User extends OnboardingUser>(
  user: User,
  organizationId: Organization['id'],
) {
  const membership = user.memberships.find(
    membership => membership.organization.id === organizationId,
  );

  if (!membership) {
    throw notFound();
  }

  const organization = throwIfEntityIsMissing(membership.organization);

  return { organization, role: membership.role };
}

/**
 * Finds an organization by slug if the given user is a member of it.
 *
 * @param user - The user to check membership for.
 * @param organizationSlug - The slug of the organization to find.
 * @returns The organization if found and user is a member.
 * @throws {Response} 404 Not Found if user is not a member or organization
 * doesn't exist.
 */
export function findOrganizationIfUserIsMemberBySlug<
  User extends OnboardingUser,
>(user: User, organizationSlug: Organization['slug']) {
  const membership = user.memberships.find(
    membership => membership.organization.slug === organizationSlug,
  );

  if (!membership) {
    throw notFound();
  }

  const organization = throwIfEntityIsMissing(membership.organization);

  return { organization, role: membership.role };
}

/**
 * Requires that the authenticated user from the request is a member of the
 * specified organization.
 *
 * @param request - The incoming request.
 * @param organizationSlug - The slug of the organization to check membership
 * for.
 * @returns Object containing the user, organization and auth headers.
 * @throws {Response} 404 Not Found if user is not a member or organization
 * doesn't exist.
 */
export async function requireUserIsMemberOfOrganization(
  request: Request,
  organizationSlug: Organization['slug'],
) {
  const { user, headers } = await requireOnboardedUserAccountExists(request);
  const { organization, role } = findOrganizationIfUserIsMemberBySlug(
    user,
    organizationSlug,
  );
  return { user, organization, role, headers };
}
