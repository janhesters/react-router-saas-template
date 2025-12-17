import { Bell } from "lucide-react";

import type { FunnelUpdate } from "../types";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { cn } from "~/lib/utils";

interface UrgentFunnelUpdatesProps {
  updates: FunnelUpdate[];
  onUpdateClick?: (update: FunnelUpdate) => void;
  onActionClick?: (update: FunnelUpdate) => void;
}

const priorityStyles = {
  high: "bg-destructive text-destructive-foreground",
  low: "bg-secondary text-secondary-foreground",
  medium: "bg-yellow-500 text-white dark:bg-yellow-600",
};

export function UrgentFunnelUpdates({
  updates,
  onUpdateClick,
  onActionClick,
}: UrgentFunnelUpdatesProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-mono text-lg tracking-tight">
          Urgent Funnel Updates
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {updates.map((update) => (
          <Button
            className={cn(
              "flex h-auto flex-col items-stretch gap-2 rounded-lg border border-border bg-transparent p-3 text-left transition-colors hover:bg-muted/50",
            )}
            key={update.id}
            onClick={() => onUpdateClick?.(update)}
            variant="ghost"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                <Bell className="size-4 text-muted-foreground" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="font-medium text-sm leading-tight">
                  {update.title}
                </div>
                <div className="font-mono text-muted-foreground text-xs leading-relaxed whitespace-normal">
                  {update.description}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pl-11">
              <Badge
                className={cn("capitalize", priorityStyles[update.priority])}
              >
                {update.priority}
              </Badge>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onActionClick?.(update);
                }}
                size="sm"
                variant="outline"
              >
                {update.actionLabel}
              </Button>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
