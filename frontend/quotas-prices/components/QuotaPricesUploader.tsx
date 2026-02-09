"use client";

import FileUpload from "@/components/reusable/FileUploader";

export interface UploadedFile {
  file: File;
  name: string;
  size: number;
  type: string;
}

interface QuotaPricesUploaderProps {
  uploudedFiles: UploadedFile[];
  setUploudedFiles: (files: UploadedFile[]) => void;
}

export default function QuotaPricesUploader({
  uploudedFiles,
  setUploudedFiles,
}: QuotaPricesUploaderProps) {
  return (
    <FileUpload
      uploudedFiles={uploudedFiles}
      setUploudedFiles={setUploudedFiles}
      maxFiles={1}
      maxFilesPerUpload={1}
      multipleUpload={false}
      size="compact"
      acceptedFormats={["xlsx", "xls"]}
      acceptedMimeTypes={[
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ]}
    />
  );
}
