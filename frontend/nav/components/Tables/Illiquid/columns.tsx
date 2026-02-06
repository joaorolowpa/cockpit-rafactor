"use client";

import { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/reusable/CockpitLongTable/BuildingBlocks/data-table-column-header";
import { formatDate } from "@/utils/format-date";

type DistinctAssetValue = {
  asset_name: string;
  asset_type_name: string;
  wpa_value_in_brl: number;
  date_reference: string;
};

type GroupedAssetValue = {
  asset_type_name: string;
  total_value_sum: number;
  wpa_value_sum: number;
};

export const distinctColumns: ColumnDef<DistinctAssetValue>[] = [
  {
    id: "asset_name",
    accessorKey: "asset_name",
    header: "Name",
    minSize: 300,
    maxSize: 450,
    size: 400,
  },
  {
    id: "asset_type_name",
    accessorKey: "asset_type_name",
    header: "Type",
  },
  {
    id: "wpa_value_in_brl",
    accessorKey: "wpa_value_in_brl",
    header: "WPA Value (BRL)",
    cell: ({ row }) => {
      const value = row.getValue("wpa_value_in_brl") as number | null;

      if (value === null) return "-";

      // Format the value as an absolute number and manually add the negative sign
      const formattedValue = Math.abs(value).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      return (
        <span
          className={`truncate ${
            value < 0 ? "text-red-500" : "text-green-500"
          }`}
        >
          R$ {value < 0 && "-"}
          {formattedValue}
        </span>
      );
    },
  },
  {
    id: "comment",
    accessorKey: "comment",
    header: "Comment",
    cell: ({ row }) => {
      const comment = row.getValue("comment") as string | null;

      return comment ?? "-";
    },
  },
  {
    id: "date_reference",
    accessorKey: "date_reference",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date Reference" />
    ),
    cell: ({ row }) => {
      const dateRef = row.getValue("date_reference") as string | null;
      return formatDate({
        date: dateRef,
      });
    },
  },
];

export const groupedColumns: ColumnDef<GroupedAssetValue>[] = [
  {
    id: "asset_type_name",
    accessorKey: "asset_type_name",
    header: "Type",
  },
  {
    id: "wpa_value_sum",
    accessorKey: "wpa_value_sum",
    header: "WPA Value Sum",
    cell: ({ row }) => {
      const value = row.getValue("wpa_value_sum") as number | null;

      if (value === null) return "-";

      return value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    },
  },
];
