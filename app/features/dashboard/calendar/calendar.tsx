import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { CalendarConfig, CalendarEvent } from "./data";

type CalendarProps = {
  currentDate: Date;
  calendarEvents: CalendarEvent[];
  calendarConfig: CalendarConfig;
  onNavigateDate: (direction: "prev" | "next") => void;
  onGoToToday: () => void;
  onAddEvent: () => void;
};

export function Calendar({
  currentDate,
  calendarEvents,
  calendarConfig,
  onNavigateDate,
  onGoToToday,
  onAddEvent,
}: CalendarProps) {
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

  return (
    <Card className="bg-muted/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigateDate("prev")}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <CardTitle className="text-lg font-semibold">
              {format(currentDate, "EEEE, MMMM d")}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigateDate("next")}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onAddEvent}
              className="h-8 w-8"
              aria-label="Add calendar event"
            >
              <Plus className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onGoToToday}
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
                {calendarEvents.map((event, index) => {
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
  );
}

