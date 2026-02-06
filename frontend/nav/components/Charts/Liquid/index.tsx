"use client";
import "ag-charts-enterprise";

import { useQuery } from "@tanstack/react-query";
import { AgChartOptions } from "ag-charts-enterprise";
import { AgCharts } from "ag-charts-react";
import { format, parseISO } from "date-fns";
import { CircleX, LoaderCircle } from "lucide-react";
import { useState } from "react";

import { Loading } from "@/components/reusable/Loading";
import { DatePickerInputWithAvailableDates } from "@/components/ui/date-picker";
import { getWPAWeights } from "@/services/internal-api/wpa/get-wpa-weights";

import { colorPalette } from "./constants/color-pallete";
import { formatHierarchy } from "./functions/format-hierarchy";

interface WPALiquidChartsProps {
  availableDates: string[];
}

export function WPALiquidCharts({ availableDates }: WPALiquidChartsProps) {
  const [date, setDate] = useState<Date | undefined>(
    parseISO(availableDates[0]),
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["wpa-weights", date],
    queryFn: async () => {
      const response = await getWPAWeights({
        date_reference: format(date, "yyyy-MM-dd"),
      });

      return formatHierarchy(response);
    },
    retry: false,
  });

  const options = {
    data: data,
    series: [
      {
        type: "treemap",
        labelKey: "name",
        secondaryLabelKey: "percentage",
        sizeKey: "value",
        colorKey: "value",
        colorRange: colorPalette,
        group: {
          padding: 12,
          gap: 5,
        },
        tile: {
          padding: 8,
          gap: 2,
        },
        tooltip: {
          renderer: (params) => {
            if (params.datum.value === undefined) {
              return {
                content: `${params.datum.name}: N/A`,
              };
            }

            return {
              content: `${params.datum.name}: ${params.datum?.value?.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
            };
          },
        },
      },
    ],
    gradientLegend: {
      gradient: {
        thickness: 20,
        preferredLength: 400,
      },
    },
  } as unknown as AgChartOptions;

  return (
    <div className="h-screen space-y-4">
      <div className="flex items-center justify-end">
        <DatePickerInputWithAvailableDates
          date={date}
          setDate={setDate}
          availableDates={availableDates.map((date: string) => parseISO(date))}
        />
      </div>
      {isLoading ? (
        <Loading />
      ) : isError ? (
        <div className="flex h-screen w-full items-center justify-center">
          <div className="flex flex-col items-center justify-center space-x-1 space-y-2 text-sm text-gray-700">
            <CircleX className="h-6 w-6" />
            <div>No information to display</div>
          </div>
        </div>
      ) : (
        <AgCharts options={options} style={{ height: "100%", width: "100%" }} />
      )}
    </div>
  );
}
