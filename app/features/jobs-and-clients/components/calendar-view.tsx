import { format, getDay, parse, startOfWeek } from "date-fns";
import { enUS } from "date-fns/locale";
import type { EventProps } from "react-big-calendar";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";

import type { CalendarEvent } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
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

const eventTypeColors: Record<string, string> = {
  interview: "bg-blue-500",
  meeting: "bg-purple-500",
  screening: "bg-green-500",
  sync: "bg-orange-500",
};

function EventComponent({ event }: EventProps<CalendarEvent>) {
  const colorClass = eventTypeColors[event.type || "meeting"] || "bg-primary";

  return (
    <div
      className={cn(
        "h-full w-full rounded px-1 py-0.5 text-white text-xs",
        colorClass,
      )}
    >
      {event.title}
    </div>
  );
}

export function CalendarView({ events }: CalendarViewProps) {
  const today = new Date();

  return (
    <Card className="h-[450px]">
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-lg tracking-tight">
          Today&apos;s Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[380px]">
        <Calendar
          className="rbc-calendar-custom"
          components={{
            event: EventComponent,
          }}
          date={today}
          defaultView="day"
          events={events}
          localizer={localizer}
          max={new Date(today.setHours(18, 0, 0, 0))}
          min={new Date(today.setHours(8, 0, 0, 0))}
          onNavigate={() => {}}
          step={30}
          timeslots={2}
          toolbar={false}
          views={["day"]}
        />
      </CardContent>
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
          border-top: 1px solid hsl(var(--border));
        }
        .rbc-calendar-custom .rbc-time-gutter .rbc-timeslot-group {
          border-bottom: none;
        }
        .rbc-calendar-custom .rbc-timeslot-group {
          border-bottom: 1px solid hsl(var(--border));
        }
        .rbc-calendar-custom .rbc-time-slot {
          border-top: none;
        }
        .rbc-calendar-custom .rbc-day-slot .rbc-time-slot {
          border-top: 1px dashed hsl(var(--border) / 0.5);
        }
        .rbc-calendar-custom .rbc-label {
          color: hsl(var(--muted-foreground));
          padding: 0 0.5rem;
        }
        .rbc-calendar-custom .rbc-event {
          background: transparent;
          border: none;
          padding: 0;
        }
        .rbc-calendar-custom .rbc-event-content {
          height: 100%;
        }
        .rbc-calendar-custom .rbc-current-time-indicator {
          background-color: hsl(var(--destructive));
        }
      `}</style>
    </Card>
  );
}
