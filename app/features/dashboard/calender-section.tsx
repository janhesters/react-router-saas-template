import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "../../components/ui/button";
import type { CalenderEvent } from "./dashboard-data/types";

type Props = {
  dateLabel: string;
  events: CalenderEvent[];
};

export default function CalenderSection({ dateLabel, events }: Props) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const formatHour = (hour: number) =>
    hour === 0
      ? "12 AM"
      : hour < 12
        ? `${hour} AM`
        : hour === 12
          ? "12 PM"
          : `${hour - 12} PM`;

  const getEventForHour = (hour: number) => {
    return events.find((event) => {
      const startHour = new Date(event.start).getHours();
      return startHour === hour;
    });
  };

  const formatTime = (date: string) =>
    new Date(date)
      .toLocaleTimeString([], {
        hour: "numeric",
        hour12: true,
        minute: "2-digit",
      })
      .replace(/ AM| PM/, "");

  return (
    <div className="flex-1 rounded-none border   p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button className="text-white" size="icon" variant="ghost">
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <h2 className="text-lg font-semibold">{dateLabel}</h2>

          <Button className="text-white " size="icon" variant="ghost">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <Button className="text-sm rounded-none" size="sm" variant="outline">
          Today
        </Button>
      </div>

      <div className="space-y-2 max-h-[420px] overflow-y-auto scrollbar-hidden pr-2">
        {hours.map((hour) => {
          const event = getEventForHour(hour);

          return (
            <div className="flex border-b py-2" key={hour}>
              <div className="w-20 text-sm text-gray-500">
                {formatHour(hour)}
              </div>

              <div className="flex-1">
                {event && (
                  <div className="rounded-md bg-gray-100 p-2">
                    <p className="text-sm text-black font-medium">
                      {event.title}
                    </p>
                    <p className="text-xs text-black">
                      {formatTime(event.start)} - {formatTime(event.end)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
