import { addDays, format, getDay, parse, startOfWeek, subDays } from "date-fns";
import { enUS } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { EventProps } from "react-big-calendar";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";

import type { CalendarEvent } from "../types";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { cn } from "~/lib/utils";

// date-fns localizer setup
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

interface CalendarViewProps {
  events: CalendarEvent[];
}

// Event type colors - using Tailwind classes for light backgrounds
const eventTypeStyles: Record<string, { bg: string; border: string }> = {
  interview: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    border: "border-blue-500",
  },
  meeting: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    border: "border-purple-500",
  },
  screening: {
    bg: "bg-green-100 dark:bg-green-900/30",
    border: "border-green-500",
  },
  sync: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    border: "border-orange-500",
  },
};

function EventComponent({ event }: EventProps<CalendarEvent>) {
  const startTime = event.start ? format(event.start, "hh:mm a") : "";
  const endTime = event.end ? format(event.end, "hh:mm a") : "";
  const eventType = event.type || "meeting";
  const styles = eventTypeStyles[eventType] || eventTypeStyles.meeting!;

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col justify-center rounded-sm border-l-4 px-3 py-2",
        styles.bg,
        styles.border,
      )}
    >
      <div className="font-medium text-foreground text-sm leading-tight">
        {event.title}
      </div>
      <div className="text-muted-foreground text-xs">
        {startTime} - {endTime}
      </div>
    </div>
  );
}

export function CalendarView({ events }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();

  const handlePrevDay = () => {
    setCurrentDate((prev) => subDays(prev, 1));
  };

  const handleNextDay = () => {
    setCurrentDate((prev) => addDays(prev, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const isToday =
    format(currentDate, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");

  // Working hours: 8 AM to 6 PM (so 5 PM slot is visible)
  const minTime = new Date();
  minTime.setHours(8, 0, 0, 0);
  const maxTime = new Date();
  maxTime.setHours(18, 0, 0, 0);

  return (
    <Card className="flex h-[400px] flex-col overflow-hidden" size="sm">
      {/* Header - date nav on left, today button on right, no top padding */}
      <div className="flex items-center justify-between border-b px-4 pb-3">
        <div className="flex items-center gap-1">
          <Button
            className="size-7"
            onClick={handlePrevDay}
            size="icon"
            variant="ghost"
          >
            <ChevronLeft className="size-4" />
            <span className="sr-only">Previous day</span>
          </Button>
          <span className="font-mono text-sm font-semibold tracking-tight">
            {format(currentDate, "EEEE, MMMM d")}
          </span>
          <Button
            className="size-7"
            onClick={handleNextDay}
            size="icon"
            variant="ghost"
          >
            <ChevronRight className="size-4" />
            <span className="sr-only">Next day</span>
          </Button>
        </div>
        <Button
          className="text-foreground"
          disabled={isToday}
          onClick={handleToday}
          size="sm"
          variant="ghost"
        >
          Today
        </Button>
      </div>

      {/* Calendar content */}
      <div className="flex-1 overflow-y-auto">
        <Calendar
          className="rbc-calendar-custom h-full"
          components={{
            event: EventComponent,
          }}
          date={currentDate}
          defaultView="day"
          events={events}
          localizer={localizer}
          max={maxTime}
          min={minTime}
          onNavigate={setCurrentDate}
          step={60}
          timeslots={1}
          toolbar={false}
          views={["day"]}
        />
      </div>

      <style>{`
        .rbc-calendar-custom {
          font-family: var(--font-mono);
          font-size: 0.75rem;
        }
        .rbc-calendar-custom .rbc-time-view {
          border: none;
        }
        .rbc-calendar-custom .rbc-time-header {
          display: none;
        }
        .rbc-calendar-custom .rbc-time-content {
          border-top: none;
        }
        .rbc-calendar-custom .rbc-time-gutter .rbc-timeslot-group {
          border-bottom: none;
          min-height: 70px;
        }
        .rbc-calendar-custom .rbc-day-slot .rbc-timeslot-group {
          border-bottom: 1px dashed #9ca3af;
          min-height: 70px;
        }
        :is(.dark) .rbc-calendar-custom .rbc-day-slot .rbc-timeslot-group {
          border-bottom: 1px dashed #6b7280;
        }
        .rbc-calendar-custom .rbc-time-slot {
          border-top: none;
        }
        .rbc-calendar-custom .rbc-day-slot .rbc-time-slot {
          border-top: none;
        }
        .rbc-calendar-custom .rbc-label {
          color: hsl(var(--muted-foreground));
          padding: 0 0.75rem;
          font-size: 0.75rem;
        }
        .rbc-calendar-custom .rbc-time-gutter .rbc-timeslot-group:first-child .rbc-label {
          padding-top: 0.25rem;
        }
        .rbc-calendar-custom .rbc-events-container {
          margin-right: 0;
        }
        .rbc-calendar-custom .rbc-event {
          background: transparent !important;
          border: none !important;
          padding: 2px 4px;
        }
        .rbc-calendar-custom .rbc-event-content {
          height: 100%;
        }
        .rbc-calendar-custom .rbc-event-label {
          display: none;
        }
        .rbc-calendar-custom .rbc-current-time-indicator {
          background-color: hsl(var(--destructive));
          height: 2px;
        }
        .rbc-calendar-custom .rbc-allday-cell {
          display: none;
        }
        .rbc-calendar-custom .rbc-today {
          background: transparent;
        }
        .rbc-calendar-custom .rbc-time-column {
          background: transparent;
        }
        .rbc-calendar-custom .rbc-day-slot {
          background: transparent;
        }
      `}</style>
    </Card>
  );
}
