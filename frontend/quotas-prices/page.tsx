"use client";

import { useState } from "react";
import { LoaderCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReusableTopBar from "@/components/reusable/GeneralLayout/ReusableTopBar";
import QuotaPricesUploader, {
  UploadedFile,
} from "./components/QuotaPricesUploader";
import QuotaPricesTable from "./components/QuotaPricesTable";
import { uploadQuotaPrices } from "./actions";

export default function QuotaPricesPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploudedFiles, setUploudedFiles] = useState<UploadedFile[]>([]);

  const handleUpload = async () => {
    if (uploudedFiles.length === 0) return;

    setIsProcessing(true);
    const formData = new FormData();

    uploudedFiles.forEach((file) => {
      formData.append("file", file.file);
    });

    try {
      await uploadQuotaPrices({
        formData,
        pathToRevalidate: "/dashboard/backoffice/quotas-prices",
        debug: true,
      });
      setUploudedFiles([]);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // TODO: Download sample functionality - commented out for now, may be implemented later
  // const handleDownloadSample = () => {
  //   const url = `/api/download-file?endpoint=/v1/portfolios-quotas-prices/sample-xlsx`;
  //   window.open(url, "_blank");
  // };

  return (
    <div className="space-y-4 p-4">
      <ReusableTopBar
        displayTitle="Quota Prices"
        displayText="Upload and manage quota prices data"
        sheetTitle="Upload Quota Prices"
        sheetDescription="Upload files to be processed"
        buttonComponent={
          <Button
            size="lg"
            variant="default"
            onClick={handleUpload}
            disabled={!uploudedFiles.length || isProcessing}
          >
            {isProcessing ? (
              <LoaderCircle className="mr-2 h-5 w-5 animate-spin duration-500" />
            ) : null}
            {isProcessing ? "Uploading..." : "Upload"}
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Upload Quota Prices</CardTitle>
              {/* TODO: Download example button - commented out for now, may be implemented later */}
              {/* <button
                onClick={handleDownloadSample}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
              >
                <Download className="h-4 w-4" />
                Download Example
              </button> */}
            </div>
          </CardHeader>
          <CardContent>
            <QuotaPricesUploader
              uploudedFiles={uploudedFiles}
              setUploudedFiles={setUploudedFiles}
            />
          </CardContent>
        </Card>

        {/* Table Section */}
        <Card>
          <CardHeader>
            <CardTitle>Quota Prices Data</CardTitle>
          </CardHeader>
          <CardContent>
            <QuotaPricesTable />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
