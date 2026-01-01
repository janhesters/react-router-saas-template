/**
 * Calendar Section Component
 *
 * Displays a day view calendar with hourly slots and events
 */

import { format, isValid, parseISO } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { href, useNavigate, useSearchParams } from "react-router";

import { AddEditEventModal, ViewEventModal } from "./event-modals";
import { CalendarEventItem } from "./jobs-and-clients-components";
import type { CalendarEvent } from "./jobs-and-clients-constants";
import {
  addDays,
  formatCalendarDate,
  formatHourIndex,
  getEventsByHour,
  isToday,
  subtractDays,
} from "./jobs-and-clients-helpers";
import type { Route } from ".react-router/types/app/routes/_authenticated-routes+/organizations_+/$organizationSlug+/+types/jobs-and-clients";
import { Button } from "~/components/ui/button";
import { SectionWrap } from "~/components/ui/card";

export type CalendarSectionProps = {
  events: CalendarEvent[];
  currentDate: Date;
  organizationSlug: string;
  actionData?: Route.ComponentProps["actionData"] | null;
};

/**
 * Loads events for a specific date by navigating with calendar_date query parameter.
 * If the date is today, clears the query parameter.
 */
export function loadEventsForDate(
  date: Date,
  organizationSlug: string,
  navigate: (to: string) => void,
) {
  const url = href("/organizations/:organizationSlug/jobs-and-clients", {
    organizationSlug,
  });

  // If the date is today, navigate without the query parameter
  if (isToday(date)) {
    navigate(url);
  } else {
    const dateString = format(date, "yyyy-MM-dd"); // Format as YYYY-MM-DD
    navigate(`${url}?calendar_date=${dateString}`);
  }
}

export function CalendarSection({
  events,
  currentDate,
  organizationSlug,
  actionData,
}: CalendarSectionProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Modal state
  const [viewEventModalOpen, setViewEventModalOpen] = useState(false);
  const [addEditEventModalOpen, setAddEditEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );

  // Get the current date from URL or use prop
  const calendarDateParam = searchParams.get("calendar_date");
  let validDate = currentDate;

  if (calendarDateParam) {
    const parsedDate = parseISO(calendarDateParam);
    if (isValid(parsedDate)) {
      validDate = parsedDate;
    }
  }

  // Navigation handlers
  const goToPreviousDay = () => {
    const previousDate = subtractDays(validDate, 1);
    loadEventsForDate(previousDate, organizationSlug, navigate);
  };

  const goToNextDay = () => {
    const nextDate = addDays(validDate, 1);
    loadEventsForDate(nextDate, organizationSlug, navigate);
  };

  const goToToday = () => {
    loadEventsForDate(new Date(), organizationSlug, navigate);
  };

  const isCurrentDateToday = isToday(validDate);

  // Event handlers
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setViewEventModalOpen(true);
  };

  const handleAddEvent = () => {
    setSelectedEvent(null);
    setAddEditEventModalOpen(true);
  };

  const handleEditEvent = () => {
    setViewEventModalOpen(false);
    setAddEditEventModalOpen(true);
  };

  // Get events for current date
  const eventsByHour = getEventsByHour(events, validDate);

  return (
    <SectionWrap
      contentClassName="max-h-[400px] overflow-auto"
      heading={
        <div className="flex items-center gap-2">
          <Button onClick={goToPreviousDay} size="sm" variant="ghost">
            <ChevronLeftIcon className="size-4" />
          </Button>
          <span>{formatCalendarDate(validDate)}</span>
          <Button onClick={goToNextDay} size="sm" variant="ghost">
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      }
      headingExtra={
        <div className="flex items-center gap-2">
          <Button onClick={handleAddEvent} size="sm" variant="default">
            <PlusIcon className="size-4" />
            Add Event
          </Button>
          <Button
            disabled={isCurrentDateToday}
            onClick={goToToday}
            size="sm"
            variant="secondary"
          >
            Today
          </Button>
        </div>
      }
      stackHeadingChildren
    >
      <div className="space-y-2">
        {Array.from({ length: 24 }, (_, hour) => hour).map((hour) => {
          const hourEvents = eventsByHour.get(hour) || [];
          return (
            <div
              className="flex items-center gap-4 border-b py-2 last:border-b-0"
              key={`hour-${hour}`}
            >
              <div className="w-20 text-xs text-muted-foreground">
                {formatHourIndex(hour)}
              </div>
              <div className="flex-1 space-y-2">
                {hourEvents.map((event) => (
                  <CalendarEventItem
                    event={event}
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* View Event Modal */}
      <ViewEventModal
        event={selectedEvent}
        onEdit={handleEditEvent}
        onOpenChange={setViewEventModalOpen}
        open={viewEventModalOpen}
      />

      {/* Add/Edit Event Modal */}
      <AddEditEventModal
        actionData={actionData}
        defaultDate={validDate}
        event={selectedEvent}
        onOpenChange={setAddEditEventModalOpen}
        open={addEditEventModalOpen}
      />
    </SectionWrap>
  );
}
