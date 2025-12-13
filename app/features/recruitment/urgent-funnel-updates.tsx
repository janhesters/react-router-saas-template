import { Bell } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

type UrgentUpdate = {
  id: string;
  candidateName: string;
  position: string;
  details: string;
  deadline: string;
  priority: "high" | "medium" | "low";
};

type UrgentFunnelUpdatesProps = {
  updates: UrgentUpdate[];
};

export function UrgentFunnelUpdates({ updates }: UrgentFunnelUpdatesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Urgent Funnel Updates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {updates.map((update) => (
          <div className="space-y-3" key={update.id}>
            <div className="flex items-start gap-3">
              <Bell className="mt-1 size-5 text-muted-foreground" />
              <div className="flex-1 space-y-1">
                <p className="font-medium">
                  Offer Pending for {update.candidateName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {update.details}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className="bg-primary text-primary-foreground"
                variant={update.priority === "high" ? "default" : "secondary"}
              >
                {update.priority === "high" ? "High" : "Medium"}
              </Badge>
              <Button size="sm" variant="outline">
                Send Reminder
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
