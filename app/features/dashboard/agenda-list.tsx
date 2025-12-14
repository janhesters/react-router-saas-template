import { Clock4 } from "lucide-react";

import AgendaItem from "./agenda-item";
import type { AgendaItem as AgendaItemType } from "./dashboard-data/types";

interface Props {
  items: AgendaItemType[];
  date: string;
}

export default function AgendaList({ items, date }: Props) {
  return (
    <div className="w-full rounded-none shadow-sm">
      <div className="flex border-b-2 px-3 py-3 sm:px-4 sm:py-4 items-start gap-2">
        <h2 className="font-semibold text-sm sm:text-base md:text-xl wrap-break-word flex-1 min-w-0">
          <span className="hidden sm:inline">{`Daily Agenda // ${date}`}</span>
          <span className="sm:hidden">{`Agenda // ${date}`}</span>
        </h2>

        <span className="text-muted-foreground shrink-0">
          <Clock4 className="h-4 w-4 sm:h-5 sm:w-5" />
        </span>
      </div>

      <div className="mt-2 space-y-2 pb-2 sm:mt-3 sm:space-y-3 sm:pb-0">
        {items.map((item) => (
          <AgendaItem item={item} key={item.id} />
        ))}
      </div>
    </div>
  );
}
