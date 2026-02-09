"use client";
import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";

import { CockpitLongTable } from "@/components/reusable/CockpitLongTable/CockpitLongTable";
import { Button } from "@/components/ui/button";
import { Classifications } from "@/services/internal-api/assets/get-classifications";

interface AssetsClassificationTableProps {
  data: Classifications;
  tableColumns?: ColumnDef<any>[];
}

const FILTERED_COLUMNS = ["lote45_asset_type", "milestones_asset_type"];

export function generateColumns(data: Classifications) {
  if (!data) {
    return [];
  }

  return data.columns.map((column) => ({
    id: column,
    accessorKey: column,
    header: column,
  }));
}

export function generateRows(data: Classifications, columns: any[]) {
  if (!data) {
    return { rows: [], rowsWithNoClassification: [] };
  }

  const rowsWithNoClassification: any[] = [];

  const rows = data.data.map((row) => {
    const obj: Record<string, any> = {};
    columns.forEach((column, index) => {
      obj[column.id] = row[index];
    });

    if (obj.classification_id === null) {
      rowsWithNoClassification.push(obj);
    }

    return obj;
  });

  return { rows, rowsWithNoClassification };
}

export function generateFilterFields(data: Classifications) {
  return FILTERED_COLUMNS.map((column) => {
    const columnIndex = data.columns.indexOf(column);
    const uniqueValues = new Map<string, boolean>();

    data.data.forEach((row) => {
      const value = row[columnIndex] as string | null;
      if (value !== null) {
        uniqueValues.set(value, true);
      }
    });

    return {
      columnName: column,
      displayTitle: column.toUpperCase().replace(/_/g, " "),
      availableOptions: Array.from(uniqueValues.keys())
        .map((value) => ({ value, label: value }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    };
  });
}

export default function AssetsClassificationTable({
  data,
  tableColumns = [],
}: AssetsClassificationTableProps) {
  const [showUnclassified, setShowUnclassified] = useState(false);

  const columns = useMemo(() => generateColumns(data), [data]);
  const filterFields = useMemo(() => generateFilterFields(data), [data]);
  const { rows, rowsWithNoClassification } = useMemo(
    () => generateRows(data, columns),
    [data, columns],
  );

  const assetIdsWithNoClassification = useMemo(
    () => rowsWithNoClassification.map((item) => item.asset_id),
    [rowsWithNoClassification],
  );

  const filteredRows = useMemo(
    () => (showUnclassified ? rowsWithNoClassification : rows),
    [showUnclassified, rowsWithNoClassification, rows],
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {rowsWithNoClassification.length > 0 && (
        <div className="mb-4 rounded-md bg-yellow-50 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon
                aria-hidden="true"
                className="h-5 w-5 text-yellow-400"
              />
            </div>
            <div className="mt-3 sm:ml-3 sm:mt-0">
              <h3 className="text-sm font-medium text-yellow-800">
                Atenção necessária
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Existem {rowsWithNoClassification.length} itens sem
                  classificação. Os IDs dos ativos são:{" "}
                  {assetIdsWithNoClassification.join(", ")}.
                </p>
              </div>
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex flex-col sm:flex-row">
                  <Button
                    onClick={() => setShowUnclassified(true)}
                    size="sm"
                    className="mb-2 border-yellow-500 bg-transparent text-yellow-500 hover:bg-yellow-500 hover:text-white focus:ring-yellow-500 sm:mb-0 sm:mr-3"
                    variant="outline"
                  >
                    Mostrar apenas não classificados
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowUnclassified(false)}
                    className="border-yellow-500 bg-transparent text-yellow-500 hover:bg-yellow-500 hover:text-white focus:ring-yellow-500"
                    size="sm"
                  >
                    Mostrar todos os ativos
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <CockpitLongTable
        columns={tableColumns}
        data={filteredRows}
        includePagination={true}
        addRowNumber={false}
        filterFields={filterFields}
        searchableColumn="display_name"
        searchPlaceholder="Search by display name..."
        tableConfig={{
          isZebraStriped: true,
        }}
      />
    </div>
  );
}
