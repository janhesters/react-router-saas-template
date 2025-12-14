import { BellRing } from "lucide-react";

import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import type { FunnelUpdate } from "./dashboard-data/types";

interface Props {
  item: FunnelUpdate;
}

export default function FunnelUpdatesCard({ item }: Props) {
  return (
    <div className="w-full rounded-none shadow-sm">
      <div className="border-b px-3 py-3 sm:px-4 sm:py-4">
        <h2 className="text-base font-semibold sm:text-xl">
          Urgent Funnel Updates
        </h2>
      </div>

      <div className="px-3 py-3 sm:px-4 sm:py-4">
        <div className="flex gap-2 sm:gap-4">
          <div className="flex shrink-0 mt-0.5 sm:mt-1">
            <BellRing className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          </div>

          <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
            <div>
              <p className="font-semibold text-sm sm:text-base mb-1 wrap-break-word">
                {item.title}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground wrap-break-word">
                {item.description} Deadline: {item.deadline}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className="text-xs font-medium shrink-0"
                variant="destructive"
              >
                {item.priority}
              </Badge>

              <Button
                className="text-xs sm:text-sm rounded-none h-7 sm:h-8 px-2 sm:px-3"
                size="sm"
                variant="outline"
              >
                Send Reminder
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
