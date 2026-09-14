import type { FileUpload } from "@remix-run/form-data-parser";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { i18n } from "i18next";
import type { RouterContextProvider } from "react-router";
import { href } from "react-router";
import { promiseHash } from "remix-utils/promise";

import { adjustSeats } from "../billing/stripe-helpers.server";
import type {
  OnboardingUser,
  OrganizationWithMembershipsAndSubscriptions,
} from "../onboarding/onboarding-helpers.server";
import { requireOnboardedUserAccountExists } from "../onboarding/onboarding-helpers.server";
import { getValidEmailInviteInfo } from "./accept-email-invite/accept-email-invite-helpers.server";
import { destroyEmailInviteInfoSession } from "./accept-email-invite/accept-email-invite-session.server";
import { getValidInviteLinkInfo } from "./accept-invite-link/accept-invite-link-helpers.server";
import { destroyInviteLinkInfoSession } from "./accept-invite-link/accept-invite-link-session.server";
import { withOrganizationMutationLock } from "./deletion/organization-mutation-lock.server";
import {
  consumeEmailInviteLinkAndAddMemberToOrganizationInDatabase,
  EmailInviteLinkEmailMismatchError,
  EmailInviteLinkNotConsumableError,
  EmailInviteLinkOrganizationFullError,
  retrieveActiveEmailInviteLinkFromDatabaseByToken,
} from "./organizations-email-invite-link-model.server";
import {
  InviteLinkOrganizationFullError,
  joinOrganizationWithInviteLinkInDatabase,
} from "./organizations-invite-link-model.server";
import { retrieveMemberCountAndLatestStripeSubscriptionFromDatabaseByOrganizationId } from "./organizations-model.server";
import type {
  Organization,
  OrganizationEmailInviteLink,
  OrganizationInviteLink,
  OrganizationMembershipRole,
  UserAccount,
} from "~/generated/client";
import { combineHeaders } from "~/utils/combine-headers.server";
import { notFound } from "~/utils/http-responses.server";
import { uploadOwnedImage } from "~/utils/image-replacement.server";
import { throwIfEntityIsMissing } from "~/utils/throw-if-entity-is-missing.server";
import { redirectWithToast } from "~/utils/toast.server";

/**
 * Finds an organization by ID if the given user is a member of it.
 *
 * @param user - The user to check membership for.
 * @param organizationId - The ID of the organization to find.
 * @returns The organization if found and user is a member.
 * @throws {Response} 404 Not Found if user is not a member or organization
 * doesn't exist.
 */
export function findOrganizationIfUserIsMemberById<User extends OnboardingUser>(
  user: User,
  organizationId: Organization["id"],
) {
  const membership = user.memberships.find(
    (membership) => membership.organization.id === organizationId,
  );

  if (!membership) {
    throw notFound();
  }

  const organization = throwIfEntityIsMissing(membership.organization);

  return { organization, role: membership.role };
}

/**
 * Finds an organization by slug if the given user is a member of it.
 *
 * @param user - The user to check membership for.
 * @param organizationSlug - The slug of the organization to find.
 * @returns The organization if found and user is a member.
 * @throws {Response} 404 Not Found if user is not a member or organization
 * doesn't exist.
 */
export function findOrganizationIfUserIsMemberBySlug<
  User extends OnboardingUser,
>(user: User, organizationSlug: Organization["slug"]) {
  const membership = user.memberships.find(
    (membership) => membership.organization.slug === organizationSlug,
  );

  if (!membership) {
    throw notFound();
  }

  const organization = throwIfEntityIsMissing(membership.organization);

  return { organization, role: membership.role };
}

/**
 * Requires that the authenticated user from the request is a member of the
 * specified organization.
 *
 * @param request - The incoming request.
 * @param organizationSlug - The slug of the organization to check membership
 * for.
 * @returns Object containing the user, organization and auth headers.
 * @throws {Response} 404 Not Found if user is not a member or organization
 * doesn't exist.
 */
export async function requireUserIsMemberOfOrganization({
  context,
  organizationSlug,
  request,
}: {
  context: Readonly<RouterContextProvider>;
  organizationSlug: Organization["slug"];
  request: Request;
}) {
  const { user } = await requireOnboardedUserAccountExists({
    context,
    request,
  });
  const { organization, role } = findOrganizationIfUserIsMemberBySlug(
    user,
    organizationSlug,
  );
  return { organization, role, user };
}

/** Call while holding the organization lock through membership and Stripe writes. */
async function adjustOrganizationSeatsAfterInvite(
  organizationId: string,
): Promise<void> {
  const organization =
    await retrieveMemberCountAndLatestStripeSubscriptionFromDatabaseByOrganizationId(
      organizationId,
    );
  const subscription = organization?.stripeSubscriptions[0];
  const item = subscription?.items[0];
  if (
    !organization ||
    !subscription ||
    subscription.status === "canceled" ||
    !item
  )
    return;

  await adjustSeats({
    newQuantity: organization._count.memberships,
    subscriptionId: subscription.stripeId,
    subscriptionItemId: item.stripeId,
  });
}

/**
 * Accepts an invite link and adds the user to the organization. Also adjusts
 * the number of seats on the organization's subscription if it exists.
 *
 * @param userAccountId - The ID of the user account to add to the organization.
 * @param organizationId - The ID of the organization to add the user to.
 * @param inviteLinkId - The ID of the invite link to accept.
 */
export async function acceptInviteLink({
  i18n,
  inviteLinkId,
  inviteLinkToken,
  organizationId,
  request,
  userAccountId,
}: {
  i18n: i18n;
  inviteLinkId: OrganizationInviteLink["id"];
  inviteLinkToken: OrganizationInviteLink["token"];
  organizationId: Organization["id"];
  request: Request;
  userAccountId: UserAccount["id"];
}): Promise<{ outcome: "accepted" | "alreadyMember" }> {
  try {
    return await withOrganizationMutationLock(organizationId, async () => {
      const result = await joinOrganizationWithInviteLinkInDatabase({
        inviteLinkId,
        organizationId,
        userAccountId,
      });

      if (result.outcome === "alreadyMember") return result;

      // Keep deletion and other membership edits out until the provider write
      // settles, and use the current committed count instead of a snapshot.
      await adjustOrganizationSeatsAfterInvite(organizationId);
      return { outcome: "accepted" };
    });
  } catch (error) {
    if (error instanceof InviteLinkOrganizationFullError) {
      throw await redirectWithToast(
        `${href("/organizations/invite-link")}?token=${inviteLinkToken}`,
        {
          description: i18n.t(
            "organizations:acceptInviteLink.organizationFullToastDescription",
          ),
          title: i18n.t(
            "organizations:acceptInviteLink.organizationFullToastTitle",
          ),
          type: "error",
        },
        { headers: await destroyInviteLinkInfoSession(request) },
      );
    }

    throw error;
  }
}

/** The result of securely accepting an email invite. */
export type AcceptEmailInviteResult =
  | {
      organization: Pick<Organization, "id" | "name" | "slug">;
      outcome: "accepted";
      role: OrganizationMembershipRole;
    }
  | {
      organization: Pick<Organization, "id" | "name" | "slug">;
      outcome: "alreadyMember";
    }
  | { outcome: "rejected" };

/**
 * Accepts an email invite only for the authenticated identity that owns the
 * invited address.
 *
 * Organization and role are derived from the active invite. Its exclusive
 * claim and membership creation share one transaction, and seat billing runs
 * only after that transaction commits. The organization lock spans both the
 * membership transaction and its provider write.
 */
export async function acceptEmailInvite({
  emailInviteToken,
  i18n,
  request,
  userAccountId,
  verifiedUserEmail,
}: {
  emailInviteToken: OrganizationEmailInviteLink["token"];
  i18n: i18n;
  request: Request;
  userAccountId: UserAccount["id"];
  verifiedUserEmail: string | undefined;
}): Promise<AcceptEmailInviteResult> {
  try {
    const invite =
      await retrieveActiveEmailInviteLinkFromDatabaseByToken(emailInviteToken);
    if (!invite) return { outcome: "rejected" };

    return await withOrganizationMutationLock(
      invite.organizationId,
      async () => {
        const result =
          await consumeEmailInviteLinkAndAddMemberToOrganizationInDatabase({
            emailInviteToken,
            // Revalidate the organization as part of the exclusive claim: a
            // changed invite must not create membership under another org's lock.
            expectedOrganizationId: invite.organizationId,
            userAccountId,
            verifiedUserEmail,
          });

        if (result.outcome === "alreadyMember") return result;

        await adjustOrganizationSeatsAfterInvite(result.organization.id);
        return {
          organization: result.organization,
          outcome: "accepted",
          role: result.role,
        };
      },
    );
  } catch (error) {
    if (
      error instanceof EmailInviteLinkNotConsumableError ||
      error instanceof EmailInviteLinkEmailMismatchError
    ) {
      return { outcome: "rejected" };
    }

    if (error instanceof EmailInviteLinkOrganizationFullError) {
      throw await redirectWithToast(
        `${href("/organizations/email-invite")}?token=${emailInviteToken}`,
        {
          description: i18n.t(
            "organizations:acceptEmailInvite.organizationFullToastDescription",
          ),
          title: i18n.t(
            "organizations:acceptEmailInvite.organizationFullToastTitle",
          ),
          type: "error",
        },
        { headers: await destroyEmailInviteInfoSession(request) },
      );
    }

    throw error;
  }
}

/**
 * Checks if the organization is full.
 *
 * @param organization - The organization to check.
 * @returns `true` if the organization is full; otherwise, `false`.
 */
export const getOrganizationIsFull = (
  organization: OrganizationWithMembershipsAndSubscriptions,
) => {
  const currentSubscription = organization.stripeSubscriptions[0];
  const currentSubscriptionIsActive =
    !!currentSubscription &&
    !["canceled", "past_due"].includes(currentSubscription.status);
  const maxSeats =
    (currentSubscriptionIsActive &&
      currentSubscription.items[0]?.price.product.maxSeats) ||
    25;
  return organization._count.memberships >= maxSeats;
};

/**
 * Retrieves the invite info from the request.
 *
 * @param request - The request to get the invite info from.
 * @returns The invite info.
 */
export async function getInviteInfoForAuthRoutes(request: Request) {
  const { emailInviteInfo, inviteLinkInfo } = await promiseHash({
    emailInviteInfo: getValidEmailInviteInfo(request),
    inviteLinkInfo: getValidInviteLinkInfo(request),
  });

  return {
    headers: combineHeaders(inviteLinkInfo.headers, emailInviteInfo.headers),
    inviteLinkInfo: emailInviteInfo.emailInviteInfo
      ? {
          creatorName: emailInviteInfo.emailInviteInfo.inviterName,
          inviteLinkId: emailInviteInfo.emailInviteInfo.emailInviteId,
          organizationName: emailInviteInfo.emailInviteInfo.organizationName,
          organizationSlug: emailInviteInfo.emailInviteInfo.organizationSlug,
          type: "emailInvite",
        }
      : inviteLinkInfo.inviteLinkInfo
        ? { ...inviteLinkInfo.inviteLinkInfo, type: "inviteLink" }
        : undefined,
  };
}

/**
 * Uploads an organization's logo to storage and returns its public URL.
 *
 * @param file - The logo file to upload
 * @param organizationId - The ID of the organization whose logo is being uploaded
 * @param supabase - The Supabase client instance
 * @returns The public URL of the uploaded logo
 */
export async function uploadOrganizationLogo({
  file,
  organizationId,
  supabase,
}: {
  file: File | FileUpload;
  organizationId: string;
  supabase: SupabaseClient;
}) {
  return uploadOwnedImage({
    file,
    kind: "organization-logo",
    ownerId: organizationId,
    supabase,
  });
}
