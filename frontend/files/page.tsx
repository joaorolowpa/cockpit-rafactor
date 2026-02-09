"use client";
import {
  Book,
  ChartCandlestick,
  FileClock,
  Info,
  Layers,
  LoaderCircle,
  DollarSign,
} from "lucide-react";
import { useState } from "react";

import FileUpload from "@/components/reusable/FileUploader";
import { ReusableTabs } from "@/components/reusable/GeneralLayout/ReusableTabs";
import ReusableTopBar from "@/components/reusable/GeneralLayout/ReusableTopBar";
import { Button } from "@/components/ui/button";
import { submitFormWithToast } from "@/modules/internal-api/submitFormWithToast";

export interface UploadedFile {
  file: File;
  name: string;
  size: number;
  type: string;
}

export default function Page() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploudedFiles, setUploudedFiles] = useState<UploadedFile[]>([]);

  const handleUpload = async () => {
    setIsProcessing(true);
    const formData = new FormData();

    uploudedFiles.forEach((file) => {
      formData.append("files", file.file);
    });

    let endpoint = "/v1/portfolios/lote45/load-overview/consolidated";

    const selectedTab = tabsConfig.find((tab) => tab.value === "all");

    if (selectedTab) {
      switch (selectedTab.value) {
        case "funds":
          endpoint = "/v1/portfolios/lote45/funds-trades";
          break;
        case "historical":
          endpoint = "/v1/portfolios/lote45/historical-funds-nav";
          break;
        case "historicalBook":
          endpoint = "/v1/portfolios/lote45/historical-book-performance";
          break;
        case "productClass":
          endpoint = "/v1/portfolios/lote45/product-class-info";
          break;
        case "quotaPrices":
          // Quota prices functionality moved to dedicated page
          endpoint = "/v1/quotas/prices/wpa/upload";
          break;
        default:
          break;
      }
    }

    await submitFormWithToast({
      endpoint,
      formData,
      pathToRevalidate: "/dashboard/backoffice/files",
      debug: true,
    });

    setIsProcessing(false);
    setUploudedFiles([]);
  };

  const tabsConfig = [
    {
      label: "All Trading Desks Overview",
      value: "all",
      icon: <Layers className="h-5 w-5" color="#217346" />,
      content: (
        <FileUpload
          namePrefix="AllTradingDesksOverView"
          uploudedFiles={uploudedFiles}
          setUploudedFiles={setUploudedFiles}
          maxFiles={10}
          maxFilesPerUpload={10}
          multipleUpload={true}
        />
      ),
    },
    {
      label: "Funds Trades",
      value: "funds",
      icon: <ChartCandlestick className="h-5 w-5" color="#2A579A" />,
      content: (
        <FileUpload
          namePrefix="FundsTrades"
          nameValidation={(name) => {
            const regex = /^FundsTrades-\d{8}-\d{8}\.(txt|csv)$/;
            return regex.test(name);
          }}
          uploudedFiles={uploudedFiles}
          setUploudedFiles={setUploudedFiles}
          maxFiles={10}
          maxFilesPerUpload={10}
          multipleUpload={true}
        />
      ),
    },
    {
      label: "Historical Funds NAV and Share",
      value: "historical",
      icon: <FileClock className="h-5 w-5" color="#D17C19" />,
      content: (
        <FileUpload
          namePrefix="HistoricalFundsNAVAndShare"
          nameValidation={(name) => {
            const regex =
              /^HistoricalFundsNAVAndShare-\d{2}[A-Z]{1}[a-z]{2}\d{4}-\d{2}[A-Z]{1}[a-z]{2}\d{4}\.(txt|csv)$/;

            return regex.test(name);
          }}
          uploudedFiles={uploudedFiles}
          setUploudedFiles={setUploudedFiles}
          maxFiles={10}
          maxFilesPerUpload={10}
          multipleUpload={true}
        />
      ),
    },
    {
      label: "Historical Book Performance",
      value: "historicalBook",
      icon: <Book className="h-5 w-5" color="#217346" />,
      content: (
        <FileUpload
          namePrefix="HistoricalBookPerformance"
          nameValidation={(name) => {
            const regex =
              /^HistoricalBookPerformance-\d{2}[A-Z]{1}[a-z]{2}\d{4}-\d{2}[A-Z]{1}[a-z]{2}\d{4}\.(txt|csv)$/;
            return regex.test(name);
          }}
          uploudedFiles={uploudedFiles}
          setUploudedFiles={setUploudedFiles}
          maxFiles={10}
          maxFilesPerUpload={10}
          multipleUpload={true}
        />
      ),
    },
    {
      label: "Product Class Products Info",
      value: "productClass",
      icon: <Info className="h-5 w-5" color="#2A579A" />,
      content: (
        <FileUpload
          namePrefix="ProductClassProductsInfo"
          nameValidation={(name) => {
            const regex =
              /^ProductClassProductsInfo-\d{2}[A-Z]{1}[a-z]{2}\d{4}\.(txt|csv)$/;
            return regex.test(name);
          }}
          uploudedFiles={uploudedFiles}
          setUploudedFiles={setUploudedFiles}
          maxFiles={10}
          maxFilesPerUpload={10}
          multipleUpload={true}
        />
      ),
    },
    {
      label: "Quota Prices",
      value: "quotaPrices",
      icon: <DollarSign className="h-5 w-5" color="#10B981" />,
      content: (
        <div className="py-8 text-center">
          <p className="mb-4 text-gray-500">
            Quota Prices functionality has been moved to a dedicated page.
          </p>
          <a
            href="/dashboard/backoffice/quotas-prices"
            className="text-blue-600 underline hover:text-blue-800"
          >
            Go to Quota Prices Page →
          </a>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4">
      <ReusableTopBar
        displayTitle="Files"
        displayText="Upload and manage files"
        sheetTitle="Upload Files"
        sheetDescription="Upload files to be processed"
        buttonComponent={
          <Button
            size="lg"
            variant="default"
            onClick={handleUpload}
            disabled={!uploudedFiles.length}
          >
            {isProcessing ? (
              <LoaderCircle className="mr-2 h-5 w-5 animate-spin duration-500" />
            ) : null}
            {isProcessing ? "Uploading..." : "Upload"}
          </Button>
        }
      />
      <ReusableTabs tabsConfig={tabsConfig} parameter_name="selected_tab" />
    </div>
  );
}
