"use client";
import { CockpitLongTable } from "@/components/reusable/CockpitLongTable/CockpitLongTable";
import { QuotaAcquisitionData } from "../../actions";
import { Button } from "@/components/ui/button";
import { Download, Copy, Check } from "lucide-react";
import { useState } from "react";
import { exportToExcel, ExcelLocale } from "@/utils/excelExport";

import { columns } from "./TableColumns";

interface QuotaAcquisitionTableProps {
  acquisitions: QuotaAcquisitionData[];
}

// Copy button component with 8 decimal precision
function CopyTableButton({
  acquisitions,
}: {
  acquisitions: QuotaAcquisitionData[];
}) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      // Define headers
      const headers = [
        "Date Reference",
        "Asset Name",
        "Quantity",
        "Unit Value",
        "Comment",
      ];
      const headerRow = headers.join("\t");

      const dataRows = acquisitions.map((acquisition) =>
        [
          acquisition.date_reference,
          acquisition.asset_name,
          acquisition.quantidade_cotas.toFixed(2), // 2 decimal places for quantity
          acquisition.valor_cota.toFixed(8), // 8 decimal places for unit value
          acquisition.comment || "",
        ].join("\t"),
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
  acquisitions,
}: {
  acquisitions: QuotaAcquisitionData[];
}) {
  const handleExcelExport = (locale: ExcelLocale) => {
    // Define the columns we want to export
    const exportColumns = [
      "date_reference",
      "asset_name",
      "quantidade_cotas",
      "valor_cota",
      "comment",
    ];

    // Custom formatters for different columns
    const formatters: Record<string, (value: any) => string> = {
      quantidade_cotas: (value: number) => {
        return locale === "BR"
          ? value.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : value.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
      },
      valor_cota: (value: number) => {
        return locale === "BR"
          ? value.toLocaleString("pt-BR", {
              minimumFractionDigits: 8,
              maximumFractionDigits: 8,
            })
          : value.toLocaleString("en-US", {
              minimumFractionDigits: 8,
              maximumFractionDigits: 8,
            });
      },
      comment: (value: any) => value || "",
    };

    exportToExcel(
      acquisitions,
      exportColumns,
      {
        filename: "wpa_quota_acquisition",
        sheetName: "WPA Quota Acquisition",
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

export default function QuotaAcquisitionTable({
  acquisitions,
}: QuotaAcquisitionTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">WPA Quota Acquisition Data</h3>
        <div className="flex items-center gap-2">
          <CopyTableButton acquisitions={acquisitions} />
          <ExcelExportButtons acquisitions={acquisitions} />
        </div>
      </div>

      <div>
        <CockpitLongTable
          columns={columns}
          data={acquisitions}
          searchableColumn="asset_name"
          searchPlaceholder="Search for an asset by name"
          includePagination
          tableConfig={{
            isZebraStriped: true,
          }}
        />
      </div>
    </div>
  );
}
