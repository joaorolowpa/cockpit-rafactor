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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteDataWithToast } from "@/modules/internal-api/deleteDataWithToast";
import { FundNoteFile } from "@/services/internal-api/files/get-funds-notes-files-types";
import { formatDate } from "@/utils/format-date";

export const columns: ColumnDef<FundNoteFile>[] = [
  {
    id: "id",
    accessorKey: "id",
    header: "ID",
  },
  {
    id: "display_name",
    accessorKey: "display_name",
    header: "Name",
  },
  {
    id: "description",
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      return row.original.description ?? "-";
    },
  },
  {
    id: "created_at",
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) => {
      return formatDate({
        date: row.original.created_at as string,
      });
    },
  },
  {
    id: "actions",
    accessorKey: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const fundNoteFile = row.original;
      const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] =
        useState(false);

      const createdAt = parseISO(fundNoteFile.created_at as string);
      const isDeletable = differenceInDays(new Date(), createdAt) <= 7;

      const handleDelete = async () => {
        try {
          await deleteDataWithToast({
            endpoint: `/v1/funds-notes/files/types/${fundNoteFile.id}`,
            pathToRevalidate: "/dashboard/research-manager/funds",
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
              text="Are you sure you want to delete this item?"
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
