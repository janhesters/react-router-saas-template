import { format, getDay, parse, startOfWeek } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";

import { CalendarEventComponent } from "./components/calendar-event";
import { CalendarToolbar } from "./components/calendar-toolbar";
import { useCalendarData } from "./hooks/use-calendar-data";
import type { CalendarEvent } from "./types";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  getDay,
  locales,
  parse,
  startOfWeek,
});

export const LiveCalendar = () => {
  const [view] = useState<"day" | "week" | "month" | "work_week" | "agenda">(
    "day",
  );
  const { events } = useCalendarData();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | undefined>(
    undefined,
  );

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleSelectSlot = () => {
    setSelectedEvent(undefined);
  };

  return (
    <div className="h-[1000px] bg-surface squircle-rounded-2xl p-6 flex flex-col">
      <Calendar
        className="rbc-custom-dark"
        components={{
          event: CalendarEventComponent,
          toolbar: CalendarToolbar,
        }}
        dayLayoutAlgorithm="no-overlap"
        endAccessor="end"
        events={events}
        localizer={localizer}
        max={new Date(0, 0, 0, 20, 0, 0)}
        min={new Date(0, 0, 0, 8, 0, 0)}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        selectable
        selected={selectedEvent}
        startAccessor="start"
        step={30}
        style={{ height: "100%" }}
        timeslots={2}
        toolbar={true}
        view={view}
        views={["day"]}
      />
    </div>
  );
};
