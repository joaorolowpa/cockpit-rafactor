// ./cockpit/src/app/(secured)/dashboard/accounting/assets-values/page.tsx

import { Metadata } from "next";

import { WpaAssetValueForm } from "@/components/forms/wpa/WpaAssetValueForm";
import { CockpitLongTable } from "@/components/reusable/CockpitLongTable/CockpitLongTable";
import ReusableTopBar from "@/components/reusable/GeneralLayout/ReusableTopBar";
import { auth } from "@/lib/auth";
import { getAssets } from "@/services/internal-api/wpa/get-assets";
import { getAssetsValues } from "@/services/internal-api/wpa/get-assets-values";

import { columns } from "./components/TableColumns";

export const metadata: Metadata = {
  title: "Assets Values",
  description: "Insert and manage asset values",
};

export default async function Page() {
  const assetValues = await getAssetsValues();
  const availableAssets = await getAssets();

  const session = await auth();
  const userId = session?.user?.id as number;

  const hiddenColumns = {
    asset_id: false,
    asset_created_at: false,
    asset_created_by: false,
    asset_created_by_email: false,
    asset_created_by_name: false,
    asset_is_active: false,
    asset_type_id: false,
    asset_type_description: false,
    asset_type_created_by: false,
    asset_value_created_by_email: false,
  };

  const filterFields = [
    {
      columnName: "asset_type_name",
      displayTitle: "Asset Type",
      availableOptions: Array.from(
        new Set(
          assetValues
            .map((item) => item.asset_type_name)
            .filter((item) => item !== null),
        ),
      )
        .map((item) => ({
          value: item as string,
          label: item as string,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    },
    {
      columnName: "asset_name",
      displayTitle: "Asset Name",
      availableOptions: Array.from(
        new Set(
          assetValues
            .map((item) => item.asset_name)
            .filter((item) => item !== null),
        ),
      )
        .map((item) => ({
          value: item as string,
          label: item as string,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    },
  ];

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-4 md:flex">
      <ReusableTopBar
        displayTitle="Accounting: Insert Asset Values"
        displayText="These are the assets created by the Accounting Department"
        sheetTitle="Add New Asset"
        sheetDescription="Fill out the form below to add a new asset."
        buttonTitle="Add Asset"
      >
        <WpaAssetValueForm userId={userId} availableAssets={availableAssets} />
      </ReusableTopBar>
      <CockpitLongTable
        data={assetValues}
        columns={columns}
        filterFields={filterFields}
        initialColumnVisibility={hiddenColumns}
        searchableColumn="asset_name"
        searchPlaceholder="Filter by Asset Name"
        includePagination
      />
    </div>
  );
}
