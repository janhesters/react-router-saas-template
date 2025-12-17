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
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="size-5 text-muted-foreground" />
          <CardTitle className="font-mono text-lg tracking-tight">
            Daily Agenda
          </CardTitle>
        </div>
        <p className="text-muted-foreground text-sm">{formatTodayDate()}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {items.map((item) => (
          <div className="flex items-start gap-3" key={item.id}>
            <Checkbox
              checked={item.completed}
              id={item.id}
              onCheckedChange={() => handleToggle(item.id)}
            />
            <label
              className={cn(
                "cursor-pointer text-sm leading-relaxed",
                item.completed && "text-muted-foreground line-through",
              )}
              htmlFor={item.id}
            >
              {item.title}
            </label>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
