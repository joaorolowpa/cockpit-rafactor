"use client";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";

import { ClasseClassificationForm } from "@/components/forms/assets/ClasseClassificationForm";
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
  classe_acoes: number;
  classe_private_equity: number;
  classe_caixa: number;
  classe_private_debt: number;
  classe_real_estate: number;
  classe_renda_fixa: number;
  classe_hedge_funds: number;
  classe_credito_alternativo: number;
  classe_other: number;
}

export const classeColumns: ColumnDef<Asset>[] = [
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
            title="Add Classe Classification"
            description="Add a new classification to this asset"
            variant="default"
          >
            <ClasseClassificationForm data={asset} setIsOpen={setIsSheetOpen} />
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
    header: "LOTE45 Asset Type",
  },
  {
    id: "milestones_asset_type",
    accessorKey: "milestones_asset_type",
    header: "Milestones Asset Type",
  },
  {
    id: "lote45_identifier",
    accessorKey: "lote45_identifier",
    header: "LOTE45 Identifier",
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

      // Use optional chaining for date formatting
      return formatDate({
        date: dateRef,
      });
    },
  },
  {
    id: "classe_acoes",
    accessorKey: "classe_acoes",
    header: "Ações",
    cell: ({ row }) => {
      const value = row.getValue("classe_acoes") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "classe_private_equity",
    accessorKey: "classe_private_equity",
    header: "Private Equity",
    cell: ({ row }) => {
      const value = row.getValue("classe_private_equity") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "classe_caixa",
    accessorKey: "classe_caixa",
    header: "Caixa",
    cell: ({ row }) => {
      const value = row.getValue("classe_caixa") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "classe_private_debt",
    accessorKey: "classe_private_debt",
    header: "Private Debt",
    cell: ({ row }) => {
      const value = row.getValue("classe_private_debt") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "classe_real_estate",
    accessorKey: "classe_real_estate",
    header: "Real Estate",
    cell: ({ row }) => {
      const value = row.getValue("classe_real_estate") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "classe_renda_fixa",
    accessorKey: "classe_renda_fixa",
    header: "Renda Fixa",
    cell: ({ row }) => {
      const value = row.getValue("classe_renda_fixa") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "classe_hedge_funds",
    accessorKey: "classe_hedge_funds",
    header: "Hedge Funds",
    cell: ({ row }) => {
      const value = row.getValue("classe_hedge_funds") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "classe_credito_alternativo",
    accessorKey: "classe_credito_alternativo",
    header: "Crédito Alternativo",
    cell: ({ row }) => {
      const value = row.getValue("classe_credito_alternativo") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "classe_other",
    accessorKey: "classe_other",
    header: "Other",
    cell: ({ row }) => {
      const value = row.getValue("classe_other") as string | null;
      return formatPercentageValue(value);
    },
  },
];
