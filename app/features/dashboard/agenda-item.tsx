import { Clock4 } from "lucide-react";

import type { AgendaItem as AgendaItemType } from "./dashboard-data/types";

interface Props {
  item: AgendaItemType;
}

export default function AgendaItem({ item }: Props) {
  return (
    <div className="w-full px-4 sm:px-6">
      <label className="flex items-start gap-2 sm:gap-3 cursor-pointer">
        <input
          className="mt-0.5 sm:mt-1 scale-125 sm:scale-150 shrink-0"
          type="checkbox"
        />

        <span className="text-xs sm:text-sm flex-1 wrap-break-word leading-relaxed">
          {item.task}
        </span>

        <span className="text-muted-foreground ml-2 shrink-0">
          <Clock4 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </span>
      </label>
      <hr className="border-t border-muted/70 my-2 sm:my-2" />
    </div>
  );
}
