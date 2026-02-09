"use client";

import { ColumnDef } from "@tanstack/react-table";
import { differenceInDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MoreHorizontal } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { deleteDataWithToast } from "@/modules/internal-api/deleteDataWithToast";
import { AssetValue } from "@/services/internal-api/wpa/get-assets-values";
import { formatDate } from "@/utils/format-date";

export const columns: ColumnDef<AssetValue>[] = [
  {
    id: "asset_id",
    accessorKey: "asset_id",
    header: "ID",
  },
  {
    id: "asset_type_name",
    accessorKey: "asset_type_name",
    header: "Type",
  },
  {
    id: "asset_name",
    accessorKey: "asset_name",
    header: "Name",
    minSize: 300,
    maxSize: 450,
    size: 400,
  },
  {
    id: "asset_created_at",
    accessorKey: "asset_created_at",
    header: "Created At",
    cell: ({ row }) => {
      const createdAt = row.getValue("asset_created_at") as string | null;

      return formatDate({
        date: createdAt,
      });
    },
  },
  {
    id: "asset_created_by_email",
    accessorKey: "asset_created_by_email",
    header: "Asset Created By (Email)",
  },
  {
    id: "asset_created_by_name",
    accessorKey: "asset_created_by_name",
    header: "Asset Created By (Name)",
  },
  {
    id: "total_value_in_brl",
    accessorKey: "total_value_in_brl",
    header: "Total Value (BRL)",
    cell: ({ row }) => {
      const value = row.getValue("total_value_in_brl") as number | null;

      if (value === null) return "-";

      // Format the value as an absolute number and manually add the negative sign
      const formattedValue = Math.abs(value).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      return (
        <span className={value < 0 ? "text-red-500" : "text-green-500"}>
          R$ {value < 0 && "-"}
          {formattedValue}
        </span>
      );
    },
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
    id: "date_reference",
    accessorKey: "date_reference",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date Reference" />
    ),
    cell: ({ row }) => {
      const dateRef = row.getValue("date_reference") as string | null;

      // Use optional chaining for date formatting
      return dateRef
        ? format(parseISO(dateRef), "dd/MM/yyyy", { locale: ptBR })
        : "-";
    },
  },
  {
    id: "asset_value_created_by_email",
    accessorKey: "asset_value_created_by_email",
    header: "Value Created By (Email)",
  },
  {
    id: "asset_value_created_by_name",
    accessorKey: "asset_value_created_by_name",
    header: "Value Created By (Name)",
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
    id: "value_created_at",
    accessorKey: "value_created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) => {
      const createdAt = row.getValue("value_created_at") as string | null;

      return formatDate({
        date: createdAt,
      });
    },
  },
  {
    header: "Actions",
    id: "actions",
    cell: ({ row }) => {
      const asset = row.original;
      const [isDialogOpen, setIsDialogOpen] = useState(false);
      const { toast } = useToast();
      const pathToRevalidate = "/dashboard/wpa/assets-values";

      const createdAtDate = parseISO(asset.value_created_at as string);
      const isDeletable = differenceInDays(new Date(), createdAtDate) < 7;

      const handleDelete = async () => {
        try {
          await deleteDataWithToast({
            endpoint: `/v1/wpa/assets-values/${asset.asset_value_id}`,
            pathToRevalidate,
            debug: true,
          });
          // Optional: trigger a re-fetch of data or update the UI accordingly
        } catch (error) {
          console.error("Failed to delete item:", error);
        }
      };

      const handleCancel = () => {
        console.log("Action cancelled");
      };

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
              <DropdownMenuItem
                onClick={() => isDeletable && setIsDialogOpen(true)}
                disabled={!isDeletable}
              >
                {isDeletable ? "Delete item" : "Delete item disabled"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {isDialogOpen && (
            <ConfirmationDialog
              header="Confirm Deletion"
              text="Are you sure you want to delete this item?"
              onConfirm={handleDelete}
              onCancel={handleCancel}
              isOpen={isDialogOpen}
              setIsOpen={setIsDialogOpen}
            />
          )}
        </>
      );
    },
  },
];
