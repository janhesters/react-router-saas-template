import { OrganizationMembershipRole } from '@prisma/client';
import type { Return } from '@prisma/client/runtime/library';

import type { requireAuthenticatedUserWithMembershipsExists } from '../../user-accounts-helpers.server';
import type { DangerZoneProps } from './danger-zone';

export function mapUserAccountWithMembershipsToDangerZoneProps(
  user: Awaited<
    Return<typeof requireAuthenticatedUserWithMembershipsExists>
  >['user'],
): DangerZoneProps {
  const imlicitlyDeletedOrganizations: string[] = [];
  const organizationsBlockingAccountDeletion: string[] = [];

  for (const membership of user.memberships) {
    // Only consider organizations where the user is an owner
    if (membership.role !== OrganizationMembershipRole.owner) {
      continue;
    }

    const memberCount = membership.organization._count.memberships;

    // If the user is the only member, the organization will be implicitly deleted
    if (memberCount === 1) {
      imlicitlyDeletedOrganizations.push(membership.organization.name);
    }
    // If there are other members, the organization blocks account deletion
    else {
      organizationsBlockingAccountDeletion.push(membership.organization.name);
    }
  }

  return {
    imlicitlyDeletedOrganizations,
    organizationsBlockingAccountDeletion,
  };
}
