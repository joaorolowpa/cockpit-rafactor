"use client";
import { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/reusable/CockpitLongTable/BuildingBlocks/data-table-column-header";
import { formatDate } from "@/utils/format-date";

interface Asset {
  asset_id: string;
  display_name: string;
  lote45_asset_type: string;
  milestones_asset_type: string;
  lote45_identifier: string;
  classification_date_reference: string;
  is_internal_bool: boolean;
}

export const internalColumns: ColumnDef<Asset>[] = [
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
    id: "is_internal_bool",
    accessorKey: "is_internal_bool",
    header: "Is Internal",
    cell: ({ row }) => {
      const isInternal = row.getValue("is_internal_bool") as boolean;
      return isInternal ? "Yes" : "No";
    },
  },
];
