import type { OrganizationMembership, UserAccount } from "@prisma/client";
import { OrganizationMembershipRole } from "@prisma/client";

import type { EmailInviteCardProps } from "./invite-by-email-card";
import type { InviteLinkCardProps } from "./invite-link-card";
import type { TeamMembersTableProps } from "./team-members-table";
import { retrieveOrganizationWithMembersAndLatestInviteLinkFromDatabaseBySlug } from "~/features/organizations/organizations-model.server";
import { asyncPipe } from "~/utils/async-pipe.server";
import { throwIfEntityIsMissing } from "~/utils/throw-if-entity-is-missing.server";

/**
 * Converts a token to an invite link.
 *
 * @param token - The token to convert.
 * @param request - The request object.
 * @returns The invite link.
 */
export const tokenToInviteLink = (token: string, request: Request) => {
  const requestUrl = new URL(request.url);
  const url = new URL("/organizations/invite-link", requestUrl.origin);
  url.searchParams.set("token", token);
  return url.toString();
};

export const requireOrganizationWithMembersAndLatestInviteLinkExistsBySlug =
  asyncPipe(
    retrieveOrganizationWithMembersAndLatestInviteLinkFromDatabaseBySlug,
    throwIfEntityIsMissing,
  );

export type OrganizationWithMembers = NonNullable<
  Awaited<
    ReturnType<
      typeof retrieveOrganizationWithMembersAndLatestInviteLinkFromDatabaseBySlug
    >
  >
>;

type Member = {
  avatar: string;
  email: string;
  id: string;
  isCurrentUser: boolean;
  name: string;
  role: OrganizationMembership["role"];
  deactivatedAt: Date | undefined;
  status: "createdTheOrganization" | "joinedViaLink" | "emailInvitePending";
};

/**
 * Maps organization data to team member settings props.
 *
 * @param currentUsersRole - The current user's role.
 * @param organization - The organization.
 * @param request - The request object.
 * @returns The team member settings props.
 */
export function mapOrganizationDataToTeamMemberSettingsProps({
  currentUsersId,
  currentUsersRole,
  organization,
  request,
}: {
  currentUsersId: UserAccount["id"];
  currentUsersRole: OrganizationMembership["role"];
  organization: OrganizationWithMembers;
  request: Request;
}): {
  emailInviteCard: Pick<
    EmailInviteCardProps,
    "currentUserIsOwner" | "organizationIsFull"
  >;
  inviteLinkCard: InviteLinkCardProps;
  organizationIsFull: boolean;
  teamMemberTable: TeamMembersTableProps;
} {
  const link = organization.organizationInviteLinks[0];
  const currentSubscription = organization.stripeSubscriptions[0];
  const maxSeats = currentSubscription?.items[0]?.price.product.maxSeats ?? 25;
  const organizationIsFull = organization.memberships.length >= maxSeats;

  // Exclude invites for users who are already members
  const membershipEmails = new Set(
    organization.memberships.map((m) => m.member.email),
  );

  return {
    emailInviteCard: {
      currentUserIsOwner: currentUsersRole === OrganizationMembershipRole.owner,
      organizationIsFull,
    },
    inviteLinkCard: {
      inviteLink:
        link && !organizationIsFull
          ? {
              expiryDate: link.expiresAt.toISOString(),
              href: tokenToInviteLink(link.token, request),
            }
          : undefined,
      organizationIsFull,
    },
    organizationIsFull,
    teamMemberTable: {
      currentUsersRole,
      members: [
        // Email invites first, sorted, distinct, and excluding existing members
        ...organization.organizationEmailInviteLink
          .toSorted((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          // Filter to only keep the first (most recent) invite for each email
          .filter(
            (invite, index, array) =>
              array.findIndex((index_) => index_.email === invite.email) ===
              index,
          )
          .filter((invite) => !membershipEmails.has(invite.email))
          .map(
            (invite): Member => ({
              avatar: "",
              deactivatedAt: undefined,
              email: invite.email,
              id: invite.id,
              isCurrentUser: false,
              name: "",
              role: invite.role,
              status: "emailInvitePending",
            }),
          ),

        // Then existing members
        ...organization.memberships.map((membership): Member => {
          const isCurrentUser = membership.member.id === currentUsersId;
          return {
            avatar: membership.member.imageUrl,
            deactivatedAt: membership.deactivatedAt ?? undefined,
            email: membership.member.email,
            id: membership.member.id,
            isCurrentUser,
            name: membership.member.name,
            role: membership.role,
            status: isCurrentUser ? "createdTheOrganization" : "joinedViaLink",
          };
        }),
      ],
    },
  };
}
