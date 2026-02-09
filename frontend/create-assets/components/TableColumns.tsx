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
import { formatDate } from "@/utils/format-date";

// This type is used to define the shape of our data.
export type Asset = {
  asset_id: number;
  asset_name: string;
  asset_description: string;
  asset_created_at: string;
  asset_type_description: string;
};

export const columns: ColumnDef<Asset>[] = [
  {
    id: "asset_id",
    accessorKey: "asset_id",
    header: "ID",
  },
  {
    id: "asset_created_by_name",
    accessorKey: "asset_created_by_name",
    header: "Created By (Name)",
  },
  {
    id: "asset_created_by_email",
    accessorKey: "asset_name",
    header: "Name",
    minSize: 200,
    maxSize: 300,
    size: 250,
  },
  {
    id: "asset_description",
    accessorKey: "asset_description",
    header: "Description",
  },
  {
    id: "asset_type_description",
    accessorKey: "asset_type_description",
    header: "Type",
  },
  {
    id: "asset_created_at",
    accessorKey: "asset_created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) => {
      const createdAt = row.original.asset_created_at;

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
      const pathToRevalidate = "/dashboard/wpa/create-assets";

      const createdAtDate = parseISO(asset.asset_created_at as string);
      const isDeletable = differenceInDays(new Date(), createdAtDate) < 7;

      const handleDelete = async () => {
        try {
          await deleteDataWithToast({
            endpoint: `/v1/wpa/assets/${asset.asset_id}`,
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
            <DropdownMenuTrigger
              asChild
              className="flex items-center justify-end"
            >
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
