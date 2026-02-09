"use client";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";

import { TemaClassificationForm } from "@/components/forms/assets/TemaClassificationForm";
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
  tema_technology: number;
  tema_caixa: number;
  tema_financial: number;
  tema_utilities: number;
  tema_fundos_globais: number;
  tema_industrial: number;
  tema_credito: number;
  tema_fia_br: number;
  tema_real_estate: number;
  tema_life_sciences: number;
  tema_e_commerce: number;
  tema_consumer: number;
  tema_em_asia: number;
  tema_healthcare: number;
  tema_ntnb: number;
  tema_beauty: number;
  tema_climate: number;
  tema_chemicals: number;
  tema_special_situations: number;
  tema_commodity: number;
  tema_macro: number;
  tema_luxury: number;
  tema_energy: number;
  tema_other: number;
}

export const temaColumns: ColumnDef<Asset>[] = [
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
            title="Add Tema Classification"
            description="Add a new classification to this asset"
            variant="default"
          >
            <TemaClassificationForm data={asset} setIsOpen={setIsSheetOpen} />
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
    id: "tema_technology",
    accessorKey: "tema_technology",
    header: "Technology",
    cell: ({ row }) => {
      const value = row.getValue("tema_technology") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "tema_caixa",
    accessorKey: "tema_caixa",
    header: "Caixa",
    cell: ({ row }) => {
      const value = row.getValue("tema_caixa") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "tema_financial",
    accessorKey: "tema_financial",
    header: "Financial",
    cell: ({ row }) => {
      const value = row.getValue("tema_financial") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "tema_utilities",
    accessorKey: "tema_utilities",
    header: "Utilities",
    cell: ({ row }) => {
      const value = row.getValue("tema_utilities") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "tema_fundos_globais",
    accessorKey: "tema_fundos_globais",
    header: "Fundos Globais",
    cell: ({ row }) => {
      const value = row.getValue("tema_fundos_globais") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "tema_industrial",
    accessorKey: "tema_industrial",
    header: "Industrial",
    cell: ({ row }) => {
      const value = row.getValue("tema_industrial") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "tema_credito",
    accessorKey: "tema_credito",
    header: "Credito",
    cell: ({ row }) => {
      const value = row.getValue("tema_credito") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "tema_fia_br",
    accessorKey: "tema_fia_br",
    header: "FIA BR",
    cell: ({ row }) => {
      const value = row.getValue("tema_fia_br") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "tema_real_estate",
    accessorKey: "tema_real_estate",
    header: "Real Estate",
    cell: ({ row }) => {
      const value = row.getValue("tema_real_estate") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "tema_life_sciences",
    accessorKey: "tema_life_sciences",
    header: "Life Sciences",
    cell: ({ row }) => {
      const value = row.getValue("tema_life_sciences") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "tema_e_commerce",
    accessorKey: "tema_e_commerce",
    header: "E-commerce",
    cell: ({ row }) => {
      const value = row.getValue("tema_e_commerce") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "tema_consumer",
    accessorKey: "tema_consumer",
    header: "Consumer",
    cell: ({ row }) => {
      const value = row.getValue("tema_consumer") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "tema_em_asia",
    accessorKey: "tema_em_asia",
    header: "EM Asia",
    cell: ({ row }) => {
      const value = row.getValue("tema_em_asia") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "tema_healthcare",
    accessorKey: "tema_healthcare",
    header: "Healthcare",
    cell: ({ row }) => {
      const value = row.getValue("tema_healthcare") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "tema_ntnb",
    accessorKey: "tema_ntnb",
    header: "NTNB",
    cell: ({ row }) => {
      const value = row.getValue("tema_ntnb") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "tema_beauty",
    accessorKey: "tema_beauty",
    header: "Beauty",
    cell: ({ row }) => {
      const value = row.getValue("tema_beauty") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "tema_climate",
    accessorKey: "tema_climate",
    header: "Climate",
    cell: ({ row }) => {
      const value = row.getValue("tema_climate") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "tema_chemicals",
    accessorKey: "tema_chemicals",
    header: "Chemicals",
    cell: ({ row }) => {
      const value = row.getValue("tema_chemicals") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "tema_special_situations",
    accessorKey: "tema_special_situations",
    header: "Special Situations",
    cell: ({ row }) => {
      const value = row.getValue("tema_special_situations") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "tema_commodity",
    accessorKey: "tema_commodity",
    header: "Commodity",
    cell: ({ row }) => {
      const value = row.getValue("tema_commodity") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "tema_macro",
    accessorKey: "tema_macro",
    header: "Macro",
    cell: ({ row }) => {
      const value = row.getValue("tema_macro") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "tema_luxury",
    accessorKey: "tema_luxury",
    header: "Luxury",
    cell: ({ row }) => {
      const value = row.getValue("tema_luxury") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "tema_energy",
    accessorKey: "tema_energy",
    header: "Energy",
    cell: ({ row }) => {
      const value = row.getValue("tema_energy") as string | null;
      return formatPercentageValue(value);
    },
  },
  {
    id: "tema_other",
    accessorKey: "tema_other",
    header: "Other",
    cell: ({ row }) => {
      const value = row.getValue("tema_other") as string | null;
      return formatPercentageValue(value);
    },
  },
];
