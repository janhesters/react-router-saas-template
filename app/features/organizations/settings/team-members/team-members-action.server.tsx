import { createId } from "@paralleldrive/cuid2";
import type { Prisma } from "@prisma/client";
import { OrganizationMembershipRole } from "@prisma/client";
import { addDays } from "date-fns";
import { data } from "react-router";
import { z } from "zod";

import {
  retrieveActiveOrganizationMembershipByEmailAndOrganizationId,
  retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId,
  updateOrganizationMembershipInDatabase,
} from "../../organization-membership-model.server";
import { saveOrganizationEmailInviteLinkToDatabase } from "../../organizations-email-invite-link-model.server";
import { getOrganizationIsFull } from "../../organizations-helpers.server";
import {
  retrieveLatestInviteLinkFromDatabaseByOrganizationId,
  saveOrganizationInviteLinkToDatabase,
  updateOrganizationInviteLinkInDatabaseById,
} from "../../organizations-invite-link-model.server";
import { organizationMembershipContext } from "../../organizations-middleware.server";
import { InviteEmail } from "./invite-email";
import {
  CHANGE_ROLE_INTENT,
  CREATE_NEW_INVITE_LINK_INTENT,
  DEACTIVATE_INVITE_LINK_INTENT,
  INVITE_BY_EMAIL_INTENT,
} from "./team-members-constants";
import {
  changeRoleSchema,
  inviteByEmailSchema,
} from "./team-members-settings-schemas";
import type { Route } from ".react-router/types/app/routes/_authenticated-routes+/organizations_+/$organizationSlug+/settings+/+types/members";
import { adjustSeats } from "~/features/billing/stripe-helpers.server";
import { getInstance } from "~/features/localization/i18n-middleware.server";
import { combineHeaders } from "~/utils/combine-headers.server";
import { sendEmail } from "~/utils/email.server";
import { getIsDataWithResponseInit } from "~/utils/get-is-data-with-response-init.server";
import { badRequest, created, forbidden } from "~/utils/http-responses.server";
import { createToastHeaders } from "~/utils/toast.server";
import { validateFormData } from "~/utils/validate-form-data.server";

const schema = z.discriminatedUnion("intent", [
  inviteByEmailSchema,
  z.object({ intent: z.literal(CREATE_NEW_INVITE_LINK_INTENT) }),
  z.object({ intent: z.literal(DEACTIVATE_INVITE_LINK_INTENT) }),
  changeRoleSchema,
]);

export async function teamMembersAction({
  request,
  context,
}: Route.ActionArgs) {
  try {
    const { user, organization, role, headers } = context.get(
      organizationMembershipContext,
    );
    const i18n = getInstance(context);

    if (role === OrganizationMembershipRole.member) {
      throw forbidden();
    }

    const body = await validateFormData(request, schema);

    switch (body.intent) {
      case CREATE_NEW_INVITE_LINK_INTENT: {
        if (getOrganizationIsFull(organization)) {
          return badRequest({
            errors: {
              email: {
                message:
                  "organizations:settings.team-members.invite-by-email.form.organization-full",
              },
            },
          });
        }

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
          creatorId: user.id,
          expiresAt,
          organizationId: organization.id,
          token,
        });

        return created({}, { headers });
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

        return created({}, { headers });
      }

      case CHANGE_ROLE_INTENT: {
        const { userId: targetUserId, role: requestedRoleOrStatus } = body;

        // Prevent users from changing their own role/status
        if (targetUserId === user.id) {
          throw forbidden({
            errors: { form: "You cannot change your own role or status." },
          });
        }

        // Retrieve the target member's current membership details
        const targetMembership =
          await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
            {
              organizationId: organization.id,
              userId: targetUserId,
            },
          );

        // Handle case where target user isn't found in this org
        if (!targetMembership) {
          throw badRequest({
            errors: {
              userId: "Target user is not a member of this organization.",
            },
          });
        }

        // Apply role-based permissions (requesting user's role = 'role')
        if (role === OrganizationMembershipRole.admin) {
          // Admins cannot modify Owners
          if (targetMembership.role === OrganizationMembershipRole.owner) {
            throw forbidden({
              errors: {
                form: "Administrators cannot modify the role or status of owners.",
              },
            });
          }

          // Admins also cannot promote others to Owner
          if (requestedRoleOrStatus === OrganizationMembershipRole.owner) {
            throw forbidden({
              errors: {
                form: "Administrators cannot promote members to the owner role.",
              },
            });
          }
        }
        // Owners have full permissions (already checked for self-modification)

        /// Get the subscription of the organization, if it exists.
        const subscription = organization.stripeSubscriptions[0];
        // Prepare the data for the database update
        let updateData: Prisma.OrganizationMembershipUpdateInput;
        if (requestedRoleOrStatus === "deactivated") {
          // Set deactivatedAt timestamp
          updateData = { deactivatedAt: new Date() };

          if (subscription?.items[0]) {
            await adjustSeats({
              newQuantity: organization._count.memberships - 1,
              subscriptionId: subscription.stripeId,
              subscriptionItemId: subscription.items[0].stripeId,
            });
          }
        } else {
          // Update role and ensure deactivatedAt is null
          // `requestedRoleOrStatus` here is guaranteed by zod schema to be
          // 'member', 'admin', or 'owner'
          const newRole = requestedRoleOrStatus;
          updateData = { deactivatedAt: null, role: newRole };

          // If the user was deactivated, and there is a subscription,
          // they will now take up a seat again.
          if (targetMembership.deactivatedAt) {
            if (getOrganizationIsFull(organization)) {
              const toastHeaders = await createToastHeaders({
                description: i18n.t(
                  "organizations:settings.team-members.invite-by-email.organization-full-toast-description",
                ),
                title: i18n.t(
                  "organizations:settings.team-members.invite-by-email.organization-full-toast-title",
                ),
                type: "error",
              });
              return badRequest(
                {
                  errors: {
                    email: {
                      message:
                        "organizations:settings.team-members.invite-by-email.form.organization-full",
                    },
                  },
                },
                { headers: combineHeaders(headers, toastHeaders) },
              );
            }

            if (subscription?.items[0]) {
              await adjustSeats({
                newQuantity: organization._count.memberships + 1,
                subscriptionId: subscription.stripeId,
                subscriptionItemId: subscription.items[0].stripeId,
              });
            }
          }
        }

        // Perform the database update
        await updateOrganizationMembershipInDatabase({
          data: updateData,
          organizationId: organization.id,
          userId: targetUserId,
        });

        // Return success
        return data({}, { headers });
      }

      case INVITE_BY_EMAIL_INTENT: {
        if (getOrganizationIsFull(organization)) {
          return badRequest({
            errors: {
              email: {
                message:
                  "organizations:settings.team-members.invite-by-email.form.organization-full",
              },
            },
          });
        }

        if (
          role !== OrganizationMembershipRole.owner &&
          body.role === OrganizationMembershipRole.owner
        ) {
          return forbidden({
            errors: {
              message: "Only organization owners can invite as owners.",
            },
          });
        }

        const existingMember =
          await retrieveActiveOrganizationMembershipByEmailAndOrganizationId({
            email: body.email,
            organizationId: organization.id,
          });

        if (existingMember) {
          return badRequest({
            errors: {
              email: {
                message: i18n.t(
                  "organizations:settings.team-members.invite-by-email.form.email-already-member",
                  { email: body.email },
                ),
              },
            },
          });
        }

        const emailInvite = await saveOrganizationEmailInviteLinkToDatabase({
          email: body.email,
          expiresAt: addDays(new Date(), 2),
          invitedById: user.id,
          organizationId: organization.id,
          role: body.role,
        });

        const joinUrl = `${process.env.APP_URL}/organizations/email-invite?token=${emailInvite.token}`;

        const result = await sendEmail({
          react: (
            <InviteEmail
              buttonText={i18n.t(
                "organizations:settings.team-members.invite-by-email.invite-email.button-text",
                {
                  organizationName: organization.name,
                },
              )}
              buttonUrl={joinUrl}
              callToAction={i18n.t(
                "organizations:settings.team-members.invite-by-email.invite-email.call-to-action",
              )}
              description={i18n.t(
                "organizations:settings.team-members.invite-by-email.invite-email.description",
                {
                  appName: i18n.t("common:app-name"),
                  inviterName: user.name,
                  organizationName: organization.name,
                },
              )}
              title={i18n.t(
                "organizations:settings.team-members.invite-by-email.invite-email.title",
                {
                  appName: i18n.t("common:app-name"),
                },
              )}
            />
          ),
          subject: i18n.t(
            "organizations:settings.team-members.invite-by-email.invite-email.subject",
            {
              appName: i18n.t("common:app-name"),
              inviteName: user.name,
            },
          ),
          to: body.email,
        });

        if (result.status === "error") {
          return badRequest({
            errors: { email: { message: result.error.message } },
          });
        }

        const toastHeaders = await createToastHeaders({
          title: i18n.t(
            "organizations:settings.team-members.invite-by-email.success-toast-title",
          ),
          type: "success",
        });

        return data(
          { success: body.email },
          { headers: combineHeaders(headers, toastHeaders) },
        );
      }
    }
  } catch (error) {
    if (getIsDataWithResponseInit(error)) {
      return error;
    }

    throw error;
  }
}
