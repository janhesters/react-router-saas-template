import { ArrowDown, ArrowUp, Minus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

interface ChartStatsCardProps {
  data: Array<{
    name: string;
    applications: number;
    interviews: number;
    offers: number;
  }>;
  title?: string;
}

export default function ChartStatsCard({
  data,
  title = "Weekly Hiring Activity",
}: ChartStatsCardProps) {
  const totals = data.reduce(
    (acc, curr) => ({
      applications: acc.applications + curr.applications,
      interviews: acc.interviews + curr.interviews,
      offers: acc.offers + curr.offers,
    }),
    { applications: 0, interviews: 0, offers: 0 },
  );

  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.applications, d.interviews, d.offers)),
    1,
  );

  const midpoint = Math.floor(data.length / 2);
  const firstHalf = data
    .slice(0, midpoint)
    .reduce((sum, d) => sum + d.applications, 0);
  const lastHalf = data
    .slice(midpoint)
    .reduce((sum, d) => sum + d.applications, 0);

  const trend =
    lastHalf > firstHalf ? "up" : lastHalf < firstHalf ? "down" : "stable";
  const trendPercent =
    firstHalf === 0
      ? lastHalf > 0
        ? "100"
        : "0"
      : Math.abs(((lastHalf - firstHalf) / firstHalf) * 100).toFixed(0);

  return (
    <Card className="rounded-none border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base md:text-lg font-semibold">
            {title}
          </CardTitle>
          <div className="flex items-center gap-1 text-xs md:text-sm">
            {trend === "up" && (
              <>
                <ArrowUp
                  aria-hidden="true"
                  className="h-3 w-3 md:h-4 md:w-4 text-green-500"
                />
                <span className="text-green-500 font-medium">
                  +{trendPercent}%
                </span>
              </>
            )}
            {trend === "down" && (
              <>
                <ArrowDown
                  aria-hidden="true"
                  className="h-3 w-3 md:h-4 md:w-4 text-red-500"
                />
                <span className="text-red-500 font-medium">
                  -{trendPercent}%
                </span>
              </>
            )}
            {trend === "stable" && (
              <>
                <Minus
                  aria-hidden="true"
                  className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground"
                />
                <span className="text-muted-foreground font-medium">0%</span>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 md:gap-6 mt-3 text-xs md:text-sm">
          <div className="flex items-center gap-2">
            <div
              aria-hidden="true"
              className="h-3 w-3 rounded-full bg-primary"
            />
            <span className="text-muted-foreground">
              Applications:{" "}
              <span className="font-semibold text-foreground">
                {totals.applications}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              aria-hidden="true"
              className="h-3 w-3 rounded-full bg-blue-500"
            />
            <span className="text-muted-foreground">
              Interviews:{" "}
              <span className="font-semibold text-foreground">
                {totals.interviews}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              aria-hidden="true"
              className="h-3 w-3 rounded-full bg-green-500"
            />
            <span className="text-muted-foreground">
              Offers:{" "}
              <span className="font-semibold text-foreground">
                {totals.offers}
              </span>
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-4 md:pb-6">
        <div
          aria-label="Bar chart showing hiring activity"
          className="w-full h-[250px] md:h-[300px] relative"
          role="img"
        >
          <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-xs text-muted-foreground">
            <span>{maxValue}</span>
            <span>{Math.round(maxValue * 0.75)}</span>
            <span>{Math.round(maxValue * 0.5)}</span>
            <span>{Math.round(maxValue * 0.25)}</span>
            <span>0</span>
          </div>

          <div className="absolute left-10 right-0 top-0 bottom-8 border-l border-b border-border">
            <div className="absolute inset-0">
              {[0, 25, 50, 75].map((percent) => (
                <div
                  className="absolute left-0 right-0 border-t border-dashed border-muted"
                  key={percent}
                  style={{ top: `${percent}%` }}
                />
              ))}
            </div>

            <div className="absolute inset-0 flex items-end justify-around gap-1 px-2">
              {data.map((day) => (
                <div
                  className="flex-1 flex flex-col items-center gap-1 h-full justify-end"
                  key={day.name}
                >
                  <span className="sr-only">
                    {day.name}: {day.applications} applications,{" "}
                    {day.interviews} interviews, {day.offers} offers
                  </span>

                  <div className="w-full flex gap-0.5 items-end justify-center">
                    <div
                      className="bg-primary rounded-t transition-all hover:opacity-80"
                      style={{
                        height: `${(day.applications / maxValue) * 100}%`,
                        minHeight: day.applications > 0 ? "2px" : "0",
                        width: "30%",
                      }}
                      title={`Applications: ${day.applications}`}
                    />
                    <div
                      className="bg-blue-500 rounded-t transition-all hover:opacity-80"
                      style={{
                        height: `${(day.interviews / maxValue) * 100}%`,
                        minHeight: day.interviews > 0 ? "2px" : "0",
                        width: "30%",
                      }}
                      title={`Interviews: ${day.interviews}`}
                    />
                    <div
                      className="bg-green-500 rounded-t transition-all hover:opacity-80"
                      style={{
                        height: `${(day.offers / maxValue) * 100}%`,
                        minHeight: day.offers > 0 ? "2px" : "0",
                        width: "30%",
                      }}
                      title={`Offers: ${day.offers}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute left-10 right-0 bottom-0 h-8 flex items-center justify-around text-xs text-muted-foreground">
            {data.map((day) => (
              <span className="flex-1 text-center" key={day.name}>
                {day.name}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
