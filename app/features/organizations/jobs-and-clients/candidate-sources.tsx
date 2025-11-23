"use client";

import ReactECharts from "echarts-for-react";
import { ClientOnly } from "remix-utils/client-only";

import { Spinner } from "~/components/ui/spinner";

const Fallback = () => {
  return (
    <div className="flex size-full items-center justify-center">
      <Spinner className="text-muted-foreground" />
    </div>
  );
};

export const CandidateSources = () => {
  const option = {
    legend: {
      bottom: "0",
      data: ["Meta", "Amazon", "Google", "Netflix", "ReactSquad", "Others"],
      icon: "roundRect",
      itemGap: 20,
      itemHeight: 12,
      itemWidth: 12,
      left: "center",
      textStyle: {
        color: "#9ca3af", // gray-400
        fontSize: 12,
      },
    },
    series: [
      {
        center: ["50%", "40%"],
        data: [
          { itemStyle: { color: "#0099ff" }, name: "Meta", value: 35 },
          { itemStyle: { color: "#33adff" }, name: "Google", value: 30 },
          { itemStyle: { color: "#66c2ff" }, name: "Amazon", value: 25 },
          { itemStyle: { color: "#80ccff" }, name: "Netflix", value: 20 },
          { itemStyle: { color: "#99d6ff" }, name: "ReactSquad", value: 15 },
          { itemStyle: { color: "#b3e0ff" }, name: "Others", value: 10 },
        ],
        itemStyle: {
          borderRadius: 6,
        },
        label: {
          show: false,
        },
        name: "Candidate Sources",
        radius: ["20%", "60%"],
        roseType: "area",
        type: "pie",
      },
    ],
    tooltip: {
      backgroundColor: "#1f2937",
      borderColor: "#374151",
      textStyle: {
        color: "#f3f4f6",
      },
      trigger: "item",
    },
  };

  return (
    <div className="bg-surface h-full squircle-rounded-3xl p-6 flex flex-col">
      <p className="font-medium text-lg mb-2">Candidate Sources</p>
      <div className="flex-1 min-h-0">
        <ClientOnly fallback={<Fallback />}>
          {() => (
            <ReactECharts
              className="size-full"
              option={option}
              opts={{ renderer: "svg" }}
            />
          )}
        </ClientOnly>
      </div>
    </div>
  );
};
