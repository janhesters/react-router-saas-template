import { Clock } from "lucide-react";
import { useState } from "react";

import type { AgendaItem } from "../types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
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
    <Card className="h-64" size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-mono tracking-tight">
          <Clock className="size-4 text-muted-foreground" />
          Daily Agenda
        </CardTitle>
        <CardDescription>{formatTodayDate()}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div className="flex items-center gap-3" key={item.id}>
              <Checkbox
                checked={item.completed}
                className="size-4"
                id={item.id}
                onCheckedChange={() => handleToggle(item.id)}
              />
              <label
                className={cn(
                  "cursor-pointer text-sm leading-snug",
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
