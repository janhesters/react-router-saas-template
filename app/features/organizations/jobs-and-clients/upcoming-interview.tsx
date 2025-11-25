import { BriefcaseBusiness, Timer, UsersRound } from "lucide-react";

import { Button } from "~/components/ui/button";

export function UpcomingInterview({
  className,
  interview,
}: {
  className?: string;
  interview: {
    attendees: string[];
    company: string;
    date: string;
    extraAttendees: number;
    image: string;
    name: string;
    role: string;
  };
}) {
  return (
    <div
      className={`bg-surface squircle-rounded-3xl p-6 flex flex-col justify-between gap-6 ${className}`}
    >
      <div className="flex items-start justify-between">
        <p className="text-lg font-medium">Upcoming Interview</p>

        <Button>Join meeting</Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 overflow-hidden md:gap-10">
        <div className="flex items-center gap-3 w-fit shrink-0">
          <div className="aspect-square h-12 rounded-full bg-white/20">
            <img
              alt="interview-user"
              className="w-full aspect-square"
              src={interview.image}
            />
          </div>

          <div>
            <p className="line-clamp-1">{interview.name}</p>
            <p className="text-xs text-neutral-400 line-clamp-1">
              {interview.role}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Timer className="text-primary" color="currentColor" size={14} />
            <p className="text-xs text-neutral-400">Time</p>
          </div>

          <p className="line-clamp-1 truncate whitespace-nowrap">
            {interview.date}
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <BriefcaseBusiness
              className="text-primary"
              color="currentColor"
              size={14}
            />
            <p className="text-xs text-neutral-400">Company</p>
          </div>

          <p className="line-clamp-1 truncate whitespace-nowrap">
            {interview.company}
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <UsersRound
              className="text-primary"
              color="currentColor"
              size={14}
            />
            <p className="text-xs text-neutral-400">Attendees</p>
          </div>

          <div className="flex items-center gap-1">
            <div className="flex -space-x-1">
              {interview.attendees.map((attendee) => (
                <img
                  alt="dp"
                  className="size-5 rounded-full ring-3 ring-surface"
                  key={attendee}
                  src={attendee}
                />
              ))}
            </div>

            <p className="line-clamp-1 truncate whitespace-nowrap text-xs">
              +{interview.extraAttendees} others
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
