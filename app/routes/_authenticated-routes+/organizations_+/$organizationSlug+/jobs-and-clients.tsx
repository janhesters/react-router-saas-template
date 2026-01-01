import { isValid, parseISO } from "date-fns";
import { data, href } from "react-router";

import type { Route } from "./+types/jobs-and-clients";
import { SectionWrap } from "~/components/ui/card";
import { RightSidebar } from "~/components/ui/sidebar";
import { AiAssistantSidebar } from "~/features/jobs-and-clients/ai-assistant-sidebar";
import { CalendarSection } from "~/features/jobs-and-clients/calendar-section";
import { DailyAgendaSection } from "~/features/jobs-and-clients/daily-agenda-section";
import { jobsAndClientsAction } from "~/features/jobs-and-clients/jobs-and-clients-action.server";
import {
  GrowthTrendsChart,
  PerformanceMetricsChart,
} from "~/features/jobs-and-clients/jobs-and-clients-charts";
import type {
  AgendaItem,
  CalendarEvent,
  UrgentFunnelUpdate,
} from "~/features/jobs-and-clients/jobs-and-clients-constants";
import { createMockJobsAndClientsData } from "~/features/jobs-and-clients/jobs-and-clients-mock-data";
import { UrgentFunnelUpdatesSection } from "~/features/jobs-and-clients/urgent-funnel-updates-section";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { getPageTitle } from "~/utils/get-page-title.server";
import { getSearchParameterFromRequest } from "~/utils/get-search-parameter-from-request.server";

export async function loader({ params, context, request }: Route.LoaderArgs) {
  const i18n = getInstance(context);
  const t = i18n.t.bind(i18n);

  // Get calendar_date from query parameter, default to today if not provided
  const calendarDateParam =
    getSearchParameterFromRequest("calendar_date")(request);
  const today = new Date();
  let calendarDate = today;

  if (calendarDateParam) {
    const parsedDate = parseISO(calendarDateParam);
    if (isValid(parsedDate)) {
      calendarDate = parsedDate;
    }
  }

  // Generate mock data
  // dailyAgenda always uses today's date, calendarEvents uses the calendarDate
  const jobsAndClientsData = createMockJobsAndClientsData(calendarDate);

  return data({
    breadcrumb: {
      title: t("organizations:jobsAndClients.breadcrumb"),
      to: href("/organizations/:organizationSlug/jobs-and-clients", {
        organizationSlug: params.organizationSlug,
      }),
    },
    calendarDate: calendarDate.toISOString(),
    calendarEvents: jobsAndClientsData.calendarEvents,
    chatMessages: jobsAndClientsData.chatMessages,
    contextualActions: jobsAndClientsData.contextualActions,
    dailyAgenda: jobsAndClientsData.dailyAgenda,
    growthTrends: jobsAndClientsData.growthTrends,
    pageTitle: getPageTitle(t, "organizations:jobsAndClients.pageTitle"),
    performanceMetrics: jobsAndClientsData.performanceMetrics,
    today,
    // Include all the data needed by the component
    urgentFunnelUpdates: jobsAndClientsData.urgentFunnelUpdates,
  });
}

export async function action(args: Route.ActionArgs) {
  return await jobsAndClientsAction(args);
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
];

export default function JobsAndClientsRoute({
  loaderData,
  params,
  actionData,
}: Route.ComponentProps) {
  // Get data from loader
  const {
    urgentFunnelUpdates: loaderUpdates,
    dailyAgenda: loaderAgenda,
    calendarEvents: loaderEvents,
    performanceMetrics,
    growthTrends,
    chatMessages,
    contextualActions,
    calendarDate,
    today,
  } = loaderData;

  // Helper functions to safely extract action data
  const getUrgentFunnelUpdates = (): UrgentFunnelUpdate[] => {
    if (!actionData) return loaderUpdates;
    if ("urgentFunnelUpdates" in actionData) {
      return actionData.urgentFunnelUpdates;
    }
    return loaderUpdates;
  };

  const getDailyAgenda = (): AgendaItem[] => {
    if (!actionData) return loaderAgenda;
    if ("dailyAgenda" in actionData) {
      return actionData.dailyAgenda;
    }
    return loaderAgenda;
  };

  const getCalendarEvents = (): CalendarEvent[] => {
    if (!actionData) return loaderEvents;
    if ("calendarEvents" in actionData) {
      return actionData.calendarEvents;
    }
    return loaderEvents;
  };

  const urgentFunnelUpdates = getUrgentFunnelUpdates();
  const dailyAgenda = getDailyAgenda();
  const calendarEvents = getCalendarEvents();

  // Parse calendar date from loader
  const currentDate = new Date(calendarDate);

  // Handle contextual action
  const handleContextualAction = (action: string): void => {
    // TODO: Implement actual action handlers
    console.log("Contextual action:", action);
  };

  return (
    <section className="flex-1 grid grid-cols-1 xl:grid-cols-[1fr_auto] items-stretch gap-4 px-4 py-4 md:py-6 lg:px-6">
      {/* Main Section */}
      <section className="flex-1 grid gap-4">
        {/* Top Section: Urgent Funnel Updates and Daily Agenda */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Urgent Funnel Updates */}
          <UrgentFunnelUpdatesSection
            actionData={actionData}
            urgentFunnelUpdates={urgentFunnelUpdates}
          />

          {/* Daily Agenda */}
          <DailyAgendaSection
            actionData={actionData}
            agendaDate={today}
            dailyAgenda={dailyAgenda}
          />
        </div>

        {/* Calendar Section */}
        <CalendarSection
          actionData={actionData}
          currentDate={currentDate}
          events={calendarEvents}
          organizationSlug={params.organizationSlug}
        />

        {/* Charts Section */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Performance Metrics Chart */}
          <SectionWrap
            heading="Performance Metrics"
            subtitle="Target achievement overview"
          >
            <div className="h-64 min-h-20 w-full">
              {performanceMetrics.length > 0 ? (
                <PerformanceMetricsChart metrics={performanceMetrics} />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    No metrics available
                  </p>
                </div>
              )}
            </div>
          </SectionWrap>

          {/* Growth Trends Chart */}
          <SectionWrap
            heading="Growth Trends"
            subtitle="Monthly performance comparison"
          >
            <div className="h-64 min-h-20 w-full">
              {growthTrends.length > 0 ? (
                <GrowthTrendsChart trends={growthTrends} />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    No trends available
                  </p>
                </div>
              )}
            </div>
          </SectionWrap>
        </div>
      </section>

      {/* AI Assistant Sidebar */}
      <RightSidebar className="sticky top-4 h-[calc(100vh-2rem)] w-80!">
        <AiAssistantSidebar
          contextualActions={contextualActions}
          initialMessages={chatMessages}
          onContextualAction={handleContextualAction}
        />
      </RightSidebar>
    </section>
  );
}
