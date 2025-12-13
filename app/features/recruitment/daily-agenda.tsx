import { Clock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";

type AgendaItem = {
  id: string;
  task: string;
  completed: boolean;
  time?: string;
};

type DailyAgendaProps = {
  date: string;
  items: AgendaItem[];
  onToggle?: (id: string) => void;
};

export function DailyAgenda({ date, items, onToggle }: DailyAgendaProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Daily Agenda {"//"} {date}
          </CardTitle>
          <Clock className="size-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div className="flex items-start gap-3" key={item.id}>
            <Checkbox
              checked={item.completed}
              className="mt-0.5"
              onCheckedChange={() => onToggle?.(item.id)}
            />
            <div className="flex-1 space-y-1">
              <p
                className={`text-sm ${
                  item.completed ? "text-muted-foreground line-through" : ""
                }`}
              >
                {item.task}
              </p>
            </div>
            {item.time && <Clock className="size-4 text-muted-foreground" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
