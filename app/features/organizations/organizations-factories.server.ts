import { faker } from '@faker-js/faker';
import { createId } from '@paralleldrive/cuid2';
import type {
  InviteLinkUse,
  Organization,
  OrganizationEmailInviteLink,
  OrganizationInviteLink,
  OrganizationMembership,
} from '@prisma/client';
import { OrganizationMembershipRole } from '@prisma/client';
import { addDays } from 'date-fns';

import { slugify } from '~/utils/slugify.server';
import type { Factory } from '~/utils/types';

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
  createdAt = faker.date.past({ years: 1, refDate: updatedAt }),
  imageUrl = faker.image.url(),
  billingEmail = faker.internet.email(),
} = {}) => ({ id, name, slug, createdAt, updatedAt, imageUrl, billingEmail });

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
  // eslint-disable-next-line unicorn/no-null
  deactivatedAt = null,
} = {}) => ({
  id,
  createdAt,
  updatedAt,
  organizationId,
  creatorId,
  expiresAt,
  token,
  deactivatedAt,
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
} = {}) => ({ id, createdAt, updatedAt, inviteLinkId, userId });

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
  role = 'member',
  // eslint-disable-next-line unicorn/no-null
  deactivatedAt = null,
} = {}) => ({
  createdAt,
  updatedAt,
  memberId,
  organizationId,
  role,
  deactivatedAt,
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
  // eslint-disable-next-line unicorn/no-null
  deactivatedAt = null,
} = {}) => ({
  id,
  createdAt,
  updatedAt,
  organizationId,
  invitedById,
  email,
  token,
  role,
  expiresAt,
  deactivatedAt,
});
