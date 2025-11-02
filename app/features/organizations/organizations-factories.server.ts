import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";
import type {
  InviteLinkUse,
  Organization,
  OrganizationEmailInviteLink,
  OrganizationInviteLink,
  OrganizationMembership,
} from "@prisma/client";
import { OrganizationMembershipRole } from "@prisma/client";
import { addDays } from "date-fns";

import { createPopulatedStripeSubscriptionWithScheduleAndItemsWithPriceAndProduct } from "../billing/billing-factories.server";
import type { OrganizationWithMembershipsAndSubscriptions } from "../onboarding/onboarding-helpers.server";
import { slugify } from "~/utils/slugify.server";
import type { Factory } from "~/utils/types";

/* BASE */

/**
 * Creates an organization with populated values.
 *
 * @param organizationParams - Organization params to create organization with.
 * @returns A populated organization with given params.
 */
export const createPopulatedOrganization: Factory<Organization> = ({
  id = createId(),
  name = faker.company.name(),
  slug = slugify(name),
  updatedAt = faker.date.recent({ days: 10 }),
  createdAt = faker.date.past({ refDate: updatedAt, years: 1 }),
  imageUrl = faker.image.url(),
  billingEmail = faker.internet.email(),
  stripeCustomerId = `cus_${createId()}`,
  trialEnd = addDays(createdAt, 14),
} = {}) => ({
  billingEmail,
  createdAt,
  id,
  imageUrl,
  name,
  slug,
  stripeCustomerId,
  trialEnd,
  updatedAt,
});

/**
 * Creates an organization invite link with populated values.
 *
 * @param linkParams - OrganizationInviteLink params to create organization invite link with.
 * @returns A populated organization invite link with given params.
 */
export const createPopulatedOrganizationInviteLink: Factory<
  OrganizationInviteLink
> = ({
  updatedAt = faker.date.recent({ days: 1 }),
  createdAt = faker.date.recent({ days: 1, refDate: updatedAt }),
  id = createId(),
  organizationId = createId(),
  creatorId = createId(),
  expiresAt = faker.date.soon({ days: 3, refDate: addDays(updatedAt, 2) }),
  token = createId(),
  deactivatedAt = null,
} = {}) => ({
  createdAt,
  creatorId,
  deactivatedAt,
  expiresAt,
  id,
  organizationId,
  token,
  updatedAt,
});

/**
 * Creates an invite link usage with populated values.
 *
 * @param usageParams - inviteLinkUse params to create invite link usage with.
 * @returns A populated invite link usage with given params.
 */
export const createPopulatedInviteLinkUse: Factory<InviteLinkUse> = ({
  updatedAt = faker.date.recent({ days: 1 }),
  createdAt = faker.date.recent({ days: 1, refDate: updatedAt }),
  id = createId(),
  inviteLinkId = createId(),
  userId = createId(),
} = {}) => ({ createdAt, id, inviteLinkId, updatedAt, userId });

/**
 * Creates an organization membership with populated values.
 *
 * @param membershipParams - OrganizationMembership params to create membership with.
 * @returns A populated organization membership with given params.
 */
export const createPopulatedOrganizationMembership: Factory<
  OrganizationMembership
> = ({
  updatedAt = faker.date.recent({ days: 1 }),
  createdAt = faker.date.recent({ days: 1, refDate: updatedAt }),
  memberId = createId(),
  organizationId = createId(),
  role = "member",
  deactivatedAt = null,
} = {}) => ({
  createdAt,
  deactivatedAt,
  memberId,
  organizationId,
  role,
  updatedAt,
});

/**
 * Creates an organization email invite link with populated values.
 *
 * @param emailInviteLinkParams - OrganizationEmailInviteLink params to create email invite link with.
 * @returns A populated organization email invite link with given params.
 */
export const createPopulatedOrganizationEmailInviteLink: Factory<
  OrganizationEmailInviteLink
> = ({
  updatedAt = faker.date.recent({ days: 1 }),
  createdAt = faker.date.recent({ days: 1, refDate: updatedAt }),
  id = createId(),
  organizationId = createId(),
  invitedById = createId(),
  email = faker.internet.email(),
  token = createId(),
  role = OrganizationMembershipRole.member,
  expiresAt = faker.date.soon({ days: 3, refDate: addDays(updatedAt, 2) }),
  deactivatedAt = null,
} = {}) => ({
  createdAt,
  deactivatedAt,
  email,
  expiresAt,
  id,
  invitedById,
  organizationId,
  role,
  token,
  updatedAt,
});

/* COMPOUND */

/**
 * Creates an organization with membership count and stripe subscriptions.
 * This matches the shape needed for the OnboardingUser type's organization field.
 *
 * @param params - Parameters to create the organization with
 * @param params.organization - Base organization object to extend
 * @param params.memberCount - Number of members in the organization
 * @param params.stripeSubscriptions - Array of stripe subscriptions for the organization
 * @returns An organization with membership count and subscriptions
 */
export const createOrganizationWithMembershipsAndSubscriptions = ({
  organization = createPopulatedOrganization(),
  memberCount = faker.number.int({ max: 10, min: 1 }),
  stripeSubscriptions = [
    createPopulatedStripeSubscriptionWithScheduleAndItemsWithPriceAndProduct(),
  ],
} = {}): OrganizationWithMembershipsAndSubscriptions => ({
  ...organization,
  _count: { memberships: memberCount },
  stripeSubscriptions,
});
