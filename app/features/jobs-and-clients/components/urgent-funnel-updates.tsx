import { Bell, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

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
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? updates.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === updates.length - 1 ? 0 : prev + 1));
  };

  const currentUpdate = updates[currentIndex];

  if (!currentUpdate) {
    return (
      <Card className="flex h-64 flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="font-mono text-lg tracking-tight">
            Urgent Funnel Updates
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground text-sm">No updates available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-64 flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="font-mono text-lg tracking-tight">
          Urgent Funnel Updates
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {/* Update Card */}
        <Button
          className={cn(
            "flex h-auto flex-1 flex-col items-stretch gap-2 rounded-lg border border-border bg-transparent p-3 text-left transition-colors hover:bg-muted/50",
          )}
          onClick={() => onUpdateClick?.(currentUpdate)}
          variant="ghost"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
              <Bell className="size-4 text-muted-foreground" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="font-medium text-sm leading-tight">
                {currentUpdate.title}
              </div>
              <div className="font-mono text-muted-foreground text-xs leading-relaxed whitespace-normal">
                {currentUpdate.description}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 pl-11">
            <Badge
              className={cn(
                "capitalize",
                priorityStyles[currentUpdate.priority],
              )}
            >
              {currentUpdate.priority}
            </Badge>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onActionClick?.(currentUpdate);
              }}
              size="sm"
              variant="outline"
            >
              {currentUpdate.actionLabel}
            </Button>
          </div>
        </Button>

        {/* Carousel Navigation */}
        <div className="mt-3 flex items-center justify-between">
          <Button
            className="size-8"
            disabled={updates.length <= 1}
            onClick={handlePrevious}
            size="icon"
            variant="ghost"
          >
            <ChevronLeft className="size-4" />
            <span className="sr-only">Previous update</span>
          </Button>

          {/* Dot Indicators */}
          <div className="flex items-center gap-1.5">
            {updates.map((update, index) => (
              <button
                aria-label={`Go to update ${index + 1}`}
                className={cn(
                  "size-2 rounded-full transition-colors",
                  index === currentIndex
                    ? "bg-primary"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50",
                )}
                key={update.id}
                onClick={() => setCurrentIndex(index)}
                type="button"
              />
            ))}
          </div>

          <Button
            className="size-8"
            disabled={updates.length <= 1}
            onClick={handleNext}
            size="icon"
            variant="ghost"
          >
            <ChevronRight className="size-4" />
            <span className="sr-only">Next update</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
