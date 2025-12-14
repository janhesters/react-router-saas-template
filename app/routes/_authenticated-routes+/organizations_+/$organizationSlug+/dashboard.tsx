import { href } from "react-router";

import type { Route } from "./+types/dashboard";
import AgendaList from "~/features/dashboard/agenda-list";
import AIBubbleButton from "~/features/dashboard/ai-experience/ai-bubble-button";
import AIExperience from "~/features/dashboard/ai-experience/ai-experience";
import CalenderSection from "~/features/dashboard/calender-section";
import ChartStatsCard from "~/features/dashboard/charts-stats-card";
import {
  dummyAgenda,
  dummyCalanderEvents,
  dummyChartData,
  dummyFunnelUpdates,
} from "~/features/dashboard/dashboard-data/dashboardDummyData";
import FunnelUpdatesCard from "~/features/dashboard/funnel-updates-card";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { getPageTitle } from "~/utils/get-page-title.server";
export function loader({ params, context }: Route.LoaderArgs) {
  const i18n = getInstance(context);
  const t = i18n.t.bind(i18n);

  return {
    breadcrumb: {
      title: t("organizations:dashboard.breadcrumb"),
      to: href("/organizations/:organizationSlug/dashboard", {
        organizationSlug: params.organizationSlug,
      }),
    },
    pageTitle: getPageTitle(t, "organizations:dashboard.pageTitle"),
  };
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
];

export default function OrganizationDashboardRoute() {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="flex flex-1 flex-col overflow-y-auto scrollbar-hidden gap-4 p-4 md:p-6 lg:gap-6">
        <div className="grid gap-4 md:grid-cols-2 lg:gap-6">
          <div className="bg-muted/50 aspect-video rounded-none">
            <FunnelUpdatesCard item={dummyFunnelUpdates[0]} />
          </div>

          <div className="bg-muted/50 aspect-video rounded-none">
            <AgendaList date="2025.04.23" items={dummyAgenda} />
          </div>
        </div>

        <div className="bg-muted/50 flex-1 rounded-none">
          <CalenderSection
            dateLabel="Monday, October 26"
            events={dummyCalanderEvents}
          />
        </div>
        <div className="bg-muted/50 rounded-none p-6 shadow-sm">
          <ChartStatsCard data={dummyChartData} />
        </div>
      </div>

      <div className="shrink-0 h-full overflow-y-auto scrollbar-hidden border-l bg-background shadow-sm">
        <AIExperience />
      </div>
      <AIBubbleButton onClick={() => console.log("clicked")} />
    </div>
  );
}
