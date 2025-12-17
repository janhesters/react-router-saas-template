import { Clock, Plus } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import type { AgendaItem } from "./data";

type DailyAgendaProps = {
  agendaItems: AgendaItem[];
  onToggleItem: (id: number) => void;
  onAddItem: () => void;
};

export function DailyAgenda({
  agendaItems,
  onToggleItem,
  onAddItem,
}: DailyAgendaProps) {
  return (
    <Card className="bg-muted/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="size-5" />
          <CardTitle className="text-xl font-bold">Daily Agenda</CardTitle>
        </div>
        <CardAction>
          <Button
            variant="ghost"
            size="icon"
            onClick={onAddItem}
            className="h-8 w-8"
            aria-label="Add agenda item"
          >
            <Plus className="size-4" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        {agendaItems.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            <Checkbox
              checked={item.checked}
              onCheckedChange={() => onToggleItem(item.id)}
              className="mt-0.5"
            />
            <div className="flex-1 flex items-center gap-2">
              <span
                className={
                  item.checked
                    ? "text-sm line-through text-muted-foreground"
                    : "text-sm"
                }
              >
                {item.text}
              </span>
              <Clock className="size-4 text-muted-foreground" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

