import { Copy, Mail, Phone, Sparkles } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";

export function CandidateProfileSheet({
  candidate,
  open,
  onOpenChange,
}: {
  candidate: {
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
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const { t } = useTranslation("organizations", {
    keyPrefix: "jobsAndClients.candidateProfile",
  });
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (candidate.meetingLink) {
      navigator.clipboard.writeText(candidate.meetingLink);
      setCopied(true);
      toast.success(t("linkCopied"));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="overflow-y-auto sm:max-w-lg pb-5">
        <SheetHeader className="">
          <SheetTitle>{t("candidateProfile")}</SheetTitle>
          <SheetDescription>{t("candidateDetails")}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-6 px-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative size-24 rounded-full overflow-hidden bg-white/20">
              <img
                alt={t("candidateImageAlt")}
                className="w-full h-full object-cover"
                src={candidate.image}
              />
            </div>

            <div className="text-center">
              <h3 className="text-xl font-semibold">{candidate.name}</h3>
              <p className="text-sm text-neutral-400">{candidate.role}</p>
              <p className="text-sm text-neutral-400">{candidate.company}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="mb-2 text-sm font-medium">{t("contactInfo")}</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="size-4 text-neutral-400" />
                  <a
                    className="text-primary hover:underline"
                    href={`mailto:${candidate.email}`}
                  >
                    {candidate.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="size-4 text-neutral-400" />
                  <a
                    className="text-primary hover:underline"
                    href={`tel:${candidate.phone}`}
                  >
                    {candidate.phone}
                  </a>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-medium">{t("skills")}</h4>
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((skill) => (
                  <span
                    className="rounded-md bg-secondary px-2 py-1 text-xs"
                    key={skill}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-medium">
                {t("resumeHighlights")}
              </h4>
              <ul className="space-y-2">
                {candidate.resumeHighlights.map((highlight) => (
                  <li
                    className="flex items-start gap-2 text-sm"
                    key={highlight}
                  >
                    <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-medium">
                {t("interviewDetails")}
              </h4>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-neutral-400">{t("time")}:</span>{" "}
                  {candidate.date}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400">{t("attendees")}:</span>
                  <div className="flex -space-x-1">
                    {candidate.attendees.map((attendee) => (
                      <img
                        alt={t("attendeeAlt")}
                        className="size-6 rounded-full ring-2 ring-surface"
                        key={attendee}
                        src={attendee}
                      />
                    ))}
                  </div>
                  {candidate.extraAttendees > 0 && (
                    <span className="text-xs text-neutral-400">
                      {t("othersCount", { count: candidate.extraAttendees })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-2 pt-2">
              <Button
                className="flex-1 gap-2"
                onClick={handleCopyLink}
                variant="outline"
              >
                <Copy className="size-4" />
                {copied ? t("copied") : t("copyMeetingLink")}
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  if (candidate.meetingLink) {
                    window.open(candidate.meetingLink, "_blank");
                  }
                }}
              >
                {t("joinMeeting")}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
