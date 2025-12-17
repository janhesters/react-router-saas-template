import { BellRing } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { UrgentFunnelUpdate } from "./data";

type UrgentFunnelUpdatesProps = {
  updates: UrgentFunnelUpdate[];
};

export function UrgentFunnelUpdates({ updates }: UrgentFunnelUpdatesProps) {
  return (
    <Card className="bg-muted/50">
      <CardHeader>
        <CardTitle className="text-xl font-bold">
          Urgent Funnel Updates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {updates.map((update, index) => (
          <div key={index} className="bg-white/50 rounded-lg p-4 border">
            <div className="flex flex-col gap-2 relative">
              <BellRing className="size-6 absolute top-0 left-0" />
              <h3 className="text-lg font-bold pl-8">{update.title}</h3>
              <p className="text-sm text-muted">{update.description}</p>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge className="bg-foreground/80 text-background rounded-full px-4 py-1">
                {update.priority}
              </Badge>
              <Button variant="outline" size="sm">
                Send Reminder
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

