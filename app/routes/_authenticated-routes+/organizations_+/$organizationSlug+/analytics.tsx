import { Target, TrendingUp } from "lucide-react";
import { href, useLoaderData } from "react-router";

import type { Route } from "./+types/analytics";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import AIAssistantPanel from "~/features/organizations/analytics/ai-assistant-panel";
import DailyAgenda from "~/features/organizations/analytics/daily-agenda";
import DailyScheduleGrid from "~/features/organizations/analytics/daily-schedule-grid";
import UrgentFunnelUpdates from "~/features/organizations/analytics/urgent-funnel-updates";
import { getPageTitle } from "~/utils/get-page-title.server";

/* -------------------------------------------------------------------------- */
/*                                   Loader                                   */
/* -------------------------------------------------------------------------- */

export function loader({ params, context }: Route.LoaderArgs) {
  const i18n = getInstance(context);
  const t = i18n.t.bind(i18n);

  return {
    breadcrumb: {
      title: t("organizations:analytics.breadcrumb"),
      to: href("/organizations/:organizationSlug/analytics", {
        organizationSlug: params.organizationSlug,
      }),
    },

    calendarEvents: [
      {
        endHour: 4,
        id: "screening",
        startHour: 3,
        title: "AI Candidate Screening",
      },
      {
        endHour: 5,
        id: "team-sync",
        startHour: 4,
        title: "Team Sync: Q4 Agentic Features",
      },
    ],

    dailyAgenda: [
      {
        completed: false,
        id: "screening",
        time: "09:00 – 10:00",
        title: "AI Candidate Screening",
      },
      {
        completed: false,
        id: "team-sync",
        time: "10:30 – 11:30",
        title: "Team Sync: Q4 Agentic Features",
      },
    ],

    pageTitle: getPageTitle(t, "organizations:analytics.pageTitle"),

    urgentFunnelUpdates: [
      {
        deadline: "EOD",
        description:
          "Awaiting offer acceptance for Senior Product Manager role.",
        id: "offer-pending",
        priority: "high",
        title: "Offer pending for Sarah Miller",
      },
    ],
  };
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
];

/* -------------------------------------------------------------------------- */
/*                                   Route                                    */
/* -------------------------------------------------------------------------- */

export default function AnalyticsRoute() {
  const { urgentFunnelUpdates, dailyAgenda, calendarEvents } =
    useLoaderData<typeof loader>();

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-4 md:pb-0 md:pt-0 lg:pl-6">
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 lg:col-span-2 pb-6 px-4 md:px-0">
          <div className="grid gap-6 md:grid-cols-2 pt-4">
            <UrgentFunnelUpdates updates={urgentFunnelUpdates} />

            <DailyAgenda items={dailyAgenda} />
          </div>
          <DailyScheduleGrid events={calendarEvents} />

          <div className="flex flex-col items-center lg:flex-row justify-center gap-20 lg:gap-48 bg-gray-100 min-h-[220px] py-8 px-4 md:px-8 lg:px-16">
            <Target className="h-16 w-16 md:h-20 md:w-20" />
            <TrendingUp className="h-16 w-16 md:h-20 md:w-20" />
          </div>
        </div>

        <AIAssistantPanel />
      </div>
    </div>
  );
}
