import { BriefcaseBusiness, Timer, UsersRound } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { CandidateProfileSheet } from "./candidate-profile-sheet";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export function UpcomingInterview({
  className,
  interview,
}: {
  className?: string;
  interview: {
    attendees: string[];
    company: string;
    date: string;
    email: string;
    extraAttendees: number;
    image: string;
    meetingLink: string;
    name: string;
    phone: string;
    resumeHighlights: string[];
    role: string;
    skills: string[];
  };
}) {
  const { t } = useTranslation("organizations", {
    keyPrefix: "jobsAndClients.upcomingInterview",
  });
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <div
        className={cn(
          "bg-surface rounded-3xl p-6 flex flex-col justify-between gap-6 transition-transform",
          className,
        )}
      >
        <div className="flex items-start justify-between">
          <p className="text-lg font-medium">{t("title")}</p>

          <Button
            onClick={() => {
              if (interview.meetingLink) {
                window.open(interview.meetingLink, "_blank");
              }
            }}
          >
            {t("joinMeeting")}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-4 overflow-hidden md:gap-10">
          <button
            className="flex items-center gap-3 w-fit shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setSheetOpen(true)}
            type="button"
          >
            <div className="aspect-square h-12 rounded-full bg-white/20">
              <img
                alt={t("interviewUserAlt")}
                className="w-full aspect-square"
                src={interview.image}
              />
            </div>

            <div className="flex flex-col items-start">
              <p className="line-clamp-1">{interview.name}</p>
              <p className="text-xs text-neutral-400 line-clamp-1">
                {interview.role}
              </p>
            </div>
          </button>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Timer className="text-primary" color="currentColor" size={14} />
              <p className="text-xs text-neutral-400">{t("time")}</p>
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
              <p className="text-xs text-neutral-400">{t("company")}</p>
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
              <p className="text-xs text-neutral-400">{t("attendees")}</p>
            </div>

            <div className="flex items-center gap-1">
              <div className="flex -space-x-1">
                {interview.attendees.map((attendee) => (
                  <img
                    alt={t("attendeeAlt")}
                    className="size-5 rounded-full ring-3 ring-surface"
                    key={attendee}
                    src={attendee}
                  />
                ))}
              </div>

              <p className="line-clamp-1 truncate whitespace-nowrap text-xs">
                {t("othersCount", { count: interview.extraAttendees })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <CandidateProfileSheet
        candidate={interview}
        onOpenChange={setSheetOpen}
        open={sheetOpen}
      />
    </>
  );
}
