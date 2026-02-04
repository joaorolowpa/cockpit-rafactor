"use client";

import React from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type HistoryRow = Record<string, unknown>;

export type ColumnDef<RowType extends HistoryRow = HistoryRow> = {
  label: string;
  value: keyof RowType & string;
  sortable?: boolean;
  headerClassName?: string;
  cellClassName?: string;
  render?: (value: RowType[keyof RowType], row: RowType) => React.ReactNode;
};

export default function CompanyColmeiaHistoryTable({
  columns,
  rows,
  sortKey,
  sortDirection,
  onSort,
  rowKey,
  pageSize,
  currentPage,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 50, 100, 200],
}: {
  columns: ColumnDef[];
  rows: HistoryRow[];
  sortKey: string;
  sortDirection: "asc" | "desc";
  onSort: (key: string) => void;
  rowKey?: (row: HistoryRow, index: number) => string;
  pageSize: number;
  currentPage: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}) {
  const pageStart = (currentPage - 1) * pageSize;
  const pageEnd = Math.min(pageStart + rows.length, totalItems);

  const handlePrevious = () => {
    onPageChange(Math.max(1, currentPage - 1));
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleFirst = () => {
    onPageChange(1);
  };

  const handleLast = () => {
    if (totalPages > 0) {
      onPageChange(totalPages);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => {
              if (!column.sortable) {
                return (
                  <TableHead
                    key={column.value}
                    className={column.headerClassName}
                  >
                    {column.label}
                  </TableHead>
                );
              }

              const icon =
                sortKey === column.value ? (
                  sortDirection === "asc" ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )
                ) : (
                  <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                );

              return (
                <TableHead
                  key={column.value}
                  className={column.headerClassName}
                >
                  <button
                    type="button"
                    className="inline-flex items-center gap-2"
                    onClick={() => onSort(column.value)}
                  >
                    {column.label}
                    {icon}
                  </button>
                </TableHead>
              );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={rowKey ? rowKey(row, index) : `row-${index}`}>
                {columns.map((column) => (
                  <TableCell
                    key={`${column.value}-${index}`}
                    className={column.cellClassName}
                  >
                    {column.render
                      ? column.render(row[column.value], row)
                      : (row[column.value] as React.ReactNode) ?? "-"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs text-muted-foreground">
          Showing {rows.length > 0 ? pageStart + 1 : 0}-{pageEnd} of {totalItems}
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Items per page
            <select
              className="rounded border bg-transparent px-2 py-1 text-xs"
              value={pageSize}
              onChange={(event) =>
                onPageSizeChange(Number.parseInt(event.target.value, 10))
              }
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {Math.max(1, totalPages)}
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
              onClick={handleFirst}
              disabled={currentPage === 1}
              aria-label="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
              onClick={handlePrevious}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
              onClick={handleNext}
              disabled={currentPage >= Math.max(1, totalPages)}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
              onClick={handleLast}
              disabled={currentPage >= Math.max(1, totalPages)}
              aria-label="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
