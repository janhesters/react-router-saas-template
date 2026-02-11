import { Target } from "lucide-react";

import type { HiringGoal } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";

interface HiringGoalsCardProps {
  goals: HiringGoal[];
}

export function HiringGoalsCard({ goals }: HiringGoalsCardProps) {
  return (
    <Card className="h-full" size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-mono tracking-tight">
          <Target className="size-4 text-muted-foreground" />
          Hiring Goals
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {goals.map((goal) => {
          const progressPercent = Math.round(
            (goal.current / goal.target) * 100,
          );

          return (
            <div className="flex flex-col gap-2" key={goal.id}>
              <div className="flex items-center justify-between">
                <span className="text-sm">{goal.title}</span>
                <span className="font-mono text-muted-foreground text-sm">
                  {goal.current}/{goal.target}
                </span>
              </div>
              <Progress className="h-2" value={progressPercent} />
              <p className="text-muted-foreground text-xs capitalize">
                {goal.period}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
