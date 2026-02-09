"use client";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";

import { PubxPvtClassificationForm } from "@/components/forms/assets/PubxPvtClassificationForm";
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

interface Asset {
  asset_id: number;
  display_name: string;
  lote45_asset_type: string;
  milestones_asset_type: string;
  lote45_identifier: string;
  classification_date_reference: string;
  pubxpvt_public: number;
  pubxpvt_private: number;
  pubxpvt_other: number;
}

export const pubxpvtColumns: ColumnDef<Asset>[] = [
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
            title="Add Public x Private Classification"
            description="Add a new classification to this asset"
            variant="default"
          >
            <PubxPvtClassificationForm
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
    id: "pubxpvt_public",
    accessorKey: "pubxpvt_public",
    header: "Public",
    cell: ({ row }) => {
      const value = row.getValue("pubxpvt_public") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "pubxpvt_private",
    accessorKey: "pubxpvt_private",
    header: "Private",
    cell: ({ row }) => {
      const value = row.getValue("pubxpvt_private") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "pubxpvt_other",
    accessorKey: "pubxpvt_other",
    header: "Other",
    cell: ({ row }) => {
      const value = row.getValue("pubxpvt_other") as string | null;
      return formatPercentageValue(value);
    },
  },
];
