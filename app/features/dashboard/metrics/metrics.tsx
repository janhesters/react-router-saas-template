import { useState } from "react";
import { BarChart3, Target } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { METRIC_OPTIONS, type MetricOption } from "./data";

export function Metrics() {
  const [selectedMetric1, setSelectedMetric1] = useState<string>("time-to-hire");
  const [selectedMetric2, setSelectedMetric2] = useState<string>("candidate-pipeline");

  const getSelectedMetricLabel = (id: string): string => {
    return METRIC_OPTIONS.find((option) => option.id === id)?.label || "Select Metric";
  };

  return (
    <div className="grid grid-cols-min md:grid-cols-2 gap-4">
      <Card className="bg-muted/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Metric 1</CardTitle>
            <Select value={selectedMetric1} onValueChange={setSelectedMetric1}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                {METRIC_OPTIONS.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-12">
          <div className="flex flex-col items-center gap-2">
            <Target className="size-24 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground text-center">
              {getSelectedMetricLabel(selectedMetric1)}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-muted/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Metric 2</CardTitle>
            <Select value={selectedMetric2} onValueChange={setSelectedMetric2}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                {METRIC_OPTIONS.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-12">
          <div className="flex flex-col items-center gap-2">
            <BarChart3 className="size-24 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground text-center">
              {getSelectedMetricLabel(selectedMetric2)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

