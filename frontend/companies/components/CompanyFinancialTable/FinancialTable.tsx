"use client";

import React, { useState } from "react";

import ChartCard from "@/components/reusable/CockpitCharts/ChartCard";
import { generateInitialSeriesConfig } from "@/components/reusable/CockpitCharts/functions/create-initial-series-config";
import { CockpitWideTable } from "@/components/reusable/CockpitWideTable/CockpitWideTable";
import {
  AdditionalMenuSection,
  CockTableColumnDef,
  DefaultMenuOptions,
} from "@/components/reusable/CockpitWideTable/TableBlocks/types";
import MissingInformationWarning from "@/components/reusable/GeneralLayout/MissingInformationWarning";
import SectionCard from "@/components/reusable/GeneralLayout/SectionCard";
import { useToast } from "@/hooks/use-toast";

import { prepareTableData, transformRowToChartData } from "./PrepareDataUtils";

// Flattens data for table usage
const flattenData = (data) => {
  return data.map((item) => {
    const flattenedItem = {
      series_code: item.series_code,
      description: item.description,
      unit: item.unit || "",
      series_type: item.series_type || "",
      data_type: item.data_type,
    };
    item.values.forEach((valueItem) => {
      flattenedItem[valueItem.date_reference] = valueItem.value;
    });
    return flattenedItem;
  });
};

// Calculates left offsets for sticky columns
const calculateLeftOffsets = (columns, addCheckbox) => {
  return columns.map((col, index) => {
    const offsetAdjustment = addCheckbox ? 40 : 0;
    if (col.sticky) {
      return index === 0
        ? offsetAdjustment
        : offsetAdjustment +
            columns
              .slice(0, index)
              .reduce(
                (sum, col) => sum + parseInt(col.column_width || "100px", 10),
                0,
              );
    }
    return 0;
  });
};

// Processes chart data for chart components
const processChartData = (groupedData, seriesCodes) => {
  return groupedData
    .filter((item) => seriesCodes.includes(item.series_code))
    .flatMap((item) =>
      item.values.map((value) => ({
        date_reference: value.date_reference,
        name: value.date_reference,
        [item.description.replace(/\s+/g, "_")]: value.value,
      })),
    )
    .reduce((acc, curr) => {
      const existing = acc.find(
        (el) => el.date_reference === curr.date_reference,
      );
      if (existing) {
        Object.assign(existing, curr);
      } else {
        acc.push(curr);
      }
      return acc;
    }, []);
};

// Transforms series data into a table row
function transformSeriesToRow(series: any, sectionLabel?: string) {
  if (!series) return null;

  const { series_code, description, values, unit } = series;

  const transformedRow = {
    row_metadata: {
      row_style: "bg-blue-50 pl-4",
      row_type: "value",
      ...(sectionLabel ? { section_label: sectionLabel } : {}), // Adiciona sectionLabel se estiver presente
    },
    row_values: {
      display_name: description,
      item_code: series_code,
      unit,
      ...values.reduce((acc, { date_reference, value }) => {
        acc[new Date(date_reference).toISOString()] =
          value == null || value === 0 ? "-" : value;
        return acc;
      }, {}),
    },
  };

  return transformedRow;
}

const highlightedValues = [
  "Net Revenues",
  "Gross profit",
  "EBITDA",
  "EBIT",
  "Net Income",
  "Total Assets",
  "Total Current Assets",
  "Total Non-Current Assets",
  "Total Liabilities and Equity",
  "Total Current Liabilities",
  "Total Non-Current Liabilities",
  "Total Equity",
];

// FinancialTable Component
const FinancialTable = ({
  groupedData,
  columns,
  companyType,
  decimalPlaces = 2,
  divider = 1,
  addCheckbox = true,
  initialVariant = "concise",
}) => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [chartsData, setChartsData] = useState([]);

  if (!groupedData || groupedData.length === 0) {
    return (
      <MissingInformationWarning
        title="No Available Financial Data"
        message="Financial data has not been submitted for this company."
      />
    );
  }

  // Prepare table data
  const tableData = prepareTableData(groupedData, companyType);
  const marginsChartData = processChartData(groupedData, [
    "synthetic_gross_margin",
    "synthetic_ebit_margin",
    "synthetic_ebitda_margin",
  ]);
  const growthChartData = processChartData(groupedData, [
    "PCT_CHG_IS_NET_REVENUES",
    "PCT_CHG_IS_GROSS_PROFIT",
    "PCT_CHG_IS_EBITDA",
  ]);
  const leftOffsets = calculateLeftOffsets(columns, addCheckbox);

  // Handlers
  const handleSelectRow = (row, isSelected) => {
    const rowIdentifier = row.series_code;
    if (isSelected) {
      setSelectedRows((prev) => [...prev, row]);
    } else {
      setSelectedRows((prev) =>
        prev.filter((r) => r.series_code !== rowIdentifier),
      );
    }
  };

  const createChart = (chartType) => {
    const labelKey = "description";
    const transformedRows = selectedRows.map((row) =>
      transformRowToChartData(row, labelKey),
    );
    setChartsData((prevChartsData) => [
      ...prevChartsData,
      { chartType, data: transformedRows },
    ]);
  };

  // Table configuration
  const originalTableColumns: CockTableColumnDef[] = [
    {
      accessorKey: "display_name",
      header: "Series Name",
      text_position: "left",
      sticky: false,
      column_width: "200px",
    },
    {
      accessorKey: "unit",
      header: "Unit",
      text_position: "left",
      sticky: false,
      column_width: "100px",
    },
  ];

  const nonDateColumnKeys = ["display_name", "item_code", "unit"];
  const rows = tableData.flatMap((section) =>
    section.sectionData.map((row) =>
      transformSeriesToRow(row, section.sectionLabel),
    ),
  );

  const FundTableMenuOptions: DefaultMenuOptions = {
    grouping_period: "quarter",
    unit_scale: 1,
    includeMissingDates: true,
    thousandSeparator: ",",
    decimalSeparator: ".",
    decimalPlaces: 1,
    dateFormat: "yyyy-QQQ",
    emptyValueDisplay: "-",
  };

  return (
    <>
      {/* Chart Section */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {marginsChartData.length > 0 ? (
          <ChartCard
            chartConfig={{
              chart_type: "line",
              title: "Margins",
              unit_scale: "unit",
            }}
            series={marginsChartData}
            initialSeriesConfig={generateInitialSeriesConfig(
              marginsChartData[0],
            )}
          />
        ) : (
          <MissingInformationWarning
            title="No Margins Data"
            message="There is no margins data available for this company."
          />
        )}
        {growthChartData.length > 0 ? (
          <ChartCard
            chartConfig={{
              chart_type: "line",
              title: "Growth",
              unit_scale: "unit",
            }}
            series={growthChartData}
            initialSeriesConfig={generateInitialSeriesConfig(
              growthChartData[0],
            )}
          />
        ) : (
          <MissingInformationWarning
            title="No Growth Data"
            message="There is no growth data available for this company."
          />
        )}
      </div>

      {/* Table Section */}
      <div className="mt-4">
        {rows.length > 0 ? (
          <SectionCard variant="dashed">
            <CockpitWideTable
              RowsData={rows}
              originalColumns={originalTableColumns}
              nonDateColumnKeys={nonDateColumnKeys}
              addCheckbox={true}
              tableVariant="concise"
              menuOptions={FundTableMenuOptions}
              debug={false}
              showTopMenu={true}
              isGrouped={true}
              highlightedValues={highlightedValues}
              topMenuOptions={{
                showUnitScale: false,
              }}
            />
          </SectionCard>
        ) : (
          <MissingInformationWarning
            title="No Available Financial Data"
            message="Financial data has not been submitted for this company."
          />
        )}
      </div>
    </>
  );
};

export default FinancialTable;
