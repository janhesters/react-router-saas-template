import { href } from "react-router";
import { useState } from "react";

import type { Route } from "./+types/dashboard";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { getPageTitle } from "~/utils/get-page-title.server";
import { getUrgentFunnelUpdatesData } from "~/features/dashboard/urgent-funnel-updates/data";
import { getDailyAgendaData } from "~/features/dashboard/daily-agenda/data";
import {
  getCalendarEventsData,
  getCalendarConfigData,
} from "~/features/dashboard/calendar/data";
import { UrgentFunnelUpdates } from "~/features/dashboard/urgent-funnel-updates/urgent-funnel-updates";
import { DailyAgenda } from "~/features/dashboard/daily-agenda/daily-agenda";
import { Calendar } from "~/features/dashboard/calendar/calendar";
import { Metrics } from "~/features/dashboard/metrics/metrics";

export function loader({ params, context }: Route.LoaderArgs) {
  const i18n = getInstance(context);
  const t = i18n.t.bind(i18n);

  const urgentUpdates = getUrgentFunnelUpdatesData();
  const agendaItems = getDailyAgendaData();
  const calendarEvents = getCalendarEventsData();
  const calendarConfig = getCalendarConfigData();

  return {
    breadcrumb: {
      title: t("organizations:dashboard.breadcrumb"),
      to: href("/organizations/:organizationSlug/dashboard", {
        organizationSlug: params.organizationSlug,
      }),
    },
    pageTitle: getPageTitle(t, "organizations:dashboard.pageTitle"),
    urgentUpdates,
    agendaItems,
    calendarEvents,
    calendarConfig,
  };
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
];

export default function OrganizationDashboardRoute({
  loaderData,
}: Route.ComponentProps) {
  const {
    urgentUpdates,
    agendaItems: initialAgendaItems,
    calendarEvents: initialCalendarEvents,
    calendarConfig,
  } = loaderData;

  const [currentDate, setCurrentDate] = useState(new Date("2025-10-26"));
  const [agendaItems, setAgendaItems] = useState(initialAgendaItems);
  const [localCalendarEvents, setLocalCalendarEvents] = useState(
    initialCalendarEvents,
  );

  const toggleAgendaItem = (id: number) => {
    setAgendaItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    );
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const addAgendaItem = () => {
    const newId = Math.max(...agendaItems.map((item) => item.id), 0) + 1;
    setAgendaItems([
      ...agendaItems,
      {
        id: newId,
        text: "New agenda item",
        checked: false,
      },
    ]);
  };

  const addCalendarEvent = () => {
    const newEvent = {
      title: "New Event",
      start: 14, // 2 PM
      end: 15, // 3 PM
      displayStart: "02:00 PM",
      displayEnd: "03:00 PM",
    };
    setLocalCalendarEvents([...localCalendarEvents, newEvent]);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-4 md:py-6 lg:px-6">
      {/* Top Row: Urgent Funnel Updates and Daily Agenda */}
      <div className="grid auto-rows-min gap-4 md:grid-cols-2">
        <UrgentFunnelUpdates updates={urgentUpdates} />
        <DailyAgenda
          agendaItems={agendaItems}
          onToggleItem={toggleAgendaItem}
          onAddItem={addAgendaItem}
        />
      </div>

      {/* Calendar View */}
      <Calendar
        currentDate={currentDate}
        calendarEvents={localCalendarEvents}
        calendarConfig={calendarConfig}
        onNavigateDate={navigateDate}
        onGoToToday={goToToday}
        onAddEvent={addCalendarEvent}
      />

      {/* Bottom Section: Metrics */}
      <Metrics />
    </div>
  );
}
