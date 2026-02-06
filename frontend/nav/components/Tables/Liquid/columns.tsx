"use client";

import { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/reusable/CockpitLongTable/BuildingBlocks/data-table-column-header";
import { AssetValue } from "@/services/internal-api/wpa/get-assets-values-funds-consolidated";
import { formatDate } from "@/utils/format-date";

export const columns: ColumnDef<AssetValue>[] = [
  {
    id: "portfolio_name",
    accessorKey: "portfolio_name",
    header: "Portfolio Name",
  },
  {
    id: "portfolio_id",
    accessorKey: "portfolio_id",
    header: "Portfolio ID",
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
  {
    id: "total_original_position",
    accessorKey: "total_original_position",
    header: "Total Original Position",
    cell: ({ row }) => {
      const totalOriginalPosition = row.getValue("total_original_position") as
        | number
        | null;

      return totalOriginalPosition
        ? totalOriginalPosition.toLocaleString("pt-BR", {
            style: "decimal",
          })
        : "$ 0.00";
    },
  },
  {
    id: "portfolio_original_currency",
    accessorKey: "portfolio_original_currency",
    header: "Portfolio Original Currency",
  },
  {
    id: "fx_rate",
    accessorKey: "fx_rate",
    header: "FX Rate",
    cell: ({ row }) => {
      const fxRate = row.getValue("fx_rate") as number | null;

      return fxRate ? parseFloat(fxRate.toFixed(2)) : 0;
    },
  },
  {
    id: "fx_date_reference",
    accessorKey: "fx_date_reference",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="FX Date Reference" />
    ),
    cell: ({ row }) => {
      const dateRef = row.getValue("fx_date_reference") as string | null;

      return formatDate({
        date: dateRef,
      });
    },
  },
  {
    id: "portfolio_new_currency",
    accessorKey: "portfolio_new_currency",
    header: "Portfolio New Currency",
  },
  {
    id: "portfolio_value_in_brl",
    accessorKey: "portfolio_value_in_brl",
    header: "Portfolio Value in BRL",
    cell: ({ row }) => {
      const value = row.getValue("portfolio_value_in_brl") as number | null;

      return value
        ? value.toLocaleString("en-US", { style: "currency", currency: "BRL" })
        : "R$ 0,00";
    },
  },
  {
    id: "percentage_ownership",
    accessorKey: "percentage_ownership",
    header: "Percentage Ownership",
    cell: ({ row }) => {
      const percentageOwnership = row.getValue("percentage_ownership") as
        | number
        | null;

      return `${percentageOwnership ? parseFloat(percentageOwnership.toFixed(2)) * 100 : 0}%`;
    },
  },
  {
    id: "wpa_stake_date_reference",
    accessorKey: "wpa_stake_date_reference",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="WPA Stake Date Reference" />
    ),
    cell: ({ row }) => {
      const dateRef = row.getValue("wpa_stake_date_reference") as string | null;

      return formatDate({
        date: dateRef,
      });
    },
  },
  {
    id: "wpa_stake_comment",
    accessorKey: "wpa_stake_comment",
    header: "WPA Stake Comment",
    cell: ({ row }) => {
      const comment = row.getValue("wpa_stake_comment") as string | null;

      return comment ? comment : "-";
    },
  },
  {
    id: "net_wpa_stake",
    accessorKey: "net_wpa_stake",
    header: "Net WPA Stake",
    cell: ({ row }) => {
      const netWpaStake = row.getValue("net_wpa_stake") as number | null;

      return netWpaStake
        ? netWpaStake.toLocaleString("en-US", {
            style: "decimal",
          })
        : "0,00";
    },
  },
];
