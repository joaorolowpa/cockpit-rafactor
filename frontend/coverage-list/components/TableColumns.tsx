"use client";
import { ColumnDef } from "@tanstack/react-table";
import { differenceInDays, parseISO } from "date-fns";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import CompanyForm from "@/components/forms/old/CompanyForm";
import { DataTableColumnHeader } from "@/components/reusable/CockpitLongTable/BuildingBlocks/data-table-column-header";
import { ConfirmationDialog } from "@/components/reusable/GeneralLayout/ConfirmationDialog";
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
import { deleteDataWithToast } from "@/modules/internal-api/deleteDataWithToast";
import { Company } from "@/services/internal-api/companies/get-companies";
import { formatDate } from "@/utils/format-date";

export const columns: ColumnDef<Company>[] = [
  {
    id: "id",
    accessorKey: "id",
    header: "ID",
  },
  {
    id: "display_name",
    accessorKey: "display_name",
    header: "Display Name",
  },
  {
    id: "capital_iq_id",
    accessorKey: "capital_iq_id",
    header: "Capital IQ ID",
  },
  {
    id: "analysts",
    accessorKey: "analysts",
    header: "Analysts",
    cell: ({ row }) => {
      const analysts = row.original.analysts || [];
      return analysts.length > 0 ? analysts.map(a => a.name).join(", ") : "-";
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
        includeTime: true,
      });
    },
  },
  {
    id: "actions",
    accessorKey: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const company = row.original;
      const [isSheetOpen, setIsSheetOpen] = useState(false);
      const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] =
        useState(false);

      const createdAtDate = parseISO(company.created_at as string);
      const isDeletable = differenceInDays(new Date(), createdAtDate) < 7;

      const handleDelete = async () => {
        try {
          await deleteDataWithToast({
            endpoint: `/v1/companies/companies/${company.id}`,
            pathToRevalidate: "/dashboard/research-equities/coverage-list",
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
              <DropdownMenuItem onClick={() => setIsSheetOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" color="#3182CE" />
                Edit
              </DropdownMenuItem>
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
              text="Are you sure you want to delete this item?"
              onConfirm={handleDelete}
              onCancel={() => setIsConfirmationDialogOpen(false)}
              isOpen={isConfirmationDialogOpen}
              setIsOpen={setIsConfirmationDialogOpen}
            />
          )}
          {isSheetOpen && (
            <ReusableSheet
              title="Edit Company"
              description="Edit the company details"
              isOpen={isSheetOpen}
              setIsOpen={setIsSheetOpen}
            >
              <CompanyForm
                data={{
                  ...company,
                  capital_iq_id: company.capital_iq_id.toString(),
                }}
                setIsOpen={setIsSheetOpen}
              />
            </ReusableSheet>
          )}
        </>
      );
    },
  },
];
