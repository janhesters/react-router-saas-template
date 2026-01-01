/**
 * Chart components for Jobs and Clients feature
 */

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

export type PerformanceMetricsChartProps = {
  metrics: PerformanceMetric[];
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
}: PerformanceMetricsChartProps) {
  const chartData = metrics.map((metric, index) => ({
    fill: COLORS[index % COLORS.length],
    name: metric.label,
    percentage: calculateMetricPercentage(metric),
    target: metric.target,
    value: metric.value,
  }));

  return (
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
                fontSize={12}
                textAnchor="middle"
                x={entry.x}
                y={entry.y}
              >
                {`${data.name}: ${data.percentage}%`}
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
            props: { payload?: { value: number; target: number } },
          ) => {
            if (value === undefined || !props.payload) return ["", ""];
            return [
              `${props.payload.value} / ${props.payload.target} (${value}%)`,
              "Achievement",
            ];
          }}
          itemStyle={{ color: "var(--foreground)" }}
          labelStyle={{ color: "var(--foreground)" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export type GrowthTrendsChartProps = {
  trends: GrowthTrend[];
};

export function GrowthTrendsChart({ trends }: GrowthTrendsChartProps) {
  if (trends.length === 0) return null;

  const trend = trends[0]; // Use first trend for now
  if (!trend) return null;

  const chartData = trend.dataPoints.map((point) => ({
    period: point.period,
    value: Math.round(point.value),
  }));

  return (
    <ResponsiveContainer
      aspect={undefined}
      height="100%"
      minHeight={80}
      minWidth={0}
      width="100%"
    >
      <BarChart
        data={chartData}
        margin={{ bottom: -30, left: -10, right: 0, top: 0 }}
      >
        <XAxis
          angle={-45}
          dataKey="period"
          height={60}
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
  );
}
