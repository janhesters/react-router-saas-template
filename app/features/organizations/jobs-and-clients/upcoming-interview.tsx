import { BriefcaseBusiness, Timer, UsersRound } from "lucide-react";

import { Button } from "~/components/ui/button";

export function UpcomingInterview() {
  return (
    <div className="col-span-1 row-span-1 bg-surface h-[175px] squircle-rounded-3xl p-6 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <p className="text-lg font-medium">Upcoming Interview</p>

        <Button>Join meeting</Button>
      </div>

      <div className="flex items-center gap-10 overflow-hidden">
        <div className="flex items-center gap-3 w-fit shrink-0">
          <div className="aspect-square h-12 rounded-full bg-white/20">
            <img
              alt="interview-user"
              className="w-full aspect-square"
              src="/images/monarch-image.png"
            />
          </div>

          <div>
            <p className="line-clamp-1">Ugbah Isioma</p>
            <p className="text-xs text-neutral-400 line-clamp-1">
              Senior frontend engineer
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Timer className="text-primary" color="currentColor" size={14} />
            <p className="text-xs text-neutral-400">Time</p>
          </div>

          <p className="line-clamp-1 truncate whitespace-nowrap">
            10:30am - 11:00am
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

          <p className="line-clamp-1 truncate whitespace-nowrap">React Squad</p>
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
              <img
                alt="dp"
                className="size-5 rounded-full ring-3 ring-surface"
                src="/images/dp1.png"
              />
              <img
                alt="dp"
                className="size-5 rounded-full ring-3 ring-surface"
                src="/images/dp2.png"
              />
              <img
                alt="dp"
                className="size-5 rounded-full ring-3 ring-surface"
                src="/images/dp3.png"
              />
              <img
                alt="dp"
                className="size-5 rounded-full ring-3 ring-surface"
                src="/images/dp4.png"
              />
              <img
                alt="dp"
                className="size-5 rounded-full ring-3 ring-surface"
                src="/images/dp5.png"
              />
            </div>

            <p className="line-clamp-1 truncate whitespace-nowrap text-xs">
              +2 others
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
