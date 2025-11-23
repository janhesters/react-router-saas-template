import { href } from "react-router";

import type { Route } from "./+types/jobs-and-clients";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { Agenda } from "~/features/organizations/jobs-and-clients/agenda";
import { CandidateSources } from "~/features/organizations/jobs-and-clients/candidate-sources";
import { ClientSnapshot } from "~/features/organizations/jobs-and-clients/client-snapshot";
import { CurrentVacancies } from "~/features/organizations/jobs-and-clients/current-vacancies";
import { LiveCalendar } from "~/features/organizations/jobs-and-clients/live-calendar";
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
    <div className="flex flex-1 flex-col gap-6 px-4 py-4 md:py-6 lg:px-6">
      <div className="grid grid-cols-[minmax(0,1fr)_300px] grid-rows-[175px_1fr] gap-5 h-fit">
        <UpcomingInterview />

        <Agenda />

        <div className="col-span-1 row-span-1 grid grid-cols-3 gap-5">
          <ClientSnapshot />
          <CurrentVacancies />
          <CandidateSources />
        </div>
      </div>

      <LiveCalendar />
    </div>
  );
}
