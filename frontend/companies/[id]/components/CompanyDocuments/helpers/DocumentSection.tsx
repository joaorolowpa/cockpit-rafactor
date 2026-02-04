"use client";

import { ChevronDown, Download, Plus, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import CreateNewCompanyDocumentForm from "@/components/forms/companies/CreateNewCompanyDocumentForm";
import { ReusableSheet } from "@/components/reusable/GeneralLayout/ReusableSheet";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/reusable/GeneralLayout/ConfirmationDialog";
import { Table, TableCaption, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { format, parseISO } from "date-fns";
import { deleteDataWithToast } from "@/modules/internal-api/deleteDataWithToast";
import { CompanyDocument } from "@/services/internal-api/companies/get-company-documents";
import { ExcelDocument } from "@/services/internal-api/companies/get-company-excel-documents";
import { downloadFileUsingNextAPI } from "@/services/nextjs-api/download-file-using-nextjs-api";

import { newCompaniFormSettings } from "../CompanyDocuments";

type AllowedDocuments = CompanyDocument | ExcelDocument;
interface DocumentSectionProps<T extends AllowedDocuments> {
  companyId: string;
  documents: T[];
  createNewCompanyDocumentFormSettings?: {excles:newCompaniFormSettings, documents:newCompaniFormSettings, thesis:newCompaniFormSettings};
  title?: string;
  sheetTitle?: string;
  sheetDescription?: string;
  endpoint?: string;
  documentType?: "THESIS" | "INVESTMENT_CASE" | "EXCEL";
  actionButtons?: Array<"view" | "download" | "delete">;
  onRefresh?: () => void;
  loading?: boolean;
}

export function DocumentSection<T extends AllowedDocuments>({
  companyId,
  documents,
  createNewCompanyDocumentFormSettings,
  title,
  sheetTitle,
  sheetDescription,
  endpoint,
  documentType,
  actionButtons = ["view", "download", "delete"],
  onRefresh,
  loading = false,
}: DocumentSectionProps<T>) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [openSheet, setIsOpenSheet] = useState(false);
  const [sheetTitleDynamic, setSheetTitleDynamic] = useState("");
  const [sheetDescriptionDynamic, setSheetDescription] = useState("");
  const [documentTypeDynamic, setDocumentType] = useState<"THESIS" | "INVESTMENT_CASE" | "EXCEL">("EXCEL");
  const [endpointDynamic, setEndpoint] = useState("");
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [documentIdDelete, setDocumentIdDelete] = useState<number>()
  const [documentTypeDelete, setDocumentTypeDelete] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const notifyDocumentsUpdated = () => {
    if (typeof window === "undefined") {
      return;
    }

    window.dispatchEvent(
      new CustomEvent("company-documents-updated", {
        detail: { companyId },
      }),
    );
  };

  const handleRefresh = () => {
    onRefresh?.();
    notifyDocumentsUpdated();
  };


  const handleChangeSheet = (type:string) => {
    setIsOpenSheet((state) => !state);
    if (type === 'excles'){
      const excles = createNewCompanyDocumentFormSettings.excles
      setSheetTitleDynamic(excles.sheetTitle);
      setSheetDescription(excles.sheetDescription);
      setDocumentType(excles.documentType);
      setEndpoint(excles.endpoint);
    }
    if (type === 'documents'){
      const documents = createNewCompanyDocumentFormSettings.documents
      setSheetTitleDynamic(documents.sheetTitle);
      setSheetDescription(documents.sheetDescription);
      setDocumentType(documents.documentType);
      setEndpoint(documents.endpoint);
    }
    if (type === 'thesis'){
      const thesis = createNewCompanyDocumentFormSettings.thesis
      setSheetTitleDynamic(thesis.sheetTitle);
      setSheetDescription(thesis.sheetDescription);
      setDocumentType(thesis.documentType);
      setEndpoint(thesis.endpoint);
    }

  };

  if (!documents) {
    return null;
  }

  const handleDownloadDocument = async (filePath: string) => {
    const endpoint = "/v1/files/download-file";
    const queryParams = {
      user_id: session?.user?.id || 1, // Fallback to user 1 for local dev
      datalake_filepath: filePath,
    };

    setIsLoading(true);
    try {
      await downloadFileUsingNextAPI(endpoint, queryParams);
      // No need to refresh data after download - it's just a file download
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string, documentType: string) => {
    setIsLoading(true);
    let endPointPrepare = "";
    if (documentType === "Financial Models") {
      endPointPrepare = `/v1/companies/milestones-research/excel`;
    } else if (documentType === "Cases & Other" || documentType === "Investment Thesis") {
      endPointPrepare = `/v1/companies/milestones-research/document`;
    }

    try {
      await deleteDataWithToast({
        endpoint: `${endPointPrepare}/${documentId}`,
        debug: true,
        pathToRevalidate: `/dashboard/research-equities/companies`,
      });
    } catch (error) {
      console.error("Delete operation failed:", error);
    } finally {
      // Always refresh data after delete operation, similar to upload flow
      handleRefresh();
      setIsLoading(false);
    }
  };

  // Extrair os arrays de excels, documents e thesis do objeto documents
  const excels = Array.isArray((documents as any).excels) ? (documents as any).excels : [];
  const documentsArray = Array.isArray((documents as any).documents) ? (documents as any).documents : [];
  const thesis = Array.isArray((documents as any).thesis) ? (documents as any).thesis : [];

  // Ordenar cada array por created_at (mais recente primeiro)
  const sortedExcels = [...excels].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const sortedDocuments = [...documentsArray].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const sortedThesis = [...thesis].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Primeiro item mais recente de cada tipo; depois o restante em ordem temporal
  const orderedDocuments: (AllowedDocuments & { type: string })[] = [];

  if (sortedExcels[0]) {
    orderedDocuments.push({
      ...sortedExcels[0],
      type: "Financial Models",
    } as AllowedDocuments & { type: string });
  }
  if (sortedDocuments[0]) {
    orderedDocuments.push({
      ...sortedDocuments[0],
      type: "Cases & Other",
    } as AllowedDocuments & { type: string });
  }
  if (sortedThesis[0]) {
    orderedDocuments.push({
      ...sortedThesis[0],
      type: "Investment Thesis",
    } as AllowedDocuments & { type: string });
  }

  const remainingDocuments = [
    ...sortedExcels.slice(1).map((doc) => ({ ...doc, type: "Financial Models" })),
    ...sortedDocuments.slice(1).map((doc) => ({ ...doc, type: "Cases & Other" })),
    ...sortedThesis.slice(1).map((doc) => ({ ...doc, type: "Investment Thesis" })),
  ].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  ) as (AllowedDocuments & { type: string })[];

  orderedDocuments.push(...remainingDocuments);

  // Função auxiliar para extrair o nome do arquivo do caminho
  const getFileName = (document: AllowedDocuments): string => {
    if ("datalake_filepath" in document && document.datalake_filepath) {
      return document.datalake_filepath.split("/").pop() || "Unknown file";
    }
    if ("file_path" in document && document.file_path) {
      return document.file_path.split("/").pop() || "Unknown file";
    }
    return "Unknown file";
  };

  const getReferenceDateLabel = (document: AllowedDocuments): string => {
    if ("date_reference" in document && document.date_reference) {
      try {
        return format(parseISO(document.date_reference), "PP");
      } catch {
        // fall through to filename parsing
      }
    }

    const fileName = getFileName(document);
    const match = fileName.match(/date[_-]?ref=(\d{4}-\d{2}-\d{2})/i);
    if (!match) {
      return fileName;
    }

    try {
      return format(parseISO(match[1]), "PP");
    } catch {
      return fileName;
    }
  };

  // Função auxiliar para obter o caminho do arquivo
  const getFilePath = (document: AllowedDocuments): string => {
    if ("datalake_filepath" in document && document.datalake_filepath) {
      return document.datalake_filepath;
    }
    if ("file_path" in document && document.file_path) {
      return document.file_path;
    }
    return "";
  };

  const handelOpenDeleteModal = (documentId: number, documentType: string) => {
    setDocumentIdDelete(documentId);
    setDocumentTypeDelete(documentType);
    setIsConfirmDeleteModalOpen(true);
  }

  const handleUploadStateChange = (isUploading: boolean) => {
    setIsUploading(isUploading);
  }

  return (
    <>
      {(isLoading || isUploading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
          <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 shadow-lg">
            <Spinner size="md" className="text-primary" />
            <div className="text-sm font-medium text-gray-800">
              Processando...
            </div>
          </div>
        </div>
      )}
      <div>
        <Button
          variant="ghost"
          className="p-2 text-gray-500 hover:text-gray-700"
          onClick={() => handleChangeSheet('excles')}
        >
          <Plus size={20} /> Financial Models
        </Button>
        <Button
          variant="ghost"
          className="p-2 text-gray-500 hover:text-gray-700"
          onClick={() => handleChangeSheet('documents')}
        >
          <Plus size={20} /> Cases & Other
        </Button>
        <Button
          variant="ghost"
          className="p-2 text-gray-500 hover:text-gray-700"
          onClick={() => handleChangeSheet('thesis')}
        >
          <Plus size={20} /> Investment Thesis
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableCaption>A list of your recent documents.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Reference Date</TableHead>
              <TableHead className="w-[250px]">Type</TableHead>
              <TableHead className="w-[250px]">Created At</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(() => {
              const rows = [];
              if (orderedDocuments.length > 0) {
                orderedDocuments.forEach((document) => {
                  rows.push(
                    <TableRow key={document.id}>
                      <TableCell className="font-medium">{getReferenceDateLabel(document)}</TableCell>
                      <TableCell>{document.type}</TableCell>
                      <TableCell>
                        {format(parseISO(document.created_at), "PP")}
                      </TableCell>
                      <TableCell>
                        {"user_name" in document ? document.user_name : "Unknown"} - {"user_email" in document ? document.user_email : "Unknown"}
                      </TableCell>
                      <TableCell className="text-right">
                        {actionButtons.includes("download") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadDocument(getFilePath(document))}
                            title="Download file"
                          >
                            <Download className="h-5 w-5 text-green-600" />
                          </Button>
                        )}
                        {actionButtons.includes("delete") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handelOpenDeleteModal(document.id, document.type)}
                            title="Delete file"
                          >
                            <Trash2 className="h-5 w-5 text-red-600" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                });
              } else {
                rows.push(
                  <TableRow key="no-documents">
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No documents available.
                    </TableCell>
                  </TableRow>
                );
              }
              return rows;
            })()}
          </TableBody>
        </Table>
      </div>


      <ReusableSheet
        isOpen={openSheet}
        setIsOpen={setIsOpenSheet}
        title={sheetTitleDynamic}
        description={sheetDescriptionDynamic}
        variant="default"
      >
        <CreateNewCompanyDocumentForm
          companyId={Number(companyId)}
          documentType={documentTypeDynamic}
          setIsOpen={setIsOpenSheet}
          onUploadStateChange={handleUploadStateChange}
          onSuccess={handleRefresh}
        />
      </ReusableSheet>

      <ConfirmationDialog
        header="Confirm Deletion"
        text="Are you sure you want to delete this item?"
        onConfirm={() => handleDeleteDocument(documentIdDelete.toString(), documentTypeDelete)}
        onCancel={() => setIsConfirmDeleteModalOpen(false)}
        isOpen={isConfirmDeleteModalOpen}
        setIsOpen={setIsConfirmDeleteModalOpen}
      />
    </>
  );
}
