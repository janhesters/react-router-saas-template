import { Bell } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export default function UrgentFunnelUpdates({
  updates,
}: {
  updates: {
    id: string;
    title: string;
    description: string;
    priority: string;
    deadline: string;
  }[];
}) {
  return (
    <Card className="bg-gray-100 shadow-none rounded-none py-2">
      <CardHeader className="flex flex-row items-center justify-between px-3!">
        <CardTitle className="text-base lg:text-xl font-semibold">
          Urgent Funnel Updates
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 px-3!">
        {updates.map((update) => (
          <div
            className="flex items-start justify-between gap-4 bg-white p-4"
            key={update.id}
          >
            <Bell size={48} />
            <div className="space-y-1">
              <p className="text-sm font-medium">{update.title}</p>
              <p className="text-sm text-muted-foreground">
                {update.description} Deadline: {update.deadline}
              </p>
              <div className="flex gap-2 pt-2">
                <Badge
                  className="flex items-center gap-1 bg-gray-400"
                  variant="secondary"
                >
                  High
                </Badge>
                <Button size="sm" variant="outline">
                  Send Reminder
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
