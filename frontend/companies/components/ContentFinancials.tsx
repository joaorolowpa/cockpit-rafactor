import React from "react";

import { fetchSingleCompanyFinancials } from "@/services/internal-api/v2-research-single-company-financials";

import FinancialTable from "./CompanyFinancialTable/FinancialTable";
import {
  addDataType,
  flattenTimeSeriesData,
  groupDataBySeriesCode,
} from "./CompanyFinancialTable/PrepareDataUtils";
import { tableColumns } from "./CompanyFinancialTable/TableColumns";

interface FinancialContentProps {
  companyId: string;
}

export default async function FinancialContent({
  companyId,
}: FinancialContentProps) {
  const [rawData, growthData, metricsData] = await Promise.all([
    fetchSingleCompanyFinancials(companyId, "raw"),
    fetchSingleCompanyFinancials(companyId, "growth"),
    fetchSingleCompanyFinancials(companyId, "metrics"),
  ]).catch((error) => {
    console.error("Failed to fetch financial data", error);
    return [[], [], []];
  });

  const flattenedRawData = addDataType(
    flattenTimeSeriesData(rawData),
    "financials",
  );
  const flattenedGrowthData = addDataType(
    flattenTimeSeriesData(growthData),
    "growth",
  );
  const flattenedMetricsData = addDataType(
    flattenTimeSeriesData(metricsData),
    "metrics",
  );

  const unitedArray = [
    ...flattenedRawData,
    ...flattenedGrowthData,
    ...flattenedMetricsData,
  ];

  const groupedData = groupDataBySeriesCode(unitedArray);

  const companyType = "non-financials";

  return (
    <div className="flex flex-col space-y-3">
      <FinancialTable
        groupedData={groupedData}
        companyType={companyType}
        columns={tableColumns}
      />
    </div>
  );
}
