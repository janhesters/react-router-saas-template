import { href } from "react-router";

import type { Route } from "./+types/jobs-and-clients";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { Agenda } from "~/features/organizations/jobs-and-clients/agenda";
import { CandidateSources } from "~/features/organizations/jobs-and-clients/candidate-sources";
import { ClientSnapshot } from "~/features/organizations/jobs-and-clients/client-snapshot";
import { CurrentVacancies } from "~/features/organizations/jobs-and-clients/current-vacancies";
import { LiveCalendar } from "~/features/organizations/jobs-and-clients/live-calendar";
import {
  mockCandidateSources,
  mockClients,
  mockEvents,
  mockSuggestions,
  mockTasks,
  mockUpcomingInterview,
  mockVacancies,
} from "~/features/organizations/jobs-and-clients/mock-data";
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
    candidateSources: mockCandidateSources,
    clients: mockClients,
    events: mockEvents,
    pageTitle: getPageTitle(t, "organizations:jobsAndClients.pageTitle"),
    suggestions: mockSuggestions,
    tasks: mockTasks,
    upcomingInterview: mockUpcomingInterview,
    vacancies: mockVacancies,
  };
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
];

export default function JobsAndClientsRoute({
  loaderData,
}: Route.ComponentProps) {
  const {
    candidateSources,
    clients,
    events,
    suggestions,
    tasks,
    upcomingInterview,
    vacancies,
  } = loaderData;

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-4 md:py-6 lg:px-6">
      <div className="grid h-fit grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:grid-rows-[175px_1fr]">
        <UpcomingInterview
          className="col-span-1 row-span-1 h-auto min-h-[175px] lg:h-[175px]"
          interview={upcomingInterview}
        />

        <Agenda
          className="col-span-1 row-span-1 lg:row-span-2"
          suggestions={suggestions}
          tasks={tasks}
        />

        <div className="col-span-1 row-span-1 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          <ClientSnapshot clients={clients} />
          <CurrentVacancies vacancies={vacancies} />
          <CandidateSources data={candidateSources} />
        </div>
      </div>

      <LiveCalendar events={events} />
    </div>
  );
}
