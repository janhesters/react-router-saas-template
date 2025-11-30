import { useTranslation } from "react-i18next";
import { data, href } from "react-router";

import type { Route } from "./+types/general";
import { GeneralErrorBoundary } from "~/components/general-error-boundary";
import { Separator } from "~/components/ui/separator";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { organizationMembershipContext } from "~/features/organizations/organizations-middleware.server";
import { DangerZone } from "~/features/organizations/settings/general/danger-zone";
import { GeneralOrganizationSettings } from "~/features/organizations/settings/general/general-organization-settings";
import { generalOrganizationSettingsAction } from "~/features/organizations/settings/general/general-organization-settings-action.server";
import { OrganizationInfo } from "~/features/organizations/settings/general/organization-info";
import { OrganizationMembershipRole } from "~/generated/browser";
import { getPageTitle } from "~/utils/get-page-title.server";

export function loader({ context, params }: Route.LoaderArgs) {
  const { headers, organization, role } = context.get(
    organizationMembershipContext,
  );
  const i18n = getInstance(context);
  const t = i18n.t.bind(i18n);

  const userIsOwner = role === OrganizationMembershipRole.owner;

  return data(
    {
      breadcrumb: {
        title: t("organizations:settings.general.breadcrumb"),
        to: href("/organizations/:organizationSlug/settings/general", {
          organizationSlug: params.organizationSlug,
        }),
      },
      organization,
      pageTitle: getPageTitle(t, "organizations:settings.general.pageTitle"),
      userIsOwner,
    },
    { headers },
  );
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
];

export async function action(args: Route.ActionArgs) {
  return await generalOrganizationSettingsAction(args);
}

export default function GeneralOrganizationSettingsRoute({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  const { t } = useTranslation("organizations", {
    keyPrefix: "settings.general",
  });
  const { userIsOwner, organization } = loaderData;

  return (
    <div className="px-4 py-4 md:py-6 lg:px-6">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        {userIsOwner ? (
          <>
            <GeneralOrganizationSettings
              lastResult={actionData?.result}
              organization={loaderData?.organization}
            />

            <Separator />

            <DangerZone organizationName={organization.name} />
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <h2 className="leading-none font-semibold">{t("pageTitle")}</h2>

              <p className="text-muted-foreground text-sm">
                {t("description")}
              </p>
            </div>

            <Separator />

            <OrganizationInfo
              organizationLogoUrl={organization.imageUrl}
              organizationName={organization.name}
            />
          </>
        )}
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}
