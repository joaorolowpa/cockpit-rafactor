"use client";

import { CompanyDocument } from "@/services/internal-api/companies/get-company-documents";

import { DocumentSection } from "./DocumentSection";

interface CompanyCaseProps {
  companyId: string;
  documents: CompanyDocument[];
}

export function CompanyCase({ companyId, documents }: CompanyCaseProps) {
  return (
    <DocumentSection
      companyId={companyId}
      title={`Cases & Other (${documents?.length || 0})`}
      documents={documents}
      documentType="INVESTMENT_CASE"
      sheetTitle="Upload Document"
      sheetDescription="Upload a document for the company."
      actionButtons={["download", "delete"]}
      endpoint="/v1/companies/milestones-research/document"
    />
  );
}

