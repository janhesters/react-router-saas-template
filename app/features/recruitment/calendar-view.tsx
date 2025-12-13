import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";

type CalendarEvent = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  type: "screening" | "interview" | "meeting";
};

type CalendarViewProps = {
  currentDate: string;
  events: CalendarEvent[];
  onPreviousDay?: () => void;
  onNextDay?: () => void;
  onToday?: () => void;
};

function formatTime(time: string) {
  const date = new Date(time);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    hour12: true,
    minute: "2-digit",
  });
}

function getEventPosition(startTime: string, endTime: string) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const startHour = start.getHours();
  const startMinute = start.getMinutes();
  const duration = (end.getTime() - start.getTime()) / (1000 * 60);

  const top = (startHour * 60 + startMinute) * (60 / 60);
  const height = duration * (60 / 60);

  return { height, top };
}

export function CalendarView({
  currentDate,
  events,
  onPreviousDay,
  onNextDay,
  onToday,
}: CalendarViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              className="size-8"
              onClick={onPreviousDay}
              size="icon"
              variant="ghost"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <h3 className="text-lg font-semibold">{currentDate}</h3>
            <Button
              className="size-8"
              onClick={onNextDay}
              size="icon"
              variant="ghost"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <Button onClick={onToday} size="sm" variant="outline">
            Today
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative max-h-96 overflow-auto">
          <div className="space-y-0 border-l">
            {hours.slice(0, 12).map((hour) => {
              const displayHour = hour === 0 ? 12 : hour;
              const period = hour < 12 ? "AM" : "PM";

              return (
                <div
                  className="relative flex h-16 border-b border-t"
                  key={hour}
                >
                  <div className="w-16 flex-shrink-0 pr-2 text-right text-xs text-muted-foreground">
                    {displayHour} {period}
                  </div>
                  <div className="flex-1 border-l" />
                </div>
              );
            })}
          </div>

          {events.map((event) => {
            const { top, height } = getEventPosition(
              event.startTime,
              event.endTime,
            );

            return (
              <div
                className="absolute left-16 right-4 rounded bg-primary/10 border-l-2 border-primary px-2 py-1"
                key={event.id}
                style={{
                  height: `${height}px`,
                  minHeight: "40px",
                  top: `${top}px`,
                }}
              >
                <p className="text-sm font-medium">{event.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTime(event.startTime)} - {formatTime(event.endTime)}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
