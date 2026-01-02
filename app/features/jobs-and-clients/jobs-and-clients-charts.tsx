/**
 * Chart components for Jobs and Clients feature
 */

import { format, isSameMonth, startOfMonth } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useSearchParams } from "react-router";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  GrowthTrend,
  PerformanceMetric,
} from "./jobs-and-clients-constants";
import { calculateMetricPercentage } from "./jobs-and-clients-helpers";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";

export type PerformanceMetricsChartProps = {
  metrics: PerformanceMetric[];
  metricsMonth: Date;
};

const COLORS = [
  "var(--primary)",
  "var(--primary)",
  "var(--primary)",
  "var(--primary)",
  "var(--primary)",
];

export function PerformanceMetricsChart({
  metrics,
  metricsMonth,
}: PerformanceMetricsChartProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const today = new Date();
  const currentMonth = startOfMonth(today);
  const selectedMonth = startOfMonth(metricsMonth);
  const isCurrentMonth = isSameMonth(selectedMonth, today);

  // Calculate min date (Jan 2024)
  const minDate = new Date(2024, 0, 1); // January 1, 2024
  const minMonth = startOfMonth(minDate);
  const isMinMonth = isSameMonth(selectedMonth, minMonth);

  // Handle month navigation
  const handlePreviousMonth = () => {
    if (isMinMonth) return;

    const prevMonth = new Date(selectedMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const monthString = format(prevMonth, "yyyy-MM-dd");

    // Preserve existing query params and update metrics_month
    const params = new URLSearchParams(searchParams);
    params.set("metrics_month", monthString);

    setSearchParams(params, { preventScrollReset: true });
  };

  const handleNextMonth = () => {
    if (isCurrentMonth) return;

    const nextMonth = new Date(selectedMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // Preserve existing query params
    const params = new URLSearchParams(searchParams);

    // If next month is current month, remove the query param
    if (isSameMonth(nextMonth, currentMonth)) {
      params.delete("metrics_month");
    } else {
      const monthString = format(nextMonth, "yyyy-MM-dd");
      params.set("metrics_month", monthString);
    }

    setSearchParams(params, { preventScrollReset: true });
  };

  const monthDisplay = format(selectedMonth, "MMM yyyy");
  const chartData = metrics.map((metric, index) => ({
    fill: COLORS[index % COLORS.length],
    name: metric.label,
    percentage: calculateMetricPercentage(metric),
    target: metric.target,
    value: metric.value,
  }));

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Month cycler */}
      <div className="flex items-center justify-center gap-3">
        <Button
          disabled={isMinMonth}
          onClick={handlePreviousMonth}
          size="sm"
          variant="outline"
        >
          <ChevronLeftIcon className="size-4" />
        </Button>
        <div className="min-w-[100px] text-center font-medium">
          {monthDisplay}
        </div>
        <Button
          disabled={isCurrentMonth}
          onClick={handleNextMonth}
          size="sm"
          variant="outline"
        >
          <ChevronRightIcon className="size-4" />
        </Button>
      </div>

      {/* Chart */}
      <div className="w-full min-h-20 h-72">
        <ResponsiveContainer
          aspect={undefined}
          height="100%"
          minHeight={80}
          minWidth={0}
          width="100%"
        >
          <PieChart>
            <Pie
              cx="50%"
              cy="50%"
              data={chartData}
              dataKey="percentage"
              fill="var(--primary)"
              label={(entry) => {
                const data = entry.payload as (typeof chartData)[0];
                return (
                  <text
                    fill="var(--foreground)"
                    fontSize={11}
                    textAnchor="middle"
                    x={entry.x}
                    y={entry.y}
                  >
                    <tspan dy="-6" fontWeight="600" x={entry.x}>
                      {data.name}
                    </tspan>
                    <tspan dy="12" fontSize={10} x={entry.x}>
                      {data.value} / {data.target} ({data.percentage}%)
                    </tspan>
                  </text>
                );
              }}
              labelLine={false}
              outerRadius={80}
            >
              {chartData.map((entry) => (
                <Cell fill={entry.fill} key={entry.name} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: "calc(var(--radius) - 2px)",
              }}
              formatter={(
                value: number | undefined,
                _name: string | undefined,
                props: {
                  payload?: { value: number; target: number; name: string };
                },
              ) => {
                if (value === undefined || !props.payload) return ["", ""];
                return [
                  `${props.payload.value} / ${props.payload.target} (${value}%)`,
                  props.payload.name,
                ];
              }}
              itemStyle={{ color: "var(--foreground)" }}
              labelFormatter={(_label) => `Achievement vs Target`}
              labelStyle={{ color: "var(--foreground)" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export type GrowthTrendsChartProps = {
  trends: GrowthTrend[];
};

export function GrowthTrendsChart({ trends }: GrowthTrendsChartProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  if (trends.length === 0) return null;

  // Get selected trend from URL, default to "roles"
  const trendParam = searchParams.get("trend");
  const selectedTrendId =
    trendParam === "interviews" ? "trend-interviews" : "trend-roles";

  // Find the selected trend
  const trend = trends.find((t) => t.id === selectedTrendId) ?? trends[0];
  if (!trend) return null;

  // Handle trend selection change
  const handleTrendChange = (value: string) => {
    // Get existing search params (like calendar_date, metrics_month) and preserve them
    const params = new URLSearchParams(searchParams);

    if (value === "interviews") {
      params.set("trend", "interviews");
    } else {
      params.delete("trend");
    }

    setSearchParams(params, { preventScrollReset: true });
  };

  const chartData = trend.dataPoints.map((point) => ({
    period: point.period,
    value: Math.round(point.value),
  }));

  const currentValue =
    selectedTrendId === "trend-interviews" ? "interviews" : "roles";

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Radio buttons for trend selection */}
      <RadioGroup
        className="flex flex-row gap-4"
        onValueChange={handleTrendChange}
        value={currentValue}
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem id="trend-roles" value="roles" />
          <Label className="cursor-pointer" htmlFor="trend-roles">
            Number of Roles Interviewed For
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem id="trend-interviews" value="interviews" />
          <Label className="cursor-pointer" htmlFor="trend-interviews">
            Number of Interviews
          </Label>
        </div>
      </RadioGroup>

      {/* Chart with key prop to force re-render on trend change */}
      <div className="w-full min-h-20 h-72">
        <ResponsiveContainer
          aspect={undefined}
          height="100%"
          minHeight={80}
          minWidth={0}
          width="100%"
        >
          <BarChart
            data={chartData}
            key={selectedTrendId}
            margin={{ bottom: -30, left: -10, right: 0, top: 0 }}
          >
            <XAxis
              angle={-45}
              dataKey="period"
              height={80}
              textAnchor="end"
              tick={{ fill: "var(--foreground)", fontSize: 12 }}
            />
            <YAxis
              label={{
                angle: -90,
                dx: 15,
                position: "insideLeft",
                style: { fill: "var(--foreground)", textAnchor: "middle" },
                value: "Value",
              }}
              tick={{ fill: "var(--foreground)", fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: "calc(var(--radius) - 2px)",
              }}
              formatter={(
                value: number | undefined,
                _name?: string | undefined,
              ) => {
                if (value === undefined) return ["", ""];
                return [value, "Value"];
              }}
              itemStyle={{ color: "var(--foreground)" }}
              labelStyle={{ color: "var(--foreground)" }}
            />
            <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
