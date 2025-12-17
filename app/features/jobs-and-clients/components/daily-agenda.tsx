import { Clock } from "lucide-react";
import { useState } from "react";

import type { AgendaItem } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { cn } from "~/lib/utils";

interface DailyAgendaProps {
  items: AgendaItem[];
}

function formatTodayDate(): string {
  return new Date().toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    weekday: "long",
  });
}

export function DailyAgenda({ items: initialItems }: DailyAgendaProps) {
  const [items, setItems] = useState(initialItems);

  const handleToggle = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    );
  };

  return (
    <Card className="flex h-64 flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" />
          <CardTitle className="font-mono text-lg tracking-tight">
            Daily Agenda
          </CardTitle>
        </div>
        <p className="text-muted-foreground text-xs">{formatTodayDate()}</p>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto py-0">
        <div className="flex flex-col gap-1.5">
          {items.map((item) => (
            <div className="flex items-center gap-2 py-1" key={item.id}>
              <Checkbox
                checked={item.completed}
                className="size-3.5"
                id={item.id}
                onCheckedChange={() => handleToggle(item.id)}
              />
              <label
                className={cn(
                  "cursor-pointer text-xs leading-tight",
                  item.completed && "text-muted-foreground line-through",
                )}
                htmlFor={item.id}
              >
                {item.title}
              </label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
