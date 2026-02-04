"use client";

import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Download, Eye, Trash2 } from "lucide-react";
import { useState } from "react";

import { ConfirmationDialog } from "@/components/reusable/GeneralLayout/ConfirmationDialog";
import { ReusableSheet } from "@/components/reusable/GeneralLayout/ReusableSheet";
import { Button } from "@/components/ui/button";
import { CompanyDocument } from "@/services/internal-api/companies/get-company-documents";
import { ExcelDocument } from "@/services/internal-api/companies/get-company-excel-documents";
import { getUsers } from "@/services/internal-api/users/get-users";

type AllowedDocuments = CompanyDocument | ExcelDocument;

interface SingleDocumentProps<T extends AllowedDocuments> {
  document: T;
  isMostRecent: boolean;
  actionButtons?: Array<"view" | "download" | "delete">;
  handleDownloadDocument?: (filePath: string) => void;
  handleDeleteDocument?: (documentId: string) => void;
}

export function SingleDocument<T extends AllowedDocuments>({
  document,
  isMostRecent,
  actionButtons = ["view", "download", "delete"],
  handleDownloadDocument,
  handleDeleteDocument,
}: SingleDocumentProps<T>) {
  const [openSheet, setIsOpenSheet] = useState(false);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await getUsers();
      return response;
    },
  });

  return (
    <>
      <div className="flex items-center justify-between gap-x-4 border-b px-6 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-x-3">
            <p className="text-sm font-semibold text-gray-900">
              {"date_reference" in document
                ? format(parseISO(document?.date_reference), "yyyy-MM-dd")
                : format(parseISO(document?.created_at), "yyyy-MM-dd")}
            </p>
            {isMostRecent && (
              <span className="mt-0.5 rounded-md bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                Most Recent
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-x-2 text-xs text-gray-500">
            <p>Created at {format(parseISO(document?.created_at), "PP")}</p>
            <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
              <circle r={1} cx={1} cy={1} />
            </svg>
            <p>
              Created by{" "}
              {users?.find((u) => u.id === document?.created_by)?.name}
            </p>
            {"datalake_filepath" in document && (
              <>
                {document.user_email && <p>{document.user_email}</p>}
                {document.user_name && <p>{document.user_name}</p>}
              </>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
          {actionButtons.includes("view") && (
            <Button
              variant="ghost"
              size="icon"
              className="p-2 hover:bg-gray-200"
              onClick={() => setIsOpenSheet(true)}
              title="View file"
            >
              <Eye className="h-5 w-5 text-blue-500" />
            </Button>
          )}
          {actionButtons.includes("download") && (
            <Button
              variant="ghost"
              size="icon"
              className="p-2 hover:bg-gray-200"
              onClick={() => {
                if ("datalake_filepath" in document) {
                  handleDownloadDocument?.(document.datalake_filepath);
                } else {
                  handleDownloadDocument?.(document.file_path);
                }
              }}
              title="Download file"
            >
              <Download className="h-5 w-5 text-green-600" />
            </Button>
          )}
          {actionButtons.includes("delete") && (
            <Button
              variant="ghost"
              size="icon"
              className="p-2 hover:bg-gray-200"
              onClick={() => setIsConfirmDeleteModalOpen(true)}
              title="Delete file"
            >
              <Trash2 className="h-5 w-5 text-red-500" />
            </Button>
          )}
        </div>
      </div>
      <ReusableSheet
        isOpen={openSheet}
        setIsOpen={setIsOpenSheet}
        title="Thesis Details"
        description="View the details of the thesis"
        variant="wide"
      >
        {"text_html" in document && (
          <div
            className="overflow-y-auto p-4"
            dangerouslySetInnerHTML={{ __html: document.text_html }}
          />
        )}
      </ReusableSheet>
      <ConfirmationDialog
        header="Confirm Deletion"
        text="Are you sure you want to delete this item?"
        onConfirm={() => handleDeleteDocument(document.id.toString())}
        onCancel={() => setIsConfirmDeleteModalOpen(false)}
        isOpen={isConfirmDeleteModalOpen}
        setIsOpen={setIsConfirmDeleteModalOpen}
      />
    </>
  );
}

