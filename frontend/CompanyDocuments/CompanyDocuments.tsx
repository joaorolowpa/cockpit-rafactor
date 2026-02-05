"use client";

import { CompanyDocument, getCompanyDocuments } from "@/services/internal-api/companies/get-company-documents";
import { getCompanyExcelDocuments } from "@/services/internal-api/companies/get-company-excel-documents";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CompanyCase } from "./helpers/CompanyCase";
import { CompanyExcel } from "./helpers/CompanyExcel";
import { CompanyThesis } from "./helpers/CompanyThesis";
import { DocumentSection } from "./helpers/DocumentSection";
import { ExcelDocument } from "@/services/internal-api/companies/get-company-excel-documents";
import { Spinner } from "@/components/ui/spinner";

interface CompanyDocumentsProps {
  companyId: string;
  initialData?: {
    thesis?: CompanyDocument[];
    documents?: CompanyDocument[];
    excels?: ExcelDocument[];
  };
}

export interface newCompaniFormSettings {
  sheetTitle?: string;
  sheetDescription?: string;
  endpoint?: string;
  documentType?: "THESIS" | "INVESTMENT_CASE" | "EXCEL";
  actionButtons?: Array<"view" | "download" | "delete">;
}

export function CompanyDocuments({ companyId, initialData }: CompanyDocumentsProps) {
  // Initialize with server-side data if available to avoid initial fetch
  const [thesis, setThesis] = useState<CompanyDocument[]>(initialData?.thesis || []);
  const [filteredDocuments, setFilteredDocuments] = useState<CompanyDocument[]>(initialData?.documents || []);
  const [excels, setExcels] = useState<ExcelDocument[]>(initialData?.excels || []);
  const [loading, setLoading] = useState(!initialData); // Only show loading if no initial data
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all document types in parallel for better performance
      const [allDocuments, excelData] = await Promise.allSettled([
        getCompanyDocuments({ company_id: companyId }),
        getCompanyExcelDocuments({ company_id: companyId }).catch(() => []),
      ]);

      // Separate documents by type
      const documents = allDocuments.status === 'fulfilled' ? allDocuments.value : [];
      const excels = excelData.status === 'fulfilled' ? excelData.value : [];

      const thesis = documents.filter(doc => doc.document_type === "THESIS");
      const filtered = documents.filter(doc => doc.document_type !== "THESIS");

      setThesis(thesis);
      setFilteredDocuments(filtered);
      setExcels(excels);
    } catch (err) {
      console.error("Failed to fetch documents:", err);
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    // Only fetch if we don't have initial data
    if (!initialData) {
      fetchDocuments();
    }
  }, [initialData, fetchDocuments]);

  // Memoize arquivos object to avoid unnecessary re-renders
  const arquivos = useMemo(() => ({
    excels,
    documents: filteredDocuments,
    thesis,
  }), [excels, filteredDocuments, thesis]);

  // Memoize form settings to avoid recreating on every render
  const CreateNewCompanyDocumentFormSettings = useMemo(() => ({
    excles: {
      documentType: "EXCEL",
      sheetTitle: "Upload Excel File",
      sheetDescription: "Upload an Excel file for the company.",
      actionButtons: ["download", "delete"],
      endpoint: "/v1/companies/milestones-research/excel",
    } as newCompaniFormSettings,
    documents: {
      documentType: "INVESTMENT_CASE",
      sheetTitle: "Upload Document",
      sheetDescription: "Upload a document for the company.",
      actionButtons: ["download", "delete"],
      endpoint: "/v1/companies/milestones-research/document",
    } as newCompaniFormSettings,
    thesis: {
      documentType: "THESIS",
      sheetTitle: "Upload Document",
      sheetDescription: "Upload a Microsoft Word document for the company.",
      actionButtons: ["view", "delete"],
      endpoint: "/v1/companies/milestones-research/document",
    } as newCompaniFormSettings,
  }), []);

  if (error) {
    return <div className="mt-4 w-full text-red-600">{error}</div>;
  }

  return (
    <div className="mt-4 w-full space-y-4">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
          <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 shadow-lg">
            <Spinner size="md" className="text-primary" />
            <div className="text-sm font-medium text-gray-800">
              Loading documents...
            </div>
          </div>
        </div>
      )}
      <DocumentSection
        companyId={companyId}
        title={`Financial Models (${filteredDocuments?.length || 0})`}
        documents={arquivos}
        createNewCompanyDocumentFormSettings={CreateNewCompanyDocumentFormSettings}
        documentType="EXCEL"
        sheetTitle="Upload Excel File"
        sheetDescription="Upload an Excel file for the company."
        actionButtons={["download", "delete"]}
        endpoint="/v1/companies/milestones-research/excel"
        onRefresh={fetchDocuments}
        loading={loading}
      />
    </div>
  );
}

