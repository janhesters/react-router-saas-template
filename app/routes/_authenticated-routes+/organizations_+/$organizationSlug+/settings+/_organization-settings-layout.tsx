import { data, href, Outlet } from "react-router";

import type { Route } from "./+types/_organization-settings-layout";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { organizationMembershipContext } from "~/features/organizations/organizations-middleware.server";
import { SettingsSidebar } from "~/features/organizations/settings/settings-sidebar";

export async function loader({ params, context }: Route.LoaderArgs) {
  const { role, headers } = context.get(organizationMembershipContext);
  const i18next = getInstance(context);
  const t = i18next.getFixedT(null, "organizations", "settings");

  return data(
    {
      breadcrumb: {
        title: t("breadcrumb"),
        to: href("/organizations/:organizationSlug/settings", {
          organizationSlug: params.organizationSlug,
        }),
      },
      pageTitle: t("meta.title"),
      role,
    },
    { headers },
  );
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData.pageTitle },
];

export default function OrganizationSettingsLayout({
  loaderData,
  params,
}: Route.ComponentProps) {
  return (
    <div className="flex flex-1 h-[calc(100vh-4rem)] overflow-hidden rounded-bl-xl group-has-data-[collapsible=icon]/sidebar-wrapper:h-[calc(100vh-3rem)]">
      <SettingsSidebar
        organizationSlug={params.organizationSlug}
        role={loaderData.role}
      />

      <div className="flex flex-1 flex-col overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
