"use client";

import { FileText, Download, Sheet } from "lucide-react";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { downloadFileUsingNextAPI } from "@/services/nextjs-api/download-file-using-nextjs-api";
import { CompanyDocument } from "@/services/internal-api/companies/get-company-documents";
import { ExcelDocument } from "@/services/internal-api/companies/get-company-excel-documents";

type AllowedDocuments = CompanyDocument | ExcelDocument;

interface DownloadButtonsProps {
  thesis: AllowedDocuments[];
  excels: AllowedDocuments[];
  documents: AllowedDocuments[];
}

export function DownloadButtons({
  thesis,
  excels,
  documents,
}: DownloadButtonsProps) {
  const { data: session } = useSession();
  const { toast } = useToast();

  const hasThesis = thesis && thesis.length > 0;
  const hasExcels = excels && excels.length > 0;
  const hasDocuments = documents && documents.length > 0;

  // Get the most recent document from each category (sorted by created_at)
  const latestThesis = hasThesis
    ? [...thesis].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]
    : undefined;

  const latestExcel = hasExcels
    ? [...excels].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]
    : undefined;

  const latestDocument = hasDocuments
    ? [...documents].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]
    : undefined;

  const handleDownload = async (
    fileDocument: AllowedDocuments | undefined,
    label: string
  ) => {
    if (!fileDocument) {
      toast({
        title: "No file available",
        description: `No ${label} file found to download.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const endpoint = "/v1/files/download-file";
      const filePath =
        "file_path" in fileDocument ? (fileDocument as CompanyDocument).file_path : (fileDocument as ExcelDocument).datalake_filepath;

      const queryParams = {
        user_id: session?.user?.id || 1,
        datalake_filepath: filePath,
      };

      await downloadFileUsingNextAPI(endpoint, queryParams);
    } catch (error) {
      console.error(`Failed to download ${label}:`, error);
      toast({
        title: "Download failed",
        description: `Failed to download ${label}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleDownload(latestThesis, "Apresentação")}
        disabled={!hasThesis}
        className="gap-2"
      >
        <FileText className="h-4 w-4" />
        Thesis
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleDownload(latestExcel, "Relatório")}
        disabled={!hasExcels}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Models
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleDownload(latestDocument, "Planilha")}
        disabled={!hasDocuments}
        className="gap-2"
      >
        <Sheet className="h-4 w-4" />
        PDF
      </Button>
    </div>
  );
}
