import { href } from "react-router";
import { useState } from "react";
import { format } from "date-fns";

import type { Route } from "./+types/dashboard";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { getPageTitle } from "~/utils/get-page-title.server";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Badge } from "~/components/ui/badge";
import {
  BellRing,
  Clock,
  ChevronLeft,
  ChevronRight,
  Target,
  BarChart3,
  Plus,
} from "lucide-react";

export function loader({ params, context }: Route.LoaderArgs) {
  const i18n = getInstance(context);
  const t = i18n.t.bind(i18n);

  // Dummy data - in production, this would come from database
  const urgentUpdates = [
    {
      title: "Offer Pending for Sarah Miller",
      description:
        "Awaiting offer acceptance for the Senior Product Manager role. Deadline: EOD.",
      priority: "High" as const,
    },
  ];

  const agendaItems = [
    {
      id: 1,
      text: "Review AI Candidate Profiles for Senior Software Engineer Role",
      checked: false,
    },
    {
      id: 2,
      text: "Schedule interview with candidate 'Alex Johnson'",
      checked: false,
    },
  ];

  const calendarEvents = [
    {
      title: "AI Candidate Screening",
      start: 9,
      end: 10,
      displayStart: "09:00 AM",
      displayEnd: "10:00 AM",
    },
    {
      title: "Team Sync: Q4 Agentic Features",
      start: 10.5,
      end: 11.5,
      displayStart: "10:30 AM",
      displayEnd: "11:30 AM",
    },
  ];

  const calendarConfig = {
    startHour: 9,
    endHour: 17, // 5 PM
  };

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
    calendarEvents,
    calendarConfig,
  } = loaderData;

  const [currentDate, setCurrentDate] = useState(new Date("2025-10-26"));
  const [agendaItems, setAgendaItems] = useState(initialAgendaItems);
  const [localCalendarEvents, setLocalCalendarEvents] = useState(calendarEvents);

  const { startHour, endHour } = calendarConfig;
  const timeSlots = Array.from(
    { length: endHour - startHour + 1 },
    (_, i) => startHour + i,
  );

  const formatTimeSlot = (hour: number) => {
    if (hour === 0) return "12 AM";
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return "12 PM";
    return `${hour - 12} PM`;
  };

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
        {/* Urgent Funnel Updates */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              Urgent Funnel Updates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {urgentUpdates.map((update, index) => (
              <div key={index} className="bg-white/50 rounded-lg p-4 border">
                <div className="flex flex-col gap-2 relative">
                  <BellRing className="size-6 absolute top-0 left-0" />
                  <h3 className="text-lg font-bold pl-8">{update.title}</h3>
                  <p className="text-sm text-muted">{update.description}</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge className="bg-foreground/80 text-background rounded-full px-4 py-1">
                    {update.priority}
                  </Badge>
                  <Button variant="outline" size="sm">
                    Send Reminder
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Daily Agenda */}
        <Card className="bg-muted/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="size-5" />
              <CardTitle className="text-xl font-bold">
                Daily Agenda
              </CardTitle>
            </div>
            <CardAction>
              <Button
                variant="ghost"
                size="icon"
                onClick={addAgendaItem}
                className="h-8 w-8"
                aria-label="Add agenda item"
              >
                <Plus className="size-4" />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-3">
            {agendaItems.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <Checkbox
                  checked={item.checked}
                  onCheckedChange={() => toggleAgendaItem(item.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 flex items-center gap-2">
                  <span
                    className={
                      item.checked
                        ? "text-sm line-through text-muted-foreground"
                        : "text-sm"
                    }
                  >
                    {item.text}
                  </span>
                  <Clock className="size-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Calendar View */}
      <Card className="bg-muted/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateDate("prev")}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <CardTitle className="text-lg font-semibold">
                {format(currentDate, "EEEE, MMMM d")}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateDate("next")}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={addCalendarEvent}
                className="h-8 w-8"
                aria-label="Add calendar event"
              >
                <Plus className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="bg-foreground/80 text-background"
              >
                Today
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative border rounded-lg overflow-hidden">
            <div className="max-h-[600px] overflow-y-auto">
              <div className="grid grid-cols-[80px_1fr]">
                {/* Time slots */}
                <div className="border-r">
                  {timeSlots.map((hour) => (
                    <div
                      key={hour}
                      className="h-16 border-b flex items-start justify-end pr-2 pt-1 text-xs text-muted-foreground"
                    >
                      {formatTimeSlot(hour)}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="relative">
                  {timeSlots.map((hour) => (
                    <div
                      key={hour}
                      className="h-16 border-b border-l"
                    />
                  ))}

                  {/* Calendar events */}
                  {localCalendarEvents.map((event, index) => {
                    const totalHours = endHour - startHour + 1;
                    const top = ((event.start - startHour) / totalHours) * 100;
                    const height =
                      ((event.end - event.start) / totalHours) * 100;
                    return (
                      <div
                        key={index}
                        className="absolute left-0 right-0 bg-primary/10 border-l-4 border-primary rounded p-2"
                        style={{
                          top: `${top}%`,
                          height: `${height}%`,
                        }}
                      >
                        <div className="text-sm font-semibold">{event.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {event.displayStart} - {event.displayEnd}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Section: Metrics Icons */}
      <div className="grid grid-cols-min md:grid-cols-2 gap-4">
        <Card className="bg-muted/50 border-2 border-dashed">
          <CardContent className="flex items-center justify-center p-12">
            <Target className="size-24 text-muted-foreground/50" />
          </CardContent>
        </Card>
        <Card className="bg-muted/50 border-2 border-dashed">
          <CardContent className="flex items-center justify-center p-12">
            <BarChart3 className="size-24 text-muted-foreground/50" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
