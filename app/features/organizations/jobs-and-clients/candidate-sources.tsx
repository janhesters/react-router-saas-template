"use client";

import ReactECharts from "echarts-for-react";
import { useTranslation } from "react-i18next";
import { ClientOnly } from "remix-utils/client-only";

import { Spinner } from "~/components/ui/spinner";

const Fallback = () => {
  return (
    <div className="flex size-full items-center justify-center">
      <Spinner className="text-muted-foreground" />
    </div>
  );
};

export const CandidateSources = ({
  data,
}: {
  data: {
    legend: {
      bottom: string;
      data: string[];
      icon: string;
      itemGap: number;
      itemHeight: number;
      itemWidth: number;
      left: string;
      textStyle: {
        color: string;
        fontSize: number;
      };
    };
    series: {
      center: string[];
      data: {
        itemStyle: {
          color: string;
        };
        name: string;
        value: number;
      }[];
      itemStyle: {
        borderRadius: number;
      };
      label: {
        show: boolean;
      };
      name: string;
      radius: string[];
      roseType: string;
      type: string;
    }[];
    tooltip: {
      backgroundColor: string;
      borderColor: string;
      textStyle: {
        color: string;
      };
      trigger: string;
    };
  };
}) => {
  const { t } = useTranslation("organizations", {
    keyPrefix: "jobsAndClients.candidateSources",
  });

  return (
    <div className="bg-surface h-full squircle-rounded-3xl p-6 flex flex-col">
      <p className="font-medium text-lg mb-2">{t("title")}</p>
      <div className="flex-1 min-h-0">
        <ClientOnly fallback={<Fallback />}>
          {() => (
            <ReactECharts
              className="size-full"
              option={data}
              opts={{ renderer: "svg" }}
            />
          )}
        </ClientOnly>
      </div>
    </div>
  );
};
