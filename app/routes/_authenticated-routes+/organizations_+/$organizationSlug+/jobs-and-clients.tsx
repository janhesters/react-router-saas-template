import { href } from "react-router";

import type { Route } from "./+types/jobs-and-clients";
import { JobsAndClientsPage } from "~/features/jobs-and-clients/jobs-and-clients-page";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { getPageTitle } from "~/utils/get-page-title.server";

export function loader({ params, context }: Route.LoaderArgs) {
  const i18n = getInstance(context);
  const t = i18n.t.bind(i18n);

  return {
    breadcrumb: {
      title: t("organizations:jobsAndClients.breadcrumb"),
      to: href("/organizations/:organizationSlug/jobs-and-clients", {
        organizationSlug: params.organizationSlug,
      }),
    },
    pageTitle: getPageTitle(t, "organizations:jobsAndClients.pageTitle"),
  };
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
];

export default function JobsAndClientsRoute() {
  return <JobsAndClientsPage />;
}
