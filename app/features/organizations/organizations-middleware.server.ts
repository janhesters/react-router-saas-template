import type { OrganizationMembershipRole } from "@prisma/client";
import type { MiddlewareFunction } from "react-router";
import { createContext } from "react-router";

import type { OnboardingUser } from "../onboarding/onboarding-helpers.server";
import { requireUserIsMemberOfOrganization } from "./organizations-helpers.server";

export const organizationMembershipContext = createContext<{
  headers: Headers;
  organization: OnboardingUser["memberships"][number]["organization"];
  role: OrganizationMembershipRole;
  user: OnboardingUser;
}>();

export const organizationMembershipMiddleware: MiddlewareFunction = async (
  { request, params, context },
  next,
) => {
  const organizationSlug = params.organizationSlug;

  if (!organizationSlug) {
    throw new Error(
      "organizationMembershipMiddleware: organizationSlug parameter is required. " +
        "This middleware must only be applied to routes with an $organizationSlug parameter.",
    );
  }

  const { user, organization, role, headers } =
    await requireUserIsMemberOfOrganization({
      context,
      organizationSlug,
      request,
    });

  context.set(organizationMembershipContext, {
    headers,
    organization,
    role,
    user,
  });

  return await next();
};
