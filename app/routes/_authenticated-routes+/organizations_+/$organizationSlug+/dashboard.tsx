import {
  BellRingIcon,
  BotIcon,
  CalendarCheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  ClockPlusIcon,
  GoalIcon,
  NotepadTextIcon,
  SendHorizonalIcon,
  SendToBackIcon,
  TrendingUpIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { href, useLoaderData } from "react-router";

import type { Route } from "./+types/dashboard";
import { Button } from "~/components/ui/button";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { getPageTitle } from "~/utils/get-page-title.server";

export function loader({ params, context }: Route.LoaderArgs) {
  const i18n = getInstance(context);
  const t = i18n.t.bind(i18n);

  const events: CalendarEvent[] = [
    {
      date: "2025-11-29",
      endHour: 11,
      id: 1,
      startHour: 8,
      title: "AI Candidate Screening",
    },
    {
      date: "2025-11-28",
      endHour: 11,
      id: 2,
      startHour: 10,
      title: "Team Sync: Q4 Agentic Features",
    },
  ];

  return {
    breadcrump: {
      title: t("organizations:dashboard.breadcrumb"),
      to: href("/organizations/:organizationSlug/dashboard", {
        organizationSlug: params.organizationSlug,
      }),
    },
    events,
    pageTitle: getPageTitle(t, "organizations:dashboard.pageTitle"),
  };
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
];

type CalendarEvent = {
  id: number;
  date: string;
  title: string;
  startHour: number;
  endHour: number;
};

const CALENDAR_HOURS = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  22, 23,
];

function formatHour(hour: number) {
  const period = hour >= 12 ? "PM" : "AM";
  const h12 = ((hour + 11) % 12) + 1;
  return `${h12} ${period}`;
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    weekday: "long",
  });
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getEventTimeColorClass(event: CalendarEvent, now: Date) {
  const padHour = (h: number) => h.toString().padStart(2, "0");
  const eventStart = new Date(
    `${event.date}T${padHour(event.startHour)}:00:00`,
  );
  const eventEnd = new Date(`${event.date}T${padHour(event.endHour)}:00:00`);

  if (eventEnd < now) {
    // Past event - red
    return "bg-red-100 border-red-500 text-red-700 dark:bg-red-900/40 dark:border-red-400 dark:text-red-300";
  }

  if (eventStart > now) {
    // Future event - blue
    return "bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900/40 dark:border-blue-400 dark:text-blue-300";
  }

  // Current/ongoing event default styling
  return "bg-indigo-50 dark:bg-indigo-900/40 border-l-4 border-indigo-400 text-indigo-700 dark:text-indigo-300";
}

export default function OrganizationDashboardRoute() {
  const loaderData = useLoaderData<typeof loader>();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedItem, setSelectedItem] = useState<
    | { type: "event"; event: CalendarEvent }
    | { type: "slot"; hour: number }
    | null
  >(null);
  const now = new Date();

  const selectedDateKey = useMemo(
    () => toDateKey(selectedDate),
    [selectedDate],
  );

  const eventsForDay = useMemo(
    () => loaderData.events.filter((e) => e.date === selectedDateKey),
    [loaderData.events, selectedDateKey],
  );

  const handlePrevDay = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });
    setSelectedItem(null);
  };

  const handleNextDay = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      return d;
    });
    setSelectedItem(null);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
    setSelectedItem(null);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-4 md:py-6 lg:px-6">
      <div className="flex-1 overflow-y-auto p-6 grid grid-cols-3 gap-6">
        <div className="col-span-3 lg:col-span-2 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                Urgent Funnel Updates
              </h2>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-md border border-slate-200 dark:border-slate-700">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-xl mt-1 text-purple-600 dark:text-purple-300">
                    <BellRingIcon />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      Offer Pending for Sarah Miller
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Awaiting offer acceptance for the Senior Product Manager
                      role. Deadline: EOD.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold uppercase bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 px-2 py-1 rounded-full">
                        High
                      </span>
                      <Button
                        className="text-sm font-medium text-purple-600 dark:text-purple-300 cursor-pointer hover:underline min-w-0"
                        variant="ghost"
                      >
                        <span className="truncate max-w-full overflow-hidden text-ellipsis">
                          Send Reminder
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  Daily Agenda - {formatDateLabel(selectedDate)}
                </h2>
                <span className="material-symbols-outlined text-lg">
                  <ClockPlusIcon />
                </span>
              </div>
              {eventsForDay.length === 0 ? (
                <div className="rounded-md border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                  No events scheduled for this day.
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto pr-1">
                  <ul className="space-y-3">
                    {eventsForDay.map((event) => (
                      <li className="flex items-center gap-3" key={event.id}>
                        <input
                          className="h-5 w-5 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary bg-slate-100 dark:bg-slate-800"
                          type="checkbox"
                        />
                        <div className="flex-1 min-w-0 text-sm">
                          <p className="font-medium text-slate-800 dark:text-slate-100 truncate">
                            {event.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {formatHour(event.startHour)} -{" "}
                            {formatHour(event.endHour)}
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-lg text-slate-400">
                          <ClockIcon />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 grow flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <Button
                  className="text-slate-500 cursor-pointer dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  onClick={handlePrevDay}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <span className="material-symbols-outlined">
                    <ChevronLeftIcon />
                  </span>
                </Button>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {formatDateLabel(selectedDate)}
                </h3>
                <Button
                  className="text-slate-500 cursor-pointer dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  onClick={handleNextDay}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <span className="material-symbols-outlined">
                    <ChevronRightIcon />
                  </span>
                </Button>
              </div>
              <Button
                className="text-sm cursor-pointer font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                onClick={handleToday}
                type="button"
              >
                <span className="truncate max-w-full overflow-hidden text-ellipsis">
                  Today
                </span>
              </Button>
            </div>
            <div className="grow relative min-h-[320px] sm:min-h-[380px] lg:min-h-[150px]">
              <div className="absolute inset-0 overflow-y-auto text-xs text-slate-400">
                <div
                  className="relative"
                  style={{ minHeight: `${CALENDAR_HOURS.length * 3}rem` }}
                >
                  {/* Hour rows with clickable slots */}
                  <div className="flex flex-col">
                    {CALENDAR_HOURS.map((hour) => {
                      const isSelectedSlot =
                        selectedItem?.type === "slot" &&
                        selectedItem.hour === hour;

                      const hasEventsInSlot = eventsForDay.some(
                        (event) =>
                          event.startHour <= hour && hour < event.endHour,
                      );

                      const slotColorClass = isSelectedSlot
                        ? "bg-slate-100 dark:bg-slate-800"
                        : hasEventsInSlot
                          ? "hover:bg-slate-50 dark:hover:bg-slate-900/40"
                          : "";

                      return (
                        <div
                          className="flex border-b border-slate-100 dark:border-slate-800 last:border-b-0"
                          key={hour}
                          style={{ height: "3rem" }}
                        >
                          <div className="w-16 shrink-0 flex items-start -mt-1 pt-3 pl-0.5">
                            <p>{formatHour(hour)}</p>
                          </div>
                          <Button
                            className={`flex-1 h-full px-4 flex items-center text-left transition-colors ${slotColorClass}`}
                            onClick={() => {
                              if (
                                selectedItem?.type === "slot" &&
                                selectedItem.hour === hour
                              ) {
                                setSelectedItem(null);
                              } else {
                                setSelectedItem({ hour, type: "slot" });
                              }
                            }}
                            type="button"
                            variant="ghost"
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Events overlay */}
                  <div className="pointer-events-none absolute inset-0 flex">
                    <div className="w-16 shrink-0" />
                    <div className="flex-1 relative">
                      {eventsForDay.map((event) => {
                        const startIndex = CALENDAR_HOURS.indexOf(
                          event.startHour,
                        );
                        const endIndex = CALENDAR_HOURS.indexOf(event.endHour);

                        if (
                          startIndex === -1 ||
                          endIndex === -1 ||
                          endIndex <= startIndex
                        ) {
                          return null;
                        }

                        const top = startIndex * 3;
                        const height = (endIndex - startIndex) * 3;

                        const isSelectedEvent =
                          selectedItem?.type === "event" &&
                          selectedItem.event.id === event.id;

                        const timeColorClass = getEventTimeColorClass(
                          event,
                          now,
                        );

                        return (
                          <div
                            className="pointer-events-auto"
                            key={event.id}
                            style={{
                              height: `${height}rem`,
                              left: "0.5rem",
                              position: "absolute",
                              right: "0.5rem",
                              top: `${top}rem`,
                            }}
                          >
                            <Button
                              className={`h-full w-full rounded-r-md rounded-l-none flex flex-col justify-start items-start border-l-4 p-2 text-xs cursor-pointer  ${
                                timeColorClass
                              } ${
                                isSelectedEvent
                                  ? "ring-2 ring-offset-1 ring-primary/60 dark:ring-primary/80"
                                  : ""
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isSelectedEvent) {
                                  setSelectedItem(null);
                                } else {
                                  setSelectedItem({ event, type: "event" });
                                }
                              }}
                              type="button"
                              variant="ghost"
                            >
                              <p className="font-semibold truncate table">
                                {event.title}
                              </p>
                              <p className="opacity-80 -mt-1.5">
                                {`${formatHour(event.startHour)} - ${formatHour(
                                  event.endHour,
                                )}`}
                              </p>
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {selectedItem && (
              <div className="mt-4 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-3 text-xs text-slate-600 dark:text-slate-300">
                {selectedItem.type === "slot" && (
                  <p>
                    Selected slot:{" "}
                    <span className="font-semibold">
                      {formatHour(selectedItem.hour)}
                    </span>
                  </p>
                )}
                {selectedItem.type === "event" && (
                  <div>
                    <p className="font-semibold mb-1">
                      {selectedItem.event.title}
                    </p>
                    <p>
                      Time: {formatHour(selectedItem.event.startHour)} -{" "}
                      {formatHour(selectedItem.event.endHour)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center min-h-[180px]">
              <div className="w-20 h-20 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full mb-4 cursor-pointer">
                <span className="material-symbols-outlined text-4xl text-slate-500 dark:text-slate-400">
                  <GoalIcon />
                </span>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center min-h-[180px]">
              <div className="w-20 h-20 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full mb-4 cursor-pointer">
                <span className="material-symbols-outlined text-4xl text-slate-500 dark:text-slate-400">
                  <TrendingUpIcon />
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="col-span-3 lg:col-span-1 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              AI Assistant
            </h2>
          </div>
          <div className="grow p-6 overflow-y-auto flex flex-col gap-4 text-sm">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-purple-600 dark:bg-purple-500">
                <span className="material-symbols-outlined text-lg text-white">
                  <BotIcon />
                </span>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg rounded-tl-none">
                <p>Hello! I'm your AI Assistant. How can I help you today?</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <div className="bg-purple-600 dark:bg-purple-500 text-white p-3 rounded-lg rounded-br-none">
                <p>Show me candidates for the Senior Software Engineer role.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-purple-600 dark:bg-purple-500">
                <span className="material-symbols-outlined text-lg text-white">
                  <BotIcon />
                </span>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg rounded-tl-none">
                <p>
                  I've filtered the pipeline for Senior Software Engineer
                  candidates. Alice Johnson is currently in the 'Applied' stage.
                  Would you like me to summarize her profile?
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 border-t border-slate-200 dark:border-slate-800">
            <div className="relative">
              <input
                className="w-full pr-12 pl-4 py-3 rounded-md bg-slate-100 dark:bg-slate-800 border-transparent focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                placeholder="Ask me anything..."
                type="text"
              />
              <Button
                className="absolute right-1 top-1/2 -translate-y-1/2 bg-slate-700 dark:bg-slate-600 text-white rounded-md h-9 w-9 flex items-center justify-center hover:bg-slate-800 dark:hover:bg-slate-500 transition-colors"
                size="icon"
                variant="ghost"
              >
                <span className="material-symbols-outlined text-lg">
                  <SendHorizonalIcon />
                </span>
              </Button>
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Contextual Actions:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  className="flex items-center justify-start gap-2.5 text-sm p-2 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  variant="ghost"
                >
                  <span className="material-symbols-outlined text-base">
                    <CalendarCheckIcon />
                  </span>
                  <span className="truncate max-w-full overflow-hidden text-ellipsis">
                    Schedule Interview
                  </span>
                </Button>
                <Button
                  className="flex items-center justify-start gap-2.5 text-sm p-2 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  variant="ghost"
                >
                  <span className="material-symbols-outlined text-base">
                    <NotepadTextIcon />
                  </span>
                  <span className="truncate max-w-full overflow-hidden text-ellipsis">
                    Summarize
                  </span>
                </Button>
                <Button
                  className="flex items-center justify-start gap-2.5 text-sm p-2 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  variant="ghost"
                >
                  <span className="material-symbols-outlined text-base">
                    <SendHorizonalIcon />
                  </span>
                  <span className="truncate max-w-full overflow-hidden text-ellipsis">
                    Send To Marketplace
                  </span>
                </Button>
                <Button
                  className="flex items-center justify-start gap-2.5 text-sm p-2 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  variant="ghost"
                >
                  <span className="material-symbols-outlined text-base">
                    <SendToBackIcon />
                  </span>
                  <span className="truncate max-w-full overflow-hidden text-ellipsis">
                    Move to Next Stage
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
