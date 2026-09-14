import { report } from "@conform-to/react/future";
import { createId } from "@paralleldrive/cuid2";
import { addDays } from "date-fns";
import { data } from "react-router";
import { z } from "zod";

import { withOrganizationMutationLock } from "../../deletion/organization-mutation-lock.server";
import {
  retrieveActiveOrganizationMembershipByEmailAndOrganizationId,
  retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId,
} from "../../organization-membership-model.server";
import {
  saveOrganizationEmailInviteLinkToDatabase,
  updateEmailInviteLinkInDatabaseById,
} from "../../organizations-email-invite-link-model.server";
import { getOrganizationIsFull } from "../../organizations-helpers.server";
import {
  retrieveLatestInviteLinkFromDatabaseByOrganizationId,
  saveOrganizationInviteLinkToDatabase,
  updateOrganizationInviteLinkInDatabaseById,
} from "../../organizations-invite-link-model.server";
import { organizationMembershipContext } from "../../organizations-middleware.server";
import { retrieveMemberCountAndLatestStripeSubscriptionFromDatabaseByOrganizationId } from "../../organizations-model.server";
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
import { getInstance } from "~/features/localization/i18next-middleware.server";
import type { OrganizationMembership, Prisma } from "~/generated/client";
import { OrganizationMembershipRole } from "~/generated/client";
import { prisma } from "~/utils/database.server";
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

function membershipIsActive(
  membership: Pick<OrganizationMembership, "deactivatedAt">,
  now: Date,
): boolean {
  return membership.deactivatedAt === null || membership.deactivatedAt > now;
}

function requireMembershipChangePermission({
  actorMembership,
  now,
  requestedRoleOrStatus,
  targetMembership,
  targetUserId,
  userId,
}: {
  actorMembership: OrganizationMembership | null;
  now: Date;
  requestedRoleOrStatus: OrganizationMembershipRole | "deactivated";
  targetMembership: OrganizationMembership | null;
  targetUserId: string;
  userId: string;
}): OrganizationMembership {
  if (
    !actorMembership ||
    !membershipIsActive(actorMembership, now) ||
    actorMembership.role === OrganizationMembershipRole.member
  ) {
    throw forbidden();
  }
  if (targetUserId === userId) {
    throw forbidden({
      errors: { form: "You cannot change your own role or status." },
    });
  }
  if (!targetMembership) {
    throw badRequest({
      errors: { userId: "Target user is not a member of this organization." },
    });
  }
  if (actorMembership.role === OrganizationMembershipRole.admin) {
    if (targetMembership.role === OrganizationMembershipRole.owner) {
      throw forbidden({
        errors: {
          form: "Administrators cannot modify the role or status of owners.",
        },
      });
    }
    if (requestedRoleOrStatus === OrganizationMembershipRole.owner) {
      throw forbidden({
        errors: {
          form: "Administrators cannot promote members to the owner role.",
        },
      });
    }
  }
  return targetMembership;
}

export async function teamMembersAction({
  context,
  request,
}: Route.ActionArgs) {
  try {
    const { organization, role, user } = context.get(
      organizationMembershipContext,
    );
    const i18n = getInstance(context);

    if (role === OrganizationMembershipRole.member) {
      throw forbidden();
    }

    const result = await validateFormData(request, schema);

    if (!result.success) {
      return result.response;
    }

    const { data: body, submission } = result;

    switch (body.intent) {
      case CREATE_NEW_INVITE_LINK_INTENT: {
        if (getOrganizationIsFull(organization)) {
          return badRequest({
            result: report(submission, {
              error: {
                fieldErrors: {
                  email: [
                    "organizations:settings.teamMembers.inviteByEmail.form.organizationFull",
                  ],
                },
                formErrors: [],
              },
            }),
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

        return created({});
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

        return created({});
      }

      case CHANGE_ROLE_INTENT: {
        return await withOrganizationMutationLock(organization.id, async () => {
          const now = new Date();
          const { role: requestedRoleOrStatus, userId: targetUserId } = body;
          const actorMembership =
            await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
              {
                organizationId: organization.id,
                userId: user.id,
              },
            );
          const targetMembership = requireMembershipChangePermission({
            actorMembership,
            now,
            requestedRoleOrStatus,
            targetMembership:
              await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
                {
                  organizationId: organization.id,
                  userId: targetUserId,
                },
              ),
            targetUserId,
            userId: user.id,
          });
          const targetIsActive = membershipIsActive(targetMembership, now);
          if (requestedRoleOrStatus === "deactivated" && !targetIsActive)
            return data({});
          const currentBilling =
            await retrieveMemberCountAndLatestStripeSubscriptionFromDatabaseByOrganizationId(
              organization.id,
              now,
            );
          if (!currentBilling) throw forbidden();
          const currentOrganization = { ...organization, ...currentBilling };

          /// Get the subscription of the organization, if it exists.
          const subscription = currentOrganization.stripeSubscriptions[0];
          // Prepare the data for the database update
          let updateData: Prisma.OrganizationMembershipUpdateInput;
          if (requestedRoleOrStatus === "deactivated") {
            // Set deactivatedAt timestamp
            updateData = { deactivatedAt: new Date() };

            if (subscription?.items[0]) {
              await adjustSeats({
                newQuantity: currentOrganization._count.memberships - 1,
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
            if (!targetIsActive) {
              if (getOrganizationIsFull(currentOrganization)) {
                const toastHeaders = await createToastHeaders({
                  description: i18n.t(
                    "organizations:settings.teamMembers.inviteByEmail.organizationFullToastDescription",
                  ),
                  title: i18n.t(
                    "organizations:settings.teamMembers.inviteByEmail.organizationFullToastTitle",
                  ),
                  type: "error",
                });
                return badRequest(
                  {
                    result: report(submission, {
                      error: {
                        fieldErrors: {
                          email: [
                            "organizations:settings.teamMembers.inviteByEmail.form.organizationFull",
                          ],
                        },
                        formErrors: [],
                      },
                    }),
                  },
                  { headers: toastHeaders },
                );
              }

              if (subscription?.items[0]) {
                await adjustSeats({
                  newQuantity: currentOrganization._count.memberships + 1,
                  subscriptionId: subscription.stripeId,
                  subscriptionItemId: subscription.items[0].stripeId,
                });
              }
            }
          }

          // Provider calls can outlive their separate advisory connection.
          // Match account deletion's row-lock order, then authorize and publish
          // atomically on this transaction's connection, after network work.
          await prisma.$transaction(async (transaction) => {
            await transaction.$queryRaw`SELECT id FROM "Organization" WHERE id = ${organization.id} FOR UPDATE`;
            await transaction.$queryRaw`SELECT "memberId" FROM "OrganizationMembership" WHERE "organizationId" = ${organization.id} ORDER BY "memberId" FOR UPDATE`;
            const publishedAt = new Date();
            const currentTarget = requireMembershipChangePermission({
              actorMembership:
                await transaction.organizationMembership.findUnique({
                  where: {
                    memberId_organizationId: {
                      memberId: user.id,
                      organizationId: organization.id,
                    },
                  },
                }),
              now: publishedAt,
              requestedRoleOrStatus,
              targetMembership:
                await transaction.organizationMembership.findUnique({
                  where: {
                    memberId_organizationId: {
                      memberId: targetUserId,
                      organizationId: organization.id,
                    },
                  },
                }),
              targetUserId,
              userId: user.id,
            });
            if (
              requestedRoleOrStatus === "deactivated" &&
              !membershipIsActive(currentTarget, publishedAt)
            ) {
              return;
            }
            await transaction.organizationMembership.update({
              data: updateData,
              where: {
                memberId_organizationId: {
                  memberId: targetUserId,
                  organizationId: organization.id,
                },
              },
            });
          });

          // Return success
          return data({});
        });
      }

      case INVITE_BY_EMAIL_INTENT: {
        if (getOrganizationIsFull(organization)) {
          return badRequest({
            result: report(submission, {
              error: {
                fieldErrors: {
                  email: [
                    "organizations:settings.teamMembers.inviteByEmail.form.organizationFull",
                  ],
                },
                formErrors: [],
              },
            }),
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
            result: report(submission, {
              error: {
                fieldErrors: {
                  email: [
                    i18n.t(
                      "organizations:settings.teamMembers.inviteByEmail.form.emailAlreadyMember",
                      { email: body.email },
                    ),
                  ],
                },
                formErrors: [],
              },
            }),
          });
        }

        const emailInvite = await saveOrganizationEmailInviteLinkToDatabase({
          deactivatedAt: new Date(),
          email: body.email,
          expiresAt: addDays(new Date(), 2),
          invitedById: user.id,
          organizationId: organization.id,
          role: body.role,
        });

        const joinUrl = new URL(
          "/organizations/email-invite",
          process.env.APP_URL,
        );
        joinUrl.searchParams.set("token", emailInvite.token);

        const result = await sendEmail({
          react: (
            <InviteEmail
              buttonText={i18n.t(
                "organizations:settings.teamMembers.inviteByEmail.inviteEmail.buttonText",
                {
                  organizationName: organization.name,
                },
              )}
              buttonUrl={joinUrl.toString()}
              callToAction={i18n.t(
                "organizations:settings.teamMembers.inviteByEmail.inviteEmail.callToAction",
              )}
              description={i18n.t(
                "organizations:settings.teamMembers.inviteByEmail.inviteEmail.description",
                {
                  appName: i18n.t("translation:appName"),
                  inviterName: user.name,
                  organizationName: organization.name,
                },
              )}
              title={i18n.t(
                "organizations:settings.teamMembers.inviteByEmail.inviteEmail.title",
                {
                  appName: i18n.t("translation:appName"),
                },
              )}
            />
          ),
          subject: i18n.t(
            "organizations:settings.teamMembers.inviteByEmail.inviteEmail.subject",
            {
              appName: i18n.t("translation:appName"),
              inviteName: user.name,
            },
          ),
          to: body.email,
        });

        if (result.status === "error") {
          return badRequest({
            result: report(submission, {
              error: {
                fieldErrors: { email: [result.error.message] },
                formErrors: [],
              },
            }),
          });
        }

        await updateEmailInviteLinkInDatabaseById({
          emailInviteLink: { deactivatedAt: null },
          id: emailInvite.id,
        });

        const toastHeaders = await createToastHeaders({
          title: i18n.t(
            "organizations:settings.teamMembers.inviteByEmail.successToastTitle",
          ),
          type: "success",
        });

        return data({ success: body.email }, { headers: toastHeaders });
      }
    }
  } catch (error) {
    if (getIsDataWithResponseInit(error)) {
      return error;
    }

    throw error;
  }
}
