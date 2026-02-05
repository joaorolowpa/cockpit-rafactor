"use client";

import { CompanyDocument } from "@/services/internal-api/companies/get-company-documents";

import { DocumentSection } from "./DocumentSection";

interface CompanyThesisProps {
  companyId: string;
  documents: CompanyDocument[];
}

export function CompanyThesis({ companyId, documents }: CompanyThesisProps) {
  return (
    <DocumentSection
      companyId={companyId}
      title={`Investment Thesis (${documents?.length || 0})`}
      documents={documents}
      documentType="THESIS"
      sheetTitle="Upload Document"
      sheetDescription="Upload a Microsoft Word document for the company."
      actionButtons={["view", "delete"]}
      endpoint="/v1/companies/milestones-research/document"
    />
  );
}

