import { ChartNoAxesColumn, Table } from "lucide-react";
import { Metadata } from "next";

import { ReusableTabs } from "@/components/reusable/GeneralLayout/ReusableTabs";
import ReusableTopBar from "@/components/reusable/GeneralLayout/ReusableTopBar";
import { getPortfoliosAvailableDates } from "@/services/internal-api/portfolios/get-portfolios-available-dates";

import { WPALiquidCharts } from "./components/Charts/Liquid";
import { WPAIlliquidTables } from "./components/Tables/Illiquid";
import { WPALiquidTables } from "./components/Tables/Liquid";

export const metadata: Metadata = {
  title: "WPA NAV",
  description: "Initial implementation only with ACCOUNTING information",
};

export default async function Page() {
  const availableDates = await getPortfoliosAvailableDates();

  const tabsConfig = [
    {
      label: "Tables - Illiquid",
      value: "tables_illiquid",
      icon: <Table className="h-5 w-5" color="#217346" />,
      content: <WPAIlliquidTables />,
    },
    {
      label: "Charts - Liquid Assets",
      value: "chart_liquid",
      icon: <ChartNoAxesColumn className="h-5 w-5" color="#D17C19" />,
      content: <WPALiquidCharts availableDates={availableDates} />,
    },
    {
      label: "Tables - Liquid Assets",
      value: "tables_liquid",
      icon: <Table className="h-5 w-5" color="#2A579A" />,
      content: <WPALiquidTables availableDates={availableDates} />,
    },
  ];

  return (
    <div className="space-y-4 p-4">
      <ReusableTopBar
        displayTitle="WPA NAV"
        displayText="Initial implementation only with ACCOUNTING information"
      />
      <ReusableTabs tabsConfig={tabsConfig} parameter_name="selected_tab" />
    </div>
  );
}
