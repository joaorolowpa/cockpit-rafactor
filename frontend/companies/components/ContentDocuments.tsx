import { SectionItem } from "../types";
import ExcelSection from "./helper/ExcelSection";
import PDFSection from "./helper/PDFSection";
import ThesisSection from "./helper/ThesisSection";

interface ContentDocumentsProps {
  companyId: string;
  userId: number | undefined;
  DocumentsThesis: SectionItem[];
  DocumentsNotes: SectionItem[];
  DocumentsPDFs: SectionItem[];
  DocumentsFinancialModels: SectionItem[];
}

const mapDocumentsToSectionItems = (
  data: any[],
  filePathKey: string = "file_path",
): SectionItem[] => {
  return data.map((item) => ({
    title: item.date_reference,
    createdBy: item.user_name,
    createdAt: item.created_at,
    filePath: item[filePathKey],
    id: item.id,
    userEmail: item.user_email,
    documentType: item.document_type,
  }));
};

export default function ContentDocuments({
  companyId,
  userId,
  DocumentsThesis,
  DocumentsFinancialModels,
  DocumentsPDFs,
  DocumentsNotes,
}: ContentDocumentsProps) {
  const formattedDocumentsThesis = mapDocumentsToSectionItems(
    DocumentsThesis,
    "file_path",
  );
  const formattedExcel = mapDocumentsToSectionItems(
    DocumentsFinancialModels,
    "datalake_filepath",
  );
  const formattedPDF = mapDocumentsToSectionItems(DocumentsPDFs);

  return (
    <>
      <ThesisSection
        title={`Investment Thesis (${DocumentsThesis.length})`}
        buttonLabel="Add Document"
        items={formattedDocumentsThesis}
        companyId={companyId}
        sheetTitle="Upload Document"
        sheetDescription="Upload a Microsoft Word document for the company."
        userId={userId}
      />
      <ExcelSection
        title={`Financial Models (${DocumentsFinancialModels.length})`}
        buttonLabel="Add Document"
        items={formattedExcel}
        companyId={companyId}
        sheetTitle="Upload Excel File"
        sheetDescription="Upload an Excel file for the company."
        userId={userId}
      />
      <PDFSection
        title={`Cases & Other (${DocumentsPDFs.length})`}
        buttonLabel="Add Document"
        items={formattedPDF}
        companyId={companyId}
        sheetTitle="Upload Document"
        sheetDescription="Upload a document for the company."
        userId={userId}
      />
      {/*
      Commented: If you want to add a collapsible section in the future, this code can be used.
      <CollapsibleSection
        title={`Investment Cases (${DocumentsPDFs.length})`}
        buttonLabel="Add Document"
        formType="CompanyCases"
        items={DocumentsPDFs}
        companyId={companyId}
        sheetTitle="Upload Document"
        sheetDescription="Upload a document for the company."
      />
      */}
    </>
  );
}
