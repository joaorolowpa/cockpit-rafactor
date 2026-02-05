import React from "react";

import { fetchDataFromInternalAPI } from "@/server-actions/internal-api/fetch-data";
import { fetchSingleCompanyFinancials } from "@/services/internal-api/v2-research-single-company-financials";

import FinancialTable from "./CompanyFinancialTable/FinancialTable";
import {
  addDataType,
  flattenTimeSeriesData,
  groupDataBySeriesCode,
} from "./CompanyFinancialTable/PrepareDataUtils";
import { tableColumns } from "./CompanyFinancialTable/TableColumns";
import CompanyColmeiaEvaluation from "../CompanyColmeia/CompanyColmeiaEvaluation";

interface FinancialContentProps {
  companyId: string;
}

export default async function FinancialContent({
  companyId,
}: FinancialContentProps) {
  type ColmeiaLatestResponse = {
    id: number;
    payload?: Record<string, { scores?: Record<string, number>; justification?: string }>;
    score_final_geral?: number;
    score_por_categoria?: Record<string, number>;
    updated_at?: string;
    created_at?: string;
  };

  const [financialsData, latestColmeia] = await Promise.all([
    Promise.all([
      fetchSingleCompanyFinancials(companyId, "raw"),
      fetchSingleCompanyFinancials(companyId, "growth"),
      fetchSingleCompanyFinancials(companyId, "metrics"),
    ]).catch((error) => {
      console.error("Failed to fetch financial data", error);
      return [[], [], []];
    }),
    fetchDataFromInternalAPI("/v1/colmeia/latest", {
      company_id: companyId,
    }).catch((error) => {
      console.error("Failed to fetch latest colmeia data", error);
      return null;
    }),
  ]);

  const [rawData, growthData, metricsData] = financialsData;
  const latestColmeiaData =
    latestColmeia && typeof latestColmeia === "object"
      ? (latestColmeia as ColmeiaLatestResponse)
      : null;

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
      <CompanyColmeiaEvaluation
        initialLatestData={latestColmeiaData}
      />
      <FinancialTable
        groupedData={groupedData}
        companyType={companyType}
        columns={tableColumns}
      />
    </div>
  );
}
