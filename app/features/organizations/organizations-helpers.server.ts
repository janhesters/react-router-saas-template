import type {
  Organization,
  OrganizationInviteLink,
  UserAccount,
} from '@prisma/client';
import { OrganizationMembershipRole } from '@prisma/client';

import { notFound } from '~/utils/http-responses.server';
import { removeImageFromStorage } from '~/utils/storage-helpers.server';
import { throwIfEntityIsMissing } from '~/utils/throw-if-entity-is-missing.server';

import {
  adjustSeats,
  deactivateStripeCustomer,
} from '../billing/stripe-helpers.server';
import type { OnboardingUser } from '../onboarding/onboarding-helpers.server';
import { requireOnboardedUserAccountExists } from '../onboarding/onboarding-helpers.server';
import { saveInviteLinkUseToDatabase } from './accept-invite-link/invite-link-use-model.server';
import {
  addMembersToOrganizationInDatabaseById,
  deleteOrganizationFromDatabaseById,
  retrieveMemberCountAndLatestStripeSubscriptionFromDatabaseByOrganizationId,
  retrieveOrganizationWithSubscriptionsFromDatabaseById,
} from './organizations-model.server';

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

/**
 * Deletes an organization and all associated subscriptions.
 *
 * @param organizationId - The ID of the organization to delete.
 */
export async function deleteOrganization(organizationId: Organization['id']) {
  const organization =
    await retrieveOrganizationWithSubscriptionsFromDatabaseById(organizationId);

  if (organization) {
    if (organization.stripeCustomerId) {
      await deactivateStripeCustomer(organization.stripeCustomerId);
    }

    await removeImageFromStorage(organization.imageUrl);

    await deleteOrganizationFromDatabaseById(organizationId);
  }
}

/**
 * Accepts an invite link and adds the user to the organization. Also adjusts
 * the number of seats on the organization's subscription if it exists.
 *
 * @param userAccountId - The ID of the user account to add to the organization.
 * @param organizationId - The ID of the organization to add the user to.
 * @param inviteLinkId - The ID of the invite link to accept.
 */
export async function acceptInviteLink({
  userAccountId,
  organizationId,
  inviteLinkId,
}: {
  userAccountId: UserAccount['id'];
  organizationId: Organization['id'];
  inviteLinkId: OrganizationInviteLink['id'];
}) {
  await addMembersToOrganizationInDatabaseById({
    id: organizationId,
    members: [userAccountId],
    role: OrganizationMembershipRole.member,
  });
  await saveInviteLinkUseToDatabase({
    inviteLinkId,
    userId: userAccountId,
  });

  const organization =
    await retrieveMemberCountAndLatestStripeSubscriptionFromDatabaseByOrganizationId(
      organizationId,
    );

  if (organization) {
    const subscription = organization.stripeSubscriptions[0];

    if (subscription) {
      await adjustSeats({
        subscriptionId: subscription.stripeId,
        subscriptionItemId: subscription.items[0].stripeId,
        newQuantity: organization._count.memberships + 1,
      });
    }
  }
}
