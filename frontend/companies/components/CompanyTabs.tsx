import { FileChartColumnIncreasing, Grid3X3 } from "lucide-react";

import { ReusableTabs } from "@/components/reusable/GeneralLayout/ReusableTabs";

import {
  ContentDocumentsData,
  ContentHoneyCombData,
  TimeSeries,
} from "../types";
import ContentDocuments from "./ContentDocuments";
import ContentFinancials from "./ContentFinancials";

interface CompanyTabsProps {
  financialsData: TimeSeries[];
  documentsData: ContentDocumentsData;
  honeyCombData: ContentHoneyCombData;
  companyId: string;
  userId: number | undefined;
  chartsData: { rawData: any[]; growthData: any[]; metricsData: any[] };
}

const TABS = {
  FINANCIALS: "financials",
  DOCUMENTS: "documents",
  OTHER: "other",
};

const CompanyTabs: React.FC<CompanyTabsProps> = ({
  documentsData,
  companyId,
  userId,
}) => {
  const tabsConfig = [
    {
      label: "Financials",
      value: TABS.FINANCIALS,
      icon: <Grid3X3 className="h-5 w-5" color="#217346" />,
      content: <ContentFinancials companyId={companyId} />,
    },
    {
      label: "Documents",
      value: TABS.DOCUMENTS,
      icon: <FileChartColumnIncreasing className="h-5 w-5" color="#2A579A" />,
      content: (
        <ContentDocuments
          companyId={companyId}
          DocumentsThesis={documentsData.DocumentsThesis || []}
          DocumentsNotes={documentsData.DocumentsNotes || []}
          DocumentsPDFs={documentsData.DocumentsPDFs || []}
          DocumentsFinancialModels={
            documentsData.DocumentsFinancialModels || []
          }
          userId={userId}
        />
      ),
    },
    {
      label: "Other",
      value: TABS.OTHER,
      content: <div>Other</div>,
      disabled: true,
    },
  ];

  return <ReusableTabs tabsConfig={tabsConfig} parameter_name="selected_tab" />;
};

export default CompanyTabs;
