import type { ShouldRevalidateFunctionArgs, UIMatch } from "react-router";
import { data, href, Outlet, redirect } from "react-router";
import { promiseHash } from "remix-utils/promise";

import type { Route } from "./+types/_sidebar-layout";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { allLookupKeys } from "~/features/billing/billing-constants";
import { getCreateSubscriptionModalProps } from "~/features/billing/billing-helpers.server";
import { retrieveProductsFromDatabaseByPriceLookupKeys } from "~/features/billing/stripe-product-model.server";
import { mapInitialNotificationsDataToNotificationButtonProps } from "~/features/notifications/notifications-helpers.server";
import { retrieveInitialNotificationsDataForUserAndOrganizationFromDatabaseById } from "~/features/notifications/notifications-model.server";
import { AppHeader } from "~/features/organizations/layout/app-header";
import { AppSidebar } from "~/features/organizations/layout/app-sidebar";
import { findBreadcrumbs } from "~/features/organizations/layout/layout-helpers";
import {
  getSidebarState,
  mapOnboardingUserToBillingSidebarCardProps,
  mapOnboardingUserToOrganizationLayoutProps,
} from "~/features/organizations/layout/layout-helpers.server";
import { sidebarLayoutAction } from "~/features/organizations/layout/sidebar-layout-action.server";
import {
  organizationMembershipContext,
  organizationMembershipMiddleware,
} from "~/features/organizations/organizations-middleware.server";

/**
 * @see https://reactrouter.com/start/framework/route-module#shouldrevalidate
 */
export const shouldRevalidate = ({
  currentParams,
  nextParams,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) => {
  if (currentParams.organizationSlug !== nextParams.organizationSlug) {
    return true;
  }
  return defaultShouldRevalidate;
};

export const middleware = [organizationMembershipMiddleware];

export async function loader({ request, params, context }: Route.LoaderArgs) {
  if (
    params.organizationSlug &&
    request.url.endsWith(`/organizations/${params.organizationSlug}`)
  ) {
    return redirect(
      href("/organizations/:organizationSlug/dashboard", {
        organizationSlug: params.organizationSlug,
      }),
    );
  }

  const { user, organization, headers } = context.get(
    organizationMembershipContext,
  );

  const { notificationData, products } = await promiseHash({
    notificationData:
      retrieveInitialNotificationsDataForUserAndOrganizationFromDatabaseById({
        organizationId: organization.id,
        userId: user.id,
      }),
    products: retrieveProductsFromDatabaseByPriceLookupKeys(
      allLookupKeys as unknown as string[],
    ),
  });
  const defaultSidebarOpen = getSidebarState(request);

  return data(
    {
      defaultSidebarOpen,
      ...mapOnboardingUserToOrganizationLayoutProps({
        organizationSlug: params.organizationSlug,
        user,
      }),
      ...mapInitialNotificationsDataToNotificationButtonProps(notificationData),
      ...mapOnboardingUserToBillingSidebarCardProps({
        now: new Date(),
        organizationSlug: params.organizationSlug,
        user,
      }),
      ...getCreateSubscriptionModalProps(organization, products),
    },
    { headers },
  );
}

export async function action(args: Route.ActionArgs) {
  return sidebarLayoutAction(args);
}

export default function OrganizationLayoutRoute({
  loaderData,
  params,
  matches,
}: Route.ComponentProps) {
  const {
    billingSidebarCardProps,
    createSubscriptionModalProps,
    defaultSidebarOpen,
    navUserProps,
    notificationButtonProps,
    organizationSwitcherProps,
  } = loaderData;
  const breadcrumbs = findBreadcrumbs(
    matches as UIMatch<{ breadcrump?: { title: string; to: string } }>[],
  );

  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <AppSidebar
        billingSidebarCardProps={
          billingSidebarCardProps && {
            ...billingSidebarCardProps,
            createSubscriptionModalProps,
          }
        }
        navUserProps={navUserProps}
        organizationSlug={params.organizationSlug}
        organizationSwitcherProps={organizationSwitcherProps}
        variant="inset"
      />

      <SidebarInset>
        <AppHeader
          breadcrumbs={breadcrumbs}
          notificationsButtonProps={notificationButtonProps}
        />

        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
