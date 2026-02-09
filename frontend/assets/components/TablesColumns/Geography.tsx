"use client";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";

import { GeographyClassificationForm } from "@/components/forms/assets/GeographyClassificationForm";
import { DataTableColumnHeader } from "@/components/reusable/CockpitLongTable/BuildingBlocks/data-table-column-header";
import { ReusableSheet } from "@/components/reusable/GeneralLayout/ReusableSheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/utils/format-date";
import { formatPercentageValue } from "@/utils/format-percentage-value";

// Definição da interface
interface Asset {
  asset_id: number;
  display_name: string;
  lote45_asset_type: string;
  milestones_asset_type: string;
  lote45_identifier: string;
  classification_date_reference: string;
  geography_usa: number;
  geography_brazil: number;
  geography_europe: number;
  geography_china: number;
  geography_india: number;
  geography_latam: number;
  geography_asia_ex_jp: number;
  geography_africa: number;
  geography_global: number;
  geography_japan: number;
  geography_se_asia: number;
  geography_other: number;
}

// Definição das colunas
export const geographyColumns: ColumnDef<Asset>[] = [
  {
    header: "Actions",
    id: "actions",
    cell: ({ row }) => {
      const asset = row.original as Asset;
      const [isSheetOpen, setIsSheetOpen] = useState(false);

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsSheetOpen(true)}>
                Add Classification
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ReusableSheet
            isOpen={isSheetOpen}
            setIsOpen={setIsSheetOpen}
            title="Add Geography Classification"
            description="Add a new classification to this asset"
            variant="default"
          >
            <GeographyClassificationForm
              data={asset}
              setIsOpen={setIsSheetOpen}
            />
          </ReusableSheet>
        </>
      );
    },
  },
  {
    id: "asset_id",
    accessorKey: "asset_id",
    header: "Asset ID",
  },
  {
    id: "display_name",
    accessorKey: "display_name",
    header: "Display Name",
  },
  {
    id: "lote45_asset_type",
    accessorKey: "lote45_asset_type",
    header: "Lote45 Asset Type",
  },
  {
    id: "milestones_asset_type",
    accessorKey: "milestones_asset_type",
    header: "Milestones Asset Type",
  },
  {
    id: "lote45_identifier",
    accessorKey: "lote45_identifier",
    header: "Lote45 Identifier",
  },
  {
    id: "classification_date_reference",
    accessorKey: "classification_date_reference",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date Reference" />
    ),
    cell: ({ row }) => {
      const dateRef = row.getValue("classification_date_reference") as
        | string
        | null;

      return formatDate({
        date: dateRef,
      });
    },
  },
  {
    id: "geography_usa",
    accessorKey: "geography_usa",
    header: "USA",
    cell: ({ row }) => {
      const value = row.getValue("geography_usa") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "geography_brazil",
    accessorKey: "geography_brazil",
    header: "Brazil",
    cell: ({ row }) => {
      const value = row.getValue("geography_brazil") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "geography_europe",
    accessorKey: "geography_europe",
    header: "Europe",
    cell: ({ row }) => {
      const value = row.getValue("geography_europe") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "geography_china",
    accessorKey: "geography_china",
    header: "China",
    cell: ({ row }) => {
      const value = row.getValue("geography_china") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "geography_india",
    accessorKey: "geography_india",
    header: "India",
    cell: ({ row }) => {
      const value = row.getValue("geography_india") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "geography_latam",
    accessorKey: "geography_latam",
    header: "LATAM",
    cell: ({ row }) => {
      const value = row.getValue("geography_latam") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "geography_asia_ex_jp",
    accessorKey: "geography_asia_ex_jp",
    header: "Asia Ex JP",
    cell: ({ row }) => {
      const value = row.getValue("geography_asia_ex_jp") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "geography_africa",
    accessorKey: "geography_africa",
    header: "Africa",
    cell: ({ row }) => {
      const value = row.getValue("geography_africa") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "geography_global",
    accessorKey: "geography_global",
    header: "Global",
    cell: ({ row }) => {
      const value = row.getValue("geography_global") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "geography_japan",
    accessorKey: "geography_japan",
    header: "Japan",
    cell: ({ row }) => {
      const value = row.getValue("geography_japan") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "geography_se_asia",
    accessorKey: "geography_se_asia",
    header: "SE Asia",
    cell: ({ row }) => {
      const value = row.getValue("geography_se_asia") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "geography_other",
    accessorKey: "geography_other",
    header: "Other",
    cell: ({ row }) => {
      const value = row.getValue("geography_other") as string | null;
      return formatPercentageValue(value);
    },
  },
];
