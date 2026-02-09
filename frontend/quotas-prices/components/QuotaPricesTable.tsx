"use client";

import { useEffect, useState } from "react";
import {
  fetchQuotaPrices,
  transformQuotaPrices,
  TransformedQuotaRowWithStyles,
} from "../actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoaderCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { exportToExcel, ExcelLocale } from "@/utils/excelExport";

// Helper function to format numbers with 8 decimal places
function formatNumber(value: number | null): string {
  if (value === null || value === undefined) return "-";
  return value.toFixed(8);
}

// Helper function to get cell background color based on styles
function getCellBackgroundColor(cellStyles: any): string {
  if (cellStyles.isMissing) return "bg-red-200";
  if (cellStyles.isFirstNonNull) return "bg-green-200";
  return "";
}

// Copy button component
function CopyTableButton({
  columns,
  rows,
}: {
  columns: string[];
  rows: TransformedQuotaRowWithStyles[];
}) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      // Create tab-separated data with proper 8 decimal formatting
      const headerRow = columns.join("\t");
      const dataRows = rows.map((row) =>
        columns
          .map((col) => {
            const value = row[col];
            if (
              value === null ||
              value === undefined ||
              typeof value === "object"
            )
              return "";

            // Format numbers with 8 decimal places for copy
            if (col !== "date_reference" && typeof value === "number") {
              return value.toFixed(8);
            }

            return String(value);
          })
          .join("\t"),
      );

      const csvContent = [headerRow, ...dataRows].join("\n");

      await navigator.clipboard.writeText(csvContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  return (
    <Button onClick={copyToClipboard} variant="outline" size="sm">
      {copied ? (
        <>
          <Check className="mr-2 h-4 w-4" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="mr-2 h-4 w-4" />
          Copy Table
        </>
      )}
    </Button>
  );
}

// Excel export buttons component
function ExcelExportButtons({
  columns,
  rows,
}: {
  columns: string[];
  rows: TransformedQuotaRowWithStyles[];
}) {
  const handleExcelExport = (locale: ExcelLocale) => {
    // Filter out the _cellStyles property from data
    const cleanData = rows.map((row) => {
      const { _cellStyles, ...cleanRow } = row;
      return cleanRow;
    });

    // Custom formatters for different columns
    const formatters: Record<string, (value: any) => string> = {};

    // Don't format the date_reference column
    columns.forEach((col) => {
      if (col !== "date_reference") {
        formatters[col] = (value: any) => {
          if (typeof value === "number") {
            return locale === "BR"
              ? value.toLocaleString("pt-BR", {
                  minimumFractionDigits: 8,
                  maximumFractionDigits: 8,
                })
              : value.toLocaleString("en-US", {
                  minimumFractionDigits: 8,
                  maximumFractionDigits: 8,
                });
          }
          return String(value || "");
        };
      }
    });

    exportToExcel(
      cleanData,
      columns,
      {
        filename: "quota_prices",
        sheetName: "Quota Prices",
        locale,
      },
      formatters,
    );
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => handleExcelExport("USA")}
        variant="outline"
        size="sm"
      >
        <Download className="mr-2 h-4 w-4" />
        Export Excel USA
      </Button>
      <Button
        onClick={() => handleExcelExport("BR")}
        variant="outline"
        size="sm"
      >
        <Download className="mr-2 h-4 w-4" />
        Export Excel BR
      </Button>
    </div>
  );
}

export default function QuotaPricesTable() {
  const [quotaPrices, setQuotaPrices] = useState<
    TransformedQuotaRowWithStyles[]
  >([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuotaPrices = async () => {
      try {
        setIsLoading(true);
        const data = await fetchQuotaPrices(true);
        const transformed = transformQuotaPrices(data);
        setQuotaPrices(transformed.rows);
        setColumns(transformed.columns);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load quota prices",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadQuotaPrices();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoaderCircle className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading quota prices...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-500">
        <span>Error: {error}</span>
      </div>
    );
  }

  if (quotaPrices.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500">
        <span>No quota prices found</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Quota Prices Data</h3>
        <div className="flex items-center gap-2">
          <CopyTableButton columns={columns} rows={quotaPrices} />
          <ExcelExportButtons columns={columns} rows={quotaPrices} />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 z-50 bg-white shadow-sm">
            <TableRow>
              {columns.map((col) => {
                const isDateColumn = col === "date_reference";
                return (
                  <TableHead
                    key={col}
                    className={`sticky top-0 bg-white ${isDateColumn ? "text-left" : "text-right"}`}
                  >
                    {col}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotaPrices.map((row, idx) => (
              <TableRow key={idx}>
                {columns.map((col) => {
                  const isDateColumn = col === "date_reference";
                  const cellStyles = row._cellStyles?.[col] || {};
                  const backgroundColor = getCellBackgroundColor(cellStyles);

                  return (
                    <TableCell
                      key={col}
                      className={`${backgroundColor} ${isDateColumn ? "font-mono" : "text-right"}`}
                    >
                      {isDateColumn
                        ? row[col]
                        : formatNumber(row[col] as number | null)}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
