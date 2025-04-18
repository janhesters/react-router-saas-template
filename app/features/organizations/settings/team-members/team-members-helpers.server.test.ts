import { createId } from '@paralleldrive/cuid2';
import { OrganizationMembershipRole } from '@prisma/client';
import { describe, expect, test } from 'vitest';

import { createPopulatedUserAccount } from '~/features/user-accounts/user-accounts-factories.server';

import {
  createPopulatedOrganization,
  createPopulatedOrganizationEmailInviteLink,
  createPopulatedOrganizationInviteLink,
  createPopulatedOrganizationMembership,
} from '../../organizations-factories.server';
import type { OrganizationWithMembers } from './team-members-helpers.server';
import {
  mapOrganizationDataToTeamMemberSettingsProps,
  tokenToInviteLink,
} from './team-members-helpers.server';

const createOrganizationWithLinksAndMembers = ({
  emailInviteCount,
  inviteLinkCount,
  memberCount,
}: {
  emailInviteCount: number;
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
  const emailInvites = Array.from({ length: emailInviteCount }, () =>
    createPopulatedOrganizationEmailInviteLink({
      organizationId: organization.id,
      invitedById: memberships?.[0]?.member.id ?? createId(),
    }),
  );
  return {
    ...organization,
    memberships,
    organizationInviteLinks: links,
    organizationEmailInviteLink: emailInvites,
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
      emailInviteCount: 0,
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
          deactivatedAt: undefined,
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
      emailInviteCount: 0,
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
          deactivatedAt: undefined,
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

  test('given: an organization with email invites and members, should: return email invites first sorted by most recent and then members', () => {
    const currentUsersRole = OrganizationMembershipRole.owner;
    const organization = createOrganizationWithLinksAndMembers({
      inviteLinkCount: 0,
      memberCount: 2,
      emailInviteCount: 3,
    });

    // Set different dates for email invites to test sorting
    organization.organizationEmailInviteLink[0].createdAt = new Date(
      '2024-03-15',
    );
    organization.organizationEmailInviteLink[1].createdAt = new Date(
      '2024-03-14',
    );
    organization.organizationEmailInviteLink[2].createdAt = new Date(
      '2024-03-13',
    );

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
        inviteLink: undefined,
      },
      teamMemberTable: {
        currentUsersRole,
        members: [
          // Email invites first, sorted by most recent
          ...organization.organizationEmailInviteLink.map(invite => ({
            avatar: '',
            deactivatedAt: undefined,
            email: invite.email,
            id: invite.id,
            isCurrentUser: false,
            name: '',
            role: OrganizationMembershipRole.member,
            status: 'emailInvitePending',
          })),
          // Then existing members
          ...organization.memberships.map((membership, index) => ({
            avatar: membership.member.imageUrl,
            deactivatedAt: undefined,
            email: membership.member.email,
            id: membership.member.id,
            isCurrentUser: index === 0,
            name: membership.member.name,
            role: membership.role,
            status: index === 0 ? 'createdTheOrganization' : 'joinedViaLink',
          })),
        ],
      },
    };

    expect(actual).toEqual(expected);
  });

  test('given: an organization with only email invites and no members, should: return only email invites', () => {
    const currentUsersRole = OrganizationMembershipRole.owner;
    const organization = createOrganizationWithLinksAndMembers({
      inviteLinkCount: 0,
      memberCount: 0,
      emailInviteCount: 2,
    });

    // Set different dates for email invites to test sorting
    organization.organizationEmailInviteLink[0].createdAt = new Date(
      '2024-03-15',
    );
    organization.organizationEmailInviteLink[1].createdAt = new Date(
      '2024-03-14',
    );

    const request = new Request('http://localhost');

    const actual = mapOrganizationDataToTeamMemberSettingsProps({
      currentUsersId: 'some-id', // ID doesn't matter since there are no members
      currentUsersRole,
      organization,
      request,
    });

    const expected = {
      emailInviteCard: {
        currentUserIsOwner: true,
      },
      inviteLinkCard: {
        inviteLink: undefined,
      },
      teamMemberTable: {
        currentUsersRole,
        members: organization.organizationEmailInviteLink.map(invite => ({
          avatar: '',
          deactivatedAt: undefined,
          email: invite.email,
          id: invite.id,
          isCurrentUser: false,
          name: '',
          role: OrganizationMembershipRole.member,
          status: 'emailInvitePending',
        })),
      },
    };

    expect(actual).toEqual(expected);
  });

  test('given: multiple email invites for the same email, should: only show the latest invite', () => {
    const currentUsersRole = OrganizationMembershipRole.owner;
    const organization = createOrganizationWithLinksAndMembers({
      inviteLinkCount: 0,
      memberCount: 0,
      emailInviteCount: 3,
    });

    // Set same email for all invites but different dates
    const sameEmail = 'test@example.com';
    organization.organizationEmailInviteLink[0].email = sameEmail;
    organization.organizationEmailInviteLink[0].createdAt = new Date(
      '2024-03-15',
    );
    organization.organizationEmailInviteLink[1].email = sameEmail;
    organization.organizationEmailInviteLink[1].createdAt = new Date(
      '2024-03-14',
    );
    organization.organizationEmailInviteLink[2].email = sameEmail;
    organization.organizationEmailInviteLink[2].createdAt = new Date(
      '2024-03-13',
    );

    const request = new Request('http://localhost');

    const actual = mapOrganizationDataToTeamMemberSettingsProps({
      currentUsersId: 'some-id',
      currentUsersRole,
      organization,
      request,
    });

    // Should only show one invite with the latest date
    expect(actual.teamMemberTable.members).toHaveLength(1);
    expect(actual.teamMemberTable.members[0]).toEqual({
      avatar: '',
      deactivatedAt: undefined,
      email: sameEmail,
      id: organization.organizationEmailInviteLink[0].id,
      isCurrentUser: false,
      name: '',
      role: OrganizationMembershipRole.member,
      status: 'emailInvitePending',
    });
  });
});
