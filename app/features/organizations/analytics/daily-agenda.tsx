import { Clock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";

export default function DailyAgenda({
  items,
}: {
  items: {
    id: string;
    title: string;
    time: string;
    completed: boolean;
  }[];
}) {
  return (
    <Card className="flex flex-col gap-1! bg-gray-100 shadow-none rounded-none py-3">
      <CardHeader className="px-3! flex items-center justify-between py-2">
        <CardTitle className="text-base lg:text-xl font-semibold">
          {`Daily Agenda // 2025.04.23`}
        </CardTitle>
        <Clock size={24} />
      </CardHeader>

      <CardContent className="flex-1 overflow-auto px-3! border-t border-black">
        <ul className="space-y-3 border-b">
          {items.map((item) => (
            <li
              className="flex justify-between items-center border-b border-black pl-2 py-2"
              key={item.id}
            >
              <div className="flex items-start gap-3">
                <Checkbox checked={item.completed} className="bg-white" />

                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>

              <Clock size={16} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
