/** biome-ignore-all lint/style/noNonNullAssertion: test code */
import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";
import { OrganizationMembershipRole } from "@prisma/client";
import { describe, expect, test } from "vitest";

import {
  createPopulatedOrganization,
  createPopulatedOrganizationEmailInviteLink,
  createPopulatedOrganizationInviteLink,
  createPopulatedOrganizationMembership,
} from "../../organizations-factories.server";
import type { OrganizationWithMembers } from "./team-members-helpers.server";
import {
  mapOrganizationDataToTeamMemberSettingsProps,
  tokenToInviteLink,
} from "./team-members-helpers.server";
import type { StripeSubscriptionWithItemsAndPriceAndProduct } from "~/features/billing/billing-factories.server";
import { createPopulatedStripeSubscriptionWithItemsAndPriceAndProduct } from "~/features/billing/billing-factories.server";
import { createPopulatedUserAccount } from "~/features/user-accounts/user-accounts-factories.server";

const createOrganizationWithLinksAndMembers = ({
  emailInviteCount,
  inviteLinkCount,
  memberCount,
  stripeSubscription,
}: {
  emailInviteCount: number;
  inviteLinkCount: number;
  memberCount: number;
  stripeSubscription?: StripeSubscriptionWithItemsAndPriceAndProduct;
}): OrganizationWithMembers => {
  const organization = createPopulatedOrganization();
  const memberships = Array.from({ length: memberCount }, () =>
    createPopulatedUserAccount(),
  ).map((member) => ({
    ...createPopulatedOrganizationMembership({
      memberId: member.id,
      organizationId: organization.id,
    }),
    member,
  }));
  const links = Array.from({ length: inviteLinkCount }, () =>
    createPopulatedOrganizationInviteLink({
      creatorId: memberships[0]?.member.id,
      organizationId: organization.id,
    }),
  );
  const emailInvites = Array.from({ length: emailInviteCount }, () =>
    createPopulatedOrganizationEmailInviteLink({
      invitedById: memberships[0]?.member.id,
      organizationId: organization.id,
      role: faker.helpers.arrayElement([
        OrganizationMembershipRole.member,
        OrganizationMembershipRole.admin,
        OrganizationMembershipRole.owner,
      ]),
    }),
  );
  const stripeSubscriptions = stripeSubscription
    ? [
        createPopulatedStripeSubscriptionWithItemsAndPriceAndProduct(
          stripeSubscription,
        ),
      ]
    : [];
  return {
    ...organization,
    memberships,
    organizationEmailInviteLink: emailInvites,
    organizationInviteLinks: links,
    stripeSubscriptions,
  };
};

describe("tokenToInviteLink()", () => {
  test("given: a token and a request, should: return the invite link", () => {
    const token = createId();
    const basePath = "https://example.com";
    const request = new Request(`${basePath}/foo`);

    const actual = tokenToInviteLink(token, request);
    const expected = `${basePath}/organizations/invite-link?token=${token}`;

    expect(actual).toEqual(expected);
  });
});

describe("mapOrganizationDataToTeamMemberSettingsProps()", () => {
  test("given: an organization with just one member who is an owner, should: return the correct props", () => {
    const currentUsersRole = OrganizationMembershipRole.owner;
    const organization = createOrganizationWithLinksAndMembers({
      emailInviteCount: 0,
      inviteLinkCount: 1,
      memberCount: 1,
    });
    organization.memberships[0]!.role = currentUsersRole;
    const request = new Request("http://localhost");

    const actual = mapOrganizationDataToTeamMemberSettingsProps({
      currentUsersId: organization.memberships[0]!.member.id,
      currentUsersRole,
      organization,
      request,
    });
    const expected = {
      emailInviteCard: {
        currentUserIsOwner: true,
        organizationIsFull: false,
      },
      inviteLinkCard: {
        inviteLink: {
          expiryDate:
            organization.organizationInviteLinks[0]!.expiresAt.toISOString(),
          href: `http://localhost/organizations/invite-link?token=${organization.organizationInviteLinks[0]!.token}`,
        },
        organizationIsFull: false,
      },
      organizationIsFull: false,
      teamMemberTable: {
        currentUsersRole,
        members: organization.memberships.map((membership) => ({
          avatar: membership.member.imageUrl,
          deactivatedAt: undefined,
          email: membership.member.email,
          id: membership.member.id,
          isCurrentUser: true,
          name: membership.member.name,
          role: membership.role,
          status: "createdTheOrganization",
        })),
      },
    };

    expect(actual).toEqual(expected);
  });

  test("given: an organization with multiple members, where the current user is a member and no link, should: return the correct props", () => {
    const currentUsersRole = OrganizationMembershipRole.member;
    const organization = createOrganizationWithLinksAndMembers({
      emailInviteCount: 0,
      inviteLinkCount: 0,
      memberCount: 2,
    });
    organization.memberships[0]!.role = currentUsersRole;
    const request = new Request("http://localhost");

    const actual = mapOrganizationDataToTeamMemberSettingsProps({
      currentUsersId: organization.memberships[0]!.member.id,
      currentUsersRole,
      organization,
      request,
    });
    const expected = {
      emailInviteCard: {
        currentUserIsOwner: false,
        organizationIsFull: false,
      },
      inviteLinkCard: {
        inviteLink: undefined,
        organizationIsFull: false,
      },
      organizationIsFull: false,
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
          status: index === 0 ? "createdTheOrganization" : "joinedViaLink",
        })),
      },
    };

    expect(actual).toEqual(expected);
  });

  test("given: an organization with email invites and members, should: return email invites first sorted by most recent and then members", () => {
    const currentUsersRole = OrganizationMembershipRole.owner;
    const organization = createOrganizationWithLinksAndMembers({
      emailInviteCount: 3,
      inviteLinkCount: 0,
      memberCount: 2,
    });

    // Set different dates for email invites to test sorting
    organization.organizationEmailInviteLink[0]!.createdAt = new Date(
      "2024-03-15",
    );
    organization.organizationEmailInviteLink[1]!.createdAt = new Date(
      "2024-03-14",
    );
    organization.organizationEmailInviteLink[2]!.createdAt = new Date(
      "2024-03-13",
    );

    const request = new Request("http://localhost");

    const actual = mapOrganizationDataToTeamMemberSettingsProps({
      currentUsersId: organization.memberships[0]!.member.id,
      currentUsersRole,
      organization,
      request,
    });

    const expected = {
      emailInviteCard: {
        currentUserIsOwner: true,
        organizationIsFull: false,
      },
      inviteLinkCard: {
        inviteLink: undefined,
        organizationIsFull: false,
      },
      organizationIsFull: false,
      teamMemberTable: {
        currentUsersRole,
        members: [
          // Email invites first, sorted by most recent
          ...organization.organizationEmailInviteLink.map((invite) => ({
            avatar: "",
            deactivatedAt: undefined,
            email: invite.email,
            id: invite.id,
            isCurrentUser: false,
            name: "",
            role: invite.role,
            status: "emailInvitePending",
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
            status: index === 0 ? "createdTheOrganization" : "joinedViaLink",
          })),
        ],
      },
    };

    expect(actual).toEqual(expected);
  });

  test("given: an organization with only email invites and no members, should: return only email invites", () => {
    const currentUsersRole = OrganizationMembershipRole.owner;
    const organization = createOrganizationWithLinksAndMembers({
      emailInviteCount: 2,
      inviteLinkCount: 0,
      memberCount: 0,
    });

    // Set different dates for email invites to test sorting
    organization.organizationEmailInviteLink[0]!.createdAt = new Date(
      "2024-03-15",
    );
    organization.organizationEmailInviteLink[1]!.createdAt = new Date(
      "2024-03-14",
    );

    const request = new Request("http://localhost");

    const actual = mapOrganizationDataToTeamMemberSettingsProps({
      currentUsersId: "some-id",
      currentUsersRole,
      organization,
      request,
    });

    const expected = {
      emailInviteCard: {
        currentUserIsOwner: true,
        organizationIsFull: false,
      },
      inviteLinkCard: {
        inviteLink: undefined,
        organizationIsFull: false,
      },
      organizationIsFull: false,
      teamMemberTable: {
        currentUsersRole,
        members: organization.organizationEmailInviteLink.map((invite) => ({
          avatar: "",
          deactivatedAt: undefined,
          email: invite.email,
          id: invite.id,
          isCurrentUser: false,
          name: "",
          role: invite.role,
          status: "emailInvitePending",
        })),
      },
    };

    expect(actual).toEqual(expected);
  });

  test("given: multiple email invites for the same email, should: only show the latest invite", () => {
    const currentUsersRole = OrganizationMembershipRole.owner;
    const organization = createOrganizationWithLinksAndMembers({
      emailInviteCount: 3,
      inviteLinkCount: 0,
      memberCount: 0,
    });

    // Set same email for all invites but different dates
    const sameEmail = "test@example.com";
    organization.organizationEmailInviteLink[0]!.email = sameEmail;
    organization.organizationEmailInviteLink[0]!.createdAt = new Date(
      "2024-03-15",
    );
    organization.organizationEmailInviteLink[1]!.email = sameEmail;
    organization.organizationEmailInviteLink[1]!.createdAt = new Date(
      "2024-03-14",
    );
    organization.organizationEmailInviteLink[2]!.email = sameEmail;
    organization.organizationEmailInviteLink[2]!.createdAt = new Date(
      "2024-03-13",
    );

    const request = new Request("http://localhost");

    const actual = mapOrganizationDataToTeamMemberSettingsProps({
      currentUsersId: "some-id",
      currentUsersRole,
      organization,
      request,
    });

    // Should only show one invite with the latest date
    expect(actual.teamMemberTable.members).toHaveLength(1);
    expect(actual.teamMemberTable.members[0]).toEqual({
      avatar: "",
      deactivatedAt: undefined,
      email: sameEmail,
      id: organization.organizationEmailInviteLink[0]!.id,
      isCurrentUser: false,
      name: "",
      role: organization.organizationEmailInviteLink[0]!.role,
      status: "emailInvitePending",
    });
  });

  test("given: an organization that has reached the subscription seat limit, should: return correct props with organizationIsFull true", () => {
    const currentUsersRole = OrganizationMembershipRole.member;
    const stripeSubscriptionOverride = {
      items: [{ price: { product: { maxSeats: 1 } } }],
    } as unknown as StripeSubscriptionWithItemsAndPriceAndProduct;
    const organization = createOrganizationWithLinksAndMembers({
      emailInviteCount: 0,
      inviteLinkCount: 0,
      memberCount: 1,
      stripeSubscription: stripeSubscriptionOverride,
    });
    organization.memberships[0]!.role = currentUsersRole;
    const request = new Request("http://localhost");

    const actual = mapOrganizationDataToTeamMemberSettingsProps({
      currentUsersId: organization.memberships[0]!.member.id,
      currentUsersRole,
      organization,
      request,
    });

    const expected = {
      emailInviteCard: {
        currentUserIsOwner: false,
        organizationIsFull: true,
      },
      inviteLinkCard: {
        inviteLink: undefined,
        organizationIsFull: true,
      },
      organizationIsFull: true,
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
          status: index === 0 ? "createdTheOrganization" : "joinedViaLink",
        })),
      },
    };

    expect(actual).toEqual(expected);
  });

  test("given: an organization that has reached the subscription seat limit, should: return undefined for inviteLink even if link exists", () => {
    const currentUsersRole = OrganizationMembershipRole.member;
    const stripeSubscriptionOverride =
      createPopulatedStripeSubscriptionWithItemsAndPriceAndProduct({
        items: [{ price: { product: { maxSeats: 1 } } }],
      });
    const organization = createOrganizationWithLinksAndMembers({
      emailInviteCount: 0,
      inviteLinkCount: 1, // Create a link that should be ignored
      memberCount: 1,
      stripeSubscription: stripeSubscriptionOverride,
    });
    organization.memberships[0]!.role = currentUsersRole;
    const request = new Request("http://localhost");

    const actual = mapOrganizationDataToTeamMemberSettingsProps({
      currentUsersId: organization.memberships[0]!.member.id,
      currentUsersRole,
      organization,
      request,
    });

    const expected = {
      emailInviteCard: {
        currentUserIsOwner: false,
        organizationIsFull: true,
      },
      inviteLinkCard: {
        inviteLink: undefined, // Should be undefined even though link exists
        organizationIsFull: true,
      },
      organizationIsFull: true,
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
          status: index === 0 ? "createdTheOrganization" : "joinedViaLink",
        })),
      },
    };

    expect(actual).toEqual(expected);
  });

  test("given: an invite for an email that already has a membership, should: not show that invite", () => {
    const currentUsersRole = OrganizationMembershipRole.owner;
    // Create one member with a known email…
    const member = createPopulatedUserAccount({ email: "foo@bar.com" });
    const organization = {
      ...createPopulatedOrganization(),
      memberships: [
        {
          ...createPopulatedOrganizationMembership({
            memberId: member.id,
            organizationId: "org-id",
            role: OrganizationMembershipRole.owner,
          }),
          member,
        },
      ],
      // Two invites: one for the existing member email, one for a new email
      organizationEmailInviteLink: [
        createPopulatedOrganizationEmailInviteLink({
          createdAt: new Date("2024-04-01"),
          email: "foo@bar.com", // should be filtered out
          invitedById: member.id,
          organizationId: "org-id",
        }),
        createPopulatedOrganizationEmailInviteLink({
          createdAt: new Date("2024-04-02"),
          email: "new@invite.com", // should be kept
          invitedById: member.id,
          organizationId: "org-id",
        }),
      ],
      organizationInviteLinks: [],
      stripeSubscriptions: [],
    };

    const request = new Request("http://localhost");

    const actual = mapOrganizationDataToTeamMemberSettingsProps({
      currentUsersId: member.id,
      currentUsersRole,
      organization,
      request,
    });
    const expected = {
      emailInviteCard: {
        currentUserIsOwner: true,
        organizationIsFull: false,
      },
      inviteLinkCard: {
        inviteLink: undefined,
        organizationIsFull: false,
      },
      organizationIsFull: false,
      teamMemberTable: {
        currentUsersRole: OrganizationMembershipRole.owner,
        members: [
          // only the new invite, since foo@bar.com is already a member
          {
            avatar: "",
            deactivatedAt: undefined,
            email: "new@invite.com",
            id: organization.organizationEmailInviteLink[1]!.id,
            isCurrentUser: false,
            name: "",
            role: organization.organizationEmailInviteLink[1]!.role,
            status: "emailInvitePending",
          },
          // then the existing member
          {
            avatar: member.imageUrl,
            deactivatedAt: undefined,
            email: member.email,
            id: member.id,
            isCurrentUser: true,
            name: member.name,
            role: OrganizationMembershipRole.owner, // same as currentUsersRole
            status: "createdTheOrganization",
          },
        ],
      },
    };

    expect(actual).toEqual(expected);
  });
});
