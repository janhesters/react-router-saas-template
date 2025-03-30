import { createId } from '@paralleldrive/cuid2';
import type { Prisma } from '@prisma/client';
import { OrganizationMembershipRole } from '@prisma/client';
import { addDays } from 'date-fns';
import { data } from 'react-router';
import { z } from 'zod';

import { getIsDataWithResponseInit } from '~/utils/get-is-data-with-response-init.server';
import { badRequest, created, forbidden } from '~/utils/http-responses.server';
import { validateFormData } from '~/utils/validate-form-data.server';

import {
  retrieveLatestInviteLinkFromDatabaseByOrganizationId,
  saveOrganizationInviteLinkToDatabase,
  updateOrganizationInviteLinkInDatabaseById,
} from '../../organization-invite-link-model.server';
import {
  retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId,
  updateOrganizationMembershipInDatabase,
} from '../../organization-membership-model.server';
import { requireUserIsMemberOfOrganization } from '../../organizations-helpers.server';
import {
  CHANGE_ROLE_INTENT,
  CREATE_NEW_INVITE_LINK_INTENT,
  DEACTIVATE_INVITE_LINK_INTENT,
  INVITE_BY_EMAIL_INTENT,
} from './team-members-constants';
import {
  changeRoleSchema,
  inviteByEmailSchema,
} from './team-members-settings-schemas';
import type { Route } from '.react-router/types/app/routes/organizations_+/$organizationSlug+/settings+/+types/members';

const schema = z.discriminatedUnion('intent', [
  inviteByEmailSchema,
  z.object({ intent: z.literal(CREATE_NEW_INVITE_LINK_INTENT) }),
  z.object({ intent: z.literal(DEACTIVATE_INVITE_LINK_INTENT) }),
  changeRoleSchema,
]);

export async function teamMembersAction({ request, params }: Route.ActionArgs) {
  try {
    const { user, organization, role } =
      await requireUserIsMemberOfOrganization(request, params.organizationSlug);

    if (role === OrganizationMembershipRole.member) {
      throw forbidden();
    }

    const body = await validateFormData(request, schema);

    switch (body.intent) {
      case CREATE_NEW_INVITE_LINK_INTENT: {
        // Deactivate any existing active invite link
        const latestInviteLink =
          await retrieveLatestInviteLinkFromDatabaseByOrganizationId(
            organization.id,
          );

        if (latestInviteLink) {
          await updateOrganizationInviteLinkInDatabaseById({
            id: latestInviteLink.id,
            organizationInviteLink: { deactivatedAt: new Date() },
          });
        }

        // Create a new invite link that expires in 2 days
        const token = createId();
        const expiresAt = addDays(new Date(), 2);
        await saveOrganizationInviteLinkToDatabase({
          token,
          expiresAt,
          creatorId: user.id,
          organizationId: organization.id,
        });

        return created();
      }

      case DEACTIVATE_INVITE_LINK_INTENT: {
        const latestInviteLink =
          await retrieveLatestInviteLinkFromDatabaseByOrganizationId(
            organization.id,
          );

        if (latestInviteLink) {
          await updateOrganizationInviteLinkInDatabaseById({
            id: latestInviteLink.id,
            organizationInviteLink: { deactivatedAt: new Date() },
          });
        }

        return created();
      }

      case CHANGE_ROLE_INTENT: {
        const { userId: targetUserId, role: requestedRoleOrStatus } = body;

        // Prevent users from changing their own role/status
        if (targetUserId === user.id) {
          throw forbidden({
            errors: { form: 'You cannot change your own role or status.' },
          });
        }

        // Retrieve the target member's current membership details
        const targetMembership =
          await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
            {
              userId: targetUserId,
              organizationId: organization.id,
            },
          );

        // Handle case where target user isn't found in this org
        if (!targetMembership) {
          throw badRequest({
            errors: {
              userId: 'Target user is not a member of this organization.',
            },
          });
        }

        // Apply role-based permissions (requesting user's role = 'role')
        if (role === OrganizationMembershipRole.admin) {
          // Admins cannot modify Owners
          if (targetMembership.role === OrganizationMembershipRole.owner) {
            throw forbidden({
              errors: {
                form: 'Administrators cannot modify the role or status of owners.',
              },
            });
          }

          // Admins also cannot promote others to Owner
          if (requestedRoleOrStatus === OrganizationMembershipRole.owner) {
            throw forbidden({
              errors: {
                form: 'Administrators cannot promote members to the owner role.',
              },
            });
          }
        }
        // Owners have full permissions (already checked for self-modification)

        // Prepare the data for the database update
        let updateData: Prisma.OrganizationMembershipUpdateInput;
        if (requestedRoleOrStatus === 'deactivated') {
          // Set deactivatedAt timestamp
          updateData = { deactivatedAt: new Date() };
        } else {
          // Update role and ensure deactivatedAt is null
          // `requestedRoleOrStatus` here is guaranteed by zod schema to be
          // 'member', 'admin', or 'owner'
          const newRole = requestedRoleOrStatus;
          // eslint-disable-next-line unicorn/no-null
          updateData = { role: newRole, deactivatedAt: null };
        }

        // Perform the database update
        await updateOrganizationMembershipInDatabase({
          userId: targetUserId,
          organizationId: organization.id,
          data: updateData,
        });

        // Return success
        return data({});
      }

      case INVITE_BY_EMAIL_INTENT: {
        throw new Error('Not implemented');
      }
    }
  } catch (error) {
    if (getIsDataWithResponseInit(error)) {
      return error;
    }

    throw error;
  }
}
