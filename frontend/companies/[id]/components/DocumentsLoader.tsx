import { getCompanyDocuments } from "@/services/internal-api/companies/get-company-documents";
import { getCompanyExcelDocuments } from "@/services/internal-api/companies/get-company-excel-documents";
import { ReusableTabs } from "@/components/reusable/GeneralLayout/ReusableTabs";
import { FileChartColumnIncreasing, Grid3X3 } from "lucide-react";
import ContentFinancials from "./CompanyFinancials/CompanyFinancials";
import { fetchDataFromInternalAPI } from "@/server-actions/internal-api/fetch-data";
import CompanyColmeiaHistory from "./CompanyColmeia/CompanyColmeiaHistory";

interface DocumentsLoaderProps {
  companyId: string;
  selectedTab?: string;
}

// Separate component for documents to allow independent loading
async function DocumentsContent({ companyId }: { companyId: string }) {
  const allDocuments = await getCompanyDocuments({
    company_id: companyId,
  });

  const thesis = allDocuments.filter(
    (document) => document.document_type === "THESIS",
  );

  const documents = allDocuments.filter(
    (document) => document.document_type !== "THESIS",
  );

  return { thesis, documents };
}

// Separate component for excels to allow independent loading
async function ExcelsContent({ companyId }: { companyId: string }) {
  const excels = await getCompanyExcelDocuments({
    company_id: companyId,
  });

  return excels;
}

// Main component that combines both
export async function DocumentsLoader({
  companyId,
  selectedTab,
}: DocumentsLoaderProps) {
  // Start both requests in parallel, but they can resolve independently
  const documentsPromise = DocumentsContent({ companyId });
  const excelsPromise = ExcelsContent({ companyId });
  const initialHistoryPromise =
    selectedTab === "colmeia"
      ? fetchDataFromInternalAPI("/v1/colmeia/history/summary", {
          company_id: companyId,
          limit: 50,
          offset: 0,
        }).catch((error) => {
          console.error("Failed to fetch initial colmeia history", error);
          return null;
        })
      : Promise.resolve(null);

  // Wait for both to complete
  const [{ thesis, documents }, excels, initialHistoryData] = await Promise.all([
    documentsPromise,
    excelsPromise,
    initialHistoryPromise,
  ]);

  const downloadData = {
    thesis,
    excels,
    documents,
  };

  const tabsConfig = [
    {
      label: "Financials",
      value: "financials",
      icon: <Grid3X3 className="h-5 w-5" color="#217346" />,
      content: <ContentFinancials companyId={companyId} />,
      companyId: companyId,
    },
    {
      label: "Documents",
      value: "documents",
      icon: <FileChartColumnIncreasing className="h-5 w-5" color="#2A579A" />,
      companyId: companyId,
      isDocuments: true,
    },
    {
      label: "Colmeia",
      value: "colmeia",
      icon: <FileChartColumnIncreasing className="h-5 w-5" color="#B8312F" />,
      content: <CompanyColmeiaHistory initialHistoryData={initialHistoryData} />,
      companyId: companyId,
    },
  ];

  return (
    <ReusableTabs
      tabsConfig={tabsConfig}
      parameter_name="selected_tab"
      initialTabValue={selectedTab}
      syncWithUrl={false}
      downloadData={downloadData}
    />
  );
}
