import { createId } from '@paralleldrive/cuid2';
import { OrganizationMembershipRole } from '@prisma/client';
import { describe, expect, test } from 'vitest';

import { createPopulatedUserAccount } from '~/features/user-accounts/user-accounts-factories.server';

import {
  createPopulatedOrganization,
  createPopulatedOrganizationInviteLink,
  createPopulatedOrganizationMembership,
} from '../../organizations-factories.server';
import type { OrganizationWithMembers } from './team-members-helpers.server';
import {
  mapOrganizationDataToTeamMemberSettingsProps,
  tokenToInviteLink,
} from './team-members-helpers.server';

const createOrganizationWithLinksAndMembers = ({
  inviteLinkCount,
  memberCount,
}: {
  inviteLinkCount: number;
  memberCount: number;
}): OrganizationWithMembers => {
  const organization = createPopulatedOrganization();
  const memberships = Array.from({ length: memberCount }, () =>
    createPopulatedUserAccount(),
  ).map(member => ({
    ...createPopulatedOrganizationMembership({
      organizationId: organization.id,
      memberId: member.id,
    }),
    member,
  }));
  const links = Array.from({ length: inviteLinkCount }, () =>
    createPopulatedOrganizationInviteLink({
      organizationId: organization.id,
      creatorId: memberships[0].member.id,
    }),
  );
  return {
    ...organization,
    memberships,
    organizationInviteLinks: links,
  };
};

describe('tokenToInviteLink()', () => {
  test('given: a token and a request, should: return the invite link', () => {
    const token = createId();
    const basePath = 'https://example.com';
    const request = new Request(`${basePath}/foo`);

    const actual = tokenToInviteLink(token, request);
    const expected = `${basePath}/organizations/invite-link?token=${token}`;

    expect(actual).toEqual(expected);
  });
});

describe('mapOrganizationDataToTeamMemberSettingsProps()', () => {
  test('given: an organization with just one member who is an owner, should: return the correct props', () => {
    const currentUsersRole = OrganizationMembershipRole.owner;
    const organization = createOrganizationWithLinksAndMembers({
      inviteLinkCount: 1,
      memberCount: 1,
    });
    organization.memberships[0].role = currentUsersRole;
    const request = new Request('http://localhost');

    const actual = mapOrganizationDataToTeamMemberSettingsProps({
      currentUsersId: organization.memberships[0].member.id,
      currentUsersRole,
      organization,
      request,
    });
    const expected = {
      emailInviteCard: {
        currentUserIsOwner: true,
      },
      inviteLinkCard: {
        inviteLink: {
          href: `http://localhost/organizations/invite-link?token=${organization.organizationInviteLinks[0].token}`,
          expiryDate:
            organization.organizationInviteLinks[0].expiresAt.toISOString(),
        },
      },
      teamMemberTable: {
        currentUsersRole,
        members: organization.memberships.map(membership => ({
          avatar: membership.member.imageUrl,
          deactivatedAt: null,
          email: membership.member.email,
          id: membership.member.id,
          isCurrentUser: true,
          name: membership.member.name,
          role: membership.role,
          status: 'createdTheOrganization',
        })),
      },
    };

    expect(actual).toEqual(expected);
  });

  test('given: an organization with multiple members, where the current user is a member and no link, should: return the correct props', () => {
    const currentUsersRole = OrganizationMembershipRole.member;
    const organization = createOrganizationWithLinksAndMembers({
      inviteLinkCount: 0,
      memberCount: 2,
    });
    organization.memberships[0].role = currentUsersRole;
    const request = new Request('http://localhost');

    const actual = mapOrganizationDataToTeamMemberSettingsProps({
      currentUsersId: organization.memberships[0].member.id,
      currentUsersRole,
      organization,
      request,
    });
    const expected = {
      emailInviteCard: {
        currentUserIsOwner: false,
      },
      inviteLinkCard: {
        inviteLink: undefined,
      },
      teamMemberTable: {
        currentUsersRole,
        members: organization.memberships.map((membership, index) => ({
          avatar: membership.member.imageUrl,
          deactivatedAt: null,
          email: membership.member.email,
          id: membership.member.id,
          isCurrentUser: index === 0,
          name: membership.member.name,
          role: membership.role,
          status: index === 0 ? 'createdTheOrganization' : 'joinedViaLink',
        })),
      },
    };

    expect(actual).toEqual(expected);
  });
});
