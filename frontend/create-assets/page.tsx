// ./cockpit/src/app/(secured)/dashboard/accounting/assets/create-assets/page.tsx

import { Metadata } from "next";

import { WpaAssetForm } from "@/components/forms/wpa/WpaAssetForm";
import { CockpitLongTable } from "@/components/reusable/CockpitLongTable/CockpitLongTable";
import ReusableTopBar from "@/components/reusable/GeneralLayout/ReusableTopBar";
import { auth } from "@/lib/auth";
import { getAssets } from "@/services/internal-api/wpa/get-assets";

import { Asset, columns } from "./components/TableColumns";

export const metadata: Metadata = {
  title: "Create Assets",
  description: "Manage and create new assets",
};

export default async function Page() {
  const assets: Asset[] = await getAssets();
  const session = await auth();
  const userId = session?.user?.id as number;

  const assetTypeFilterOptions = [
    {
      columnName: "asset_type_description",
      displayTitle: "Type",
      availableOptions: Array.from(
        new Set(assets.map((asset) => asset.asset_type_description)),
      )
        .map((type) => ({
          value: type,
          label: type,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    },
  ];

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-4 md:flex">
      <ReusableTopBar
        displayTitle="Accounting: Create Assets"
        displayText="These are the assets created by the Accounting Department"
        sheetTitle="Add New Asset"
        sheetDescription="Fill out the form below to add a new asset."
        buttonTitle="Add Asset"
      >
        <WpaAssetForm userId={userId} />
      </ReusableTopBar>
      <CockpitLongTable
        data={assets}
        columns={columns}
        filterFields={assetTypeFilterOptions}
        searchableColumn="asset_name"
        searchPlaceholder="Filter by Asset Name"
        includePagination
      />
    </div>
  );
}
