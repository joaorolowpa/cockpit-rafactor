"use client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";

import { CockpitLongTable } from "@/components/reusable/CockpitLongTable/CockpitLongTable";
import { DatePickerInput } from "@/components/ui/date-picker";
import { getAssetsValuesDistinct } from "@/services/internal-api/wpa/get-assets-values-distinct";
import { getAssetsValuesGrouped } from "@/services/internal-api/wpa/get-assets-values-grouped";

import { distinctColumns, groupedColumns } from "./columns";

export function WPAIlliquidTables() {
  const [date, setDate] = useState<Date>(
    new Date(new Date().setHours(0, 0, 0, 0)),
  );

  const { data: groupedAssetsValues } = useQuery({
    queryKey: ["get-assets-values-grouped", date],
    queryFn: async () => {
      const response = await getAssetsValuesGrouped({
        date_reference: date ? format(date, "yyyy-MM-dd") : undefined,
      });
      return response;
    },
  });

  const { data: distinctAssetsValues } = useQuery({
    queryKey: ["get-assets-values-distinct", date],
    queryFn: async () => {
      const response = await getAssetsValuesDistinct({
        date_reference: date ? format(date, "yyyy-MM-dd") : undefined,
      });
      return response;
    },
  });

  if (!groupedAssetsValues || !distinctAssetsValues) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <DatePickerInput date={date} setDate={setDate} />
      </div>
      <CockpitLongTable
        title={`Total dos grupos na data: ${date ? `${format(date, "dd-MMM-yyyy")}` : ""}`}
        data={groupedAssetsValues}
        columns={groupedColumns}
        tableConfig={{
          isZebraStriped: true,
        }}
      />
      <CockpitLongTable
        title={`Saldo de cada ativo na data: ${date ? `${format(date, "dd-MMM-yyyy")}` : ""}`}
        data={distinctAssetsValues}
        columns={distinctColumns}
        tableConfig={{
          isZebraStriped: true,
        }}
      />
    </div>
  );
}
