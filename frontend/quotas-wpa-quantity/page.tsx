import { BarChart3, TrendingUp } from "lucide-react";
import { Metadata } from "next";

import CreateQuotaAcquisitionForm from "@/components/forms/quotas/CreateQuotaAcquisitionForm";
import { ReusableTabs } from "@/components/reusable/GeneralLayout/ReusableTabs";
import ReusableTopBar from "@/components/reusable/GeneralLayout/ReusableTopBar";
import {
  getQuotaAcquisitionWPA,
  getWpaAssetsWithQuota,
  QuotaAcquisitionData,
  WpaAssetWithQuota,
} from "./actions";

import PositionHeldChart from "./components/PositionHeldChart";
import QuotaAcquisitionTable from "./components/QuotaAcquisitionTable";

export const metadata: Metadata = {
  title: "Quotas WPA Quantity",
  description: "Manage WPA quantity data and track position holdings.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [acquisitions, assets] = (await Promise.all([
    getQuotaAcquisitionWPA(),
    getWpaAssetsWithQuota(),
  ])) as [QuotaAcquisitionData[], WpaAssetWithQuota[]];

  const selectedTab = (await searchParams).selected_tab;

  const tabsConfig = [
    {
      label: "WPA Quota Acquisition",
      value: "quota_acquisition",
      icon: <TrendingUp className="h-5 w-5" color="#2A579A" />,
      content: <QuotaAcquisitionTable acquisitions={acquisitions} />,
    },
    {
      label: "WPA Position Held",
      value: "position_held",
      icon: <BarChart3 className="h-5 w-5" color="#217346" />,
      content: <PositionHeldChart />,
    },
  ];

  const topBarConfig = {
    title: "Quotas WPA Quantity",
    description: "Manage WPA quantity data and track position holdings.",
    ...(selectedTab === "quota_acquisition" || !selectedTab
      ? {
          sheetTitle: "Create Quota Acquisition",
          sheetDescription: "Add a new quota acquisition record",
          buttonTitle: "Add Acquisition",
        }
      : {}),
  };

  return (
    <div className="space-y-4 p-4">
      <ReusableTopBar
        displayTitle={topBarConfig.title}
        displayText={topBarConfig.description}
        sheetTitle={topBarConfig.sheetTitle}
        sheetDescription={topBarConfig.sheetDescription}
        buttonTitle={topBarConfig.buttonTitle}
      >
        {(selectedTab === "quota_acquisition" || !selectedTab) && (
          <CreateQuotaAcquisitionForm assets={assets} />
        )}
      </ReusableTopBar>
      <ReusableTabs tabsConfig={tabsConfig} parameter_name="selected_tab" />
    </div>
  );
}
