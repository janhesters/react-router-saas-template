import { href } from "react-router";

import type { Route } from "./+types/jobs-and-clients";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { UpcomingInterview } from "~/features/organizations/jobs-and-clients/upcoming-interview";
import { getPageTitle } from "~/utils/get-page-title.server";

export function loader({ params, context }: Route.LoaderArgs) {
  const i18n = getInstance(context);
  const t = i18n.t.bind(i18n);

  return {
    breadcrump: {
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
  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-4 md:py-6 lg:px-6">
      <div className="grid grid-cols-6 grid-rows-[175px_1fr] gap-5 h-[500px]">
        <UpcomingInterview />

        <div className="col-span-2 row-span-2 bg-surface squircle-rounded-3xl h-full p-6">
          <p className="text-lg font-medium">Daily Agenda</p>
        </div>

        <div className="col-span-4 row-span-1 grid grid-cols-3 gap-5">
          <div className="bg-surface h-full squircle-rounded-3xl p-6">
            <p className="font-medium">Client Snapshot</p>
          </div>
          <div className="bg-surface h-full squircle-rounded-3xl p-6">
            <p className="font-medium">Current Vacancies</p>
          </div>
          <div className="bg-surface h-full squircle-rounded-3xl p-6">
            <p className="font-medium">Candidate Sources</p>
          </div>
        </div>
      </div>
    </div>
  );
}
