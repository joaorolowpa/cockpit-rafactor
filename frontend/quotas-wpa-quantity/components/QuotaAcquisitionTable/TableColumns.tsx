"use client";
import { ColumnDef } from "@tanstack/react-table";
import { differenceInDays, parseISO } from "date-fns";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";

import { DataTableColumnHeader } from "@/components/reusable/CockpitLongTable/BuildingBlocks/data-table-column-header";
import { ConfirmationDialog } from "@/components/reusable/GeneralLayout/ConfirmationDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteDataWithToast } from "@/modules/internal-api/deleteDataWithToast";
import { QuotaAcquisitionData } from "../../actions";

// Helper functions to format numbers
function formatQuantity(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatQuotaValue(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8,
  });
}

export const columns: ColumnDef<QuotaAcquisitionData>[] = [
  {
    id: "date_reference",
    accessorKey: "date_reference",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date Reference" />
    ),
    cell: ({ row }) => {
      return <span className="font-mono">{row.original.date_reference}</span>;
    },
  },
  {
    id: "asset_name",
    accessorKey: "asset_name",
    header: "Asset Name",
    cell: ({ row }) => {
      return <span className="font-medium">{row.original.asset_name}</span>;
    },
  },
  {
    id: "quantidade_cotas",
    accessorKey: "quantidade_cotas",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Quantity" />
    ),
    cell: ({ row }) => {
      return (
        <span className="text-right">
          {formatQuantity(row.original.quantidade_cotas)}
        </span>
      );
    },
  },
  {
    id: "valor_cota",
    accessorKey: "valor_cota",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Unit Value" />
    ),
    cell: ({ row }) => {
      return (
        <span className="text-right">
          {formatQuotaValue(row.original.valor_cota)}
        </span>
      );
    },
  },
  {
    id: "comment",
    accessorKey: "comment",
    header: "Comment",
    cell: ({ row }) => {
      return (
        <span className="text-sm text-gray-600">
          {row.original.comment || "-"}
        </span>
      );
    },
  },
  {
    id: "actions",
    accessorKey: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const acquisition = row.original;
      const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] =
        useState(false);

      const createdAtDate = parseISO(acquisition.date_reference);
      const isDeletable = differenceInDays(new Date(), createdAtDate) < 365;

      const handleDelete = async () => {
        try {
          await deleteDataWithToast({
            endpoint: `/v1/quotas/acquisition/wpa/${acquisition.quota_acquisition_id}`,
            pathToRevalidate: "/dashboard/backoffice/quotas-wpa-quantity",
            debug: false,
          });
        } catch (error) {
          console.error(error);
        }
      };

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <span className="sr-only">Open actions</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => isDeletable && setIsConfirmationDialogOpen(true)}
                disabled={!isDeletable}
              >
                <Trash2 className="mr-2 h-4 w-4" color="#C53030" />
                {isDeletable ? "Delete item" : "Delete item disabled"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {isConfirmationDialogOpen && (
            <ConfirmationDialog
              header="Confirm Deletion"
              text={`Are you sure you want to delete this acquisition? This action cannot be undone.
              
Asset: ${acquisition.asset_name}
Date: ${acquisition.date_reference}
Quantity: ${formatQuantity(acquisition.quantidade_cotas)}`}
              onConfirm={handleDelete}
              onCancel={() => setIsConfirmationDialogOpen(false)}
              isOpen={isConfirmationDialogOpen}
              setIsOpen={setIsConfirmationDialogOpen}
            />
          )}
        </>
      );
    },
  },
];
