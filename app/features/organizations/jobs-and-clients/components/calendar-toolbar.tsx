import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { ToolbarProps } from "react-big-calendar";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import type { CalendarEvent } from "../types";
import { Button } from "~/components/ui/button";

export const CalendarToolbar = (props: ToolbarProps<CalendarEvent>) => {
  const { onNavigate, label } = props;
  const { t } = useTranslation("organizations", {
    keyPrefix: "jobsAndClients.calendar",
  });

  const goToBack = () => {
    onNavigate("PREV");
  };

  const goToNext = () => {
    onNavigate("NEXT");
  };

  const goToToday = () => {
    onNavigate("TODAY");
  };

  const handleSchedule = () => {
    toast.success(t("scheduleInterview"), {
      description: t("openingModal"),
    });
  };

  return (
    <div className="flex items-center justify-between mb-4 px-2">
      <div className="flex items-center gap-2">
        <Button
          className="h-8 w-8"
          onClick={goToBack}
          size="icon"
          variant="ghost"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm font-medium md:text-base">{label}</span>
        <Button
          className="h-8 w-8"
          onClick={goToNext}
          size="icon"
          variant="ghost"
        >
          <ChevronRight className="size-4" />
        </Button>

        <Button onClick={goToToday} variant="ghost">
          {t("today")}
        </Button>
      </div>

      <Button className="gap-2" onClick={handleSchedule} size="default">
        <Plus className="size-4" />
        <span className="hidden md:inline">{t("scheduleInterview")}</span>
      </Button>
    </div>
  );
};
