import { BarChart3, TrendingDown, TrendingUp } from "lucide-react";

import type { PipelineStat } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { cn } from "~/lib/utils";

interface QuickStatsCardProps {
  stats: PipelineStat[];
}

export function QuickStatsCard({ stats }: QuickStatsCardProps) {
  return (
    <Card className="h-full" size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-mono tracking-tight">
          <BarChart3 className="size-4 text-muted-foreground" />
          Pipeline Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {stats.map((stat) => (
          <div className="flex items-center justify-between" key={stat.id}>
            <span className="text-muted-foreground text-sm">{stat.label}</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-lg">
                {stat.value}
              </span>
              {stat.change !== undefined && (
                <div
                  className={cn(
                    "flex items-center gap-0.5 text-xs",
                    stat.change > 0 && "text-green-600 dark:text-green-400",
                    stat.change < 0 && "text-red-600 dark:text-red-400",
                  )}
                >
                  {stat.change > 0 ? (
                    <TrendingUp className="size-3" />
                  ) : (
                    <TrendingDown className="size-3" />
                  )}
                  <span>{Math.abs(stat.change)}%</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
