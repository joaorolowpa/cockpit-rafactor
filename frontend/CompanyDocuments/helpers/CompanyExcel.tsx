"use client";

import { ExcelDocument } from "@/services/internal-api/companies/get-company-excel-documents";

import { DocumentSection } from "./DocumentSection";

interface CompanyExcelProps {
  companyId: string;
  documents: ExcelDocument[];
}

export function CompanyExcel({ companyId, documents }: CompanyExcelProps) {
  return (
    <DocumentSection
      companyId={companyId}
      title={`Financial Models (${documents?.length || 0})`}
      documents={documents}
      documentType="EXCEL"
      sheetTitle="Upload Excel File"
      sheetDescription="Upload an Excel file for the company."
      actionButtons={["download", "delete"]}
      endpoint="/v1/companies/milestones-research/excel"
    />
  );
}

