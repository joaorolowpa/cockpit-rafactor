"use client";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";

import { CockpitLongTable } from "@/components/reusable/CockpitLongTable/CockpitLongTable";
import { Loading } from "@/components/reusable/Loading";
import { DatePickerInputWithAvailableDates } from "@/components/ui/date-picker";
import { getAssetsValuesFundsConsolidated } from "@/services/internal-api/wpa/get-assets-values-funds-consolidated";

import { columns } from "./columns";

interface WPALiquidTablesProps {
  availableDates: string[];
}

export function WPALiquidTables({ availableDates }: WPALiquidTablesProps) {
  const [date, setDate] = useState<Date | undefined>(
    parseISO(availableDates[0]),
  );

  const { data, isLoading } = useQuery({
    queryKey: ["assets-values-funds-ownership", date],
    queryFn: async () => {
      const response = await getAssetsValuesFundsConsolidated({
        date_reference: date ? format(date, "yyyy-MM-dd") : undefined,
      });
      return response;
    },
  });

  if (!data) {
    return null;
  }

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <DatePickerInputWithAvailableDates
          date={date}
          setDate={setDate}
          availableDates={availableDates.map((date: string) => parseISO(date))}
        />
      </div>
      <CockpitLongTable
        data={data}
        columns={columns}
        tableConfig={{
          isZebraStriped: true,
        }}
      />
    </div>
  );
}
