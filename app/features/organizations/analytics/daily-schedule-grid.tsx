import { Button } from "~/components/ui/button";

export default function DailyScheduleGrid({
  events,
}: {
  events: {
    id: string;
    title: string;
    startHour: number;
    endHour: number;
  }[];
}) {
  const hours = Array.from({ length: 6 }, (_, i) => i); // 12 AM → 11 AM
  const HOUR_HEIGHT = 56;

  return (
    <section className="rounded-lg border bg-background">
      {/* Header stays unchanged */}
      <div className="flex items-center justify-between border-b px-4 py-3 bg-gray-100">
        <div className="flex items-center gap-3">
          <Button size="icon" variant="ghost">
            ‹
          </Button>
          <p className="text-sm font-medium">Monday, October 26</p>
          <Button size="icon" variant="ghost">
            ›
          </Button>
        </div>
        <Button
          className="bg-gray-600 text-white rounded-none"
          size="sm"
          variant="secondary"
        >
          {" "}
          Today{" "}
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-[64px_1fr] relative">
        {/* Time column */}
        <div className="border-r">
          {hours.map((hour) => (
            <div
              className="h-14 border-b border-dashed text-xs flex items-start justify-end pr-2 pt-2 text-black"
              key={hour}
            >
              {hour === 0 ? "12 AM" : `${hour} AM`}
            </div>
          ))}
        </div>

        {/* Schedule canvas */}
        <div className="relative bg-white">
          {/* Hour rows */}
          {hours.map((hour) => (
            <div className="h-14 border-b border-dashed" key={hour} />
          ))}

          {/* Events */}
          {events.map((event) => {
            const top = event.startHour * HOUR_HEIGHT;
            const height = (event.endHour - event.startHour) * HOUR_HEIGHT;

            return (
              <div
                className="absolute left-6 right-6 rounded-md border bg-gray-100 px-3 py-2 text-sm shadow-sm"
                key={event.id}
                style={{ height, top }}
              >
                <p className="font-medium text-xs lg:text-base">
                  {event.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {event.startHour}:00 – {event.endHour}:00
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
