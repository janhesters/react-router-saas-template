import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { ToolbarProps } from "react-big-calendar";
import { toast } from "sonner";

import type { CalendarEvent } from "../types";
import { Button } from "~/components/ui/button";

export const CalendarToolbar = (props: ToolbarProps<CalendarEvent>) => {
  const { onNavigate, label } = props;

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
    toast.success("Schedule Interview", {
      description: "Opening scheduling modal...",
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
        <span className="font-medium">{label}</span>
        <Button
          className="h-8 w-8"
          onClick={goToNext}
          size="icon"
          variant="ghost"
        >
          <ChevronRight className="size-4" />
        </Button>

        <Button onClick={goToToday} variant="ghost">
          Today
        </Button>
      </div>
      <Button className="gap-2" onClick={handleSchedule}>
        Schedule Interview
      </Button>
    </div>
  );
};
