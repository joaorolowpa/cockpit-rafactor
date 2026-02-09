import { fetchDataFromInternalAPI } from "@/server-actions/internal-api/fetch-data";
import { submitFormWithToast } from "@/modules/internal-api/submitFormWithToast";
import { deleteDataWithToast } from "@/modules/internal-api/deleteDataWithToast";

// FUNCTIONS TO FETCH AND TRANSFORM DATA

export interface QuotaAcquisitionData {
  quota_acquisition_id: number;
  wpa_asset_id: number;
  asset_name: string;
  date_reference: string;
  quantidade_cotas: number;
  valor_cota: number;
  comment: string;
}

export interface PositionHeldData {
  date_reference: string;
  [asset_name: string]: string | number;
}

export interface WpaAsset {
  id: number;
  wpa_asset_type_id: number;
  name: string;
  description: string;
  created_at: string;
  created_by: number;
  is_active: boolean;
  include_in_nav: boolean;
  has_quota_price: boolean;
}

export interface WpaAssetWithQuota {
  id: number;
  name: string;
}

export interface CreateQuotaAcquisitionData {
  wpa_asset_id: number;
  date_reference: string;
  quantidade_cotas: number;
  valor_cota: number;
  comment: string;
}

// API FUNTIONS

// #### FUNCTION 1: Fetch Quota Acquisition Data
export async function getQuotaAcquisitionWPA(
  debug?: boolean,
): Promise<QuotaAcquisitionData[]> {
  const endpoint = "/v1/quotas/acquisition/wpa";
  const cacheDurationInSeconds = 60; // Cache for 1 minute
  const data = await fetchDataFromInternalAPI(
    endpoint,
    {},
    debug,
    cacheDurationInSeconds,
  );
  return data;
}

// #### FUNCTION 2: Fetch WPA Assets with Quota
export async function getWpaAssetsWithQuota(
  debug?: boolean,
): Promise<WpaAssetWithQuota[]> {
  const endpoint = "/v1/quotas/acquisition/assets-with-quota";
  const cacheDurationInSeconds = 300; // Cache for 5 minutes
  const data = await fetchDataFromInternalAPI(
    endpoint,
    {},
    debug,
    cacheDurationInSeconds,
  );
  return data;
}

// #### FUNCTION 3: Create Quota Acquisition
export interface CreateQuotaAcquisitionOptions {
  data: CreateQuotaAcquisitionData;
  pathToRevalidate?: string;
  debug?: boolean;
}

export async function createQuotaAcquisition({
  data,
  pathToRevalidate = "/dashboard/backoffice/quotas-wpa-quantity",
  debug = false,
}: CreateQuotaAcquisitionOptions): Promise<void> {
  const formData = new FormData();
  formData.append("wpa_asset_id", data.wpa_asset_id.toString());
  formData.append("date_reference", data.date_reference);
  formData.append("quantidade_cotas", data.quantidade_cotas.toString());
  formData.append("valor_cota", data.valor_cota.toString());
  formData.append("comment", data.comment);

  // console.log("formData", formData);

  await submitFormWithToast({
    endpoint: "/v1/quotas/acquisition/wpa",
    formData,
    pathToRevalidate,
    debug,
    method: "POST",
  });
}

// #### FUNCTION 4: Delete Quota Acquisition
export interface DeleteQuotaAcquisitionOptions {
  acquisitionId: number;
  pathToRevalidate?: string;
  debug?: boolean;
}

export async function deleteQuotaAcquisition({
  acquisitionId,
  pathToRevalidate = "/dashboard/backoffice/quotas-wpa-quantity",
  debug = false,
}: DeleteQuotaAcquisitionOptions): Promise<void> {
  await deleteDataWithToast({
    endpoint: `/v1/quotas/acquisition/wpa/${acquisitionId}`,
    pathToRevalidate,
    debug,
  });
}

// TRANSFORM FUNCTIONS

// #### FUNCTION 5: Transform Acquisition Data to Position Held Data
export function transformAcquisitionToPositionHeld(
  acquisitionData: QuotaAcquisitionData[],
): PositionHeldData[] {
  // Get all unique asset names
  const assetNames = Array.from(
    new Set(acquisitionData.map((item) => item.asset_name)),
  );

  // Get all unique dates and create a complete date range
  const allDates = Array.from(
    new Set(acquisitionData.map((item) => item.date_reference)),
  );
  const sortedDates = allDates.sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  );

  // Create a map of cumulative positions by date and asset
  const cumulativePositions = new Map<string, Map<string, number>>();

  // Initialize all dates with zero positions
  sortedDates.forEach((date) => {
    cumulativePositions.set(date, new Map());
    assetNames.forEach((asset) => {
      cumulativePositions.get(date)!.set(asset, 0);
    });
  });

  // Calculate cumulative positions
  acquisitionData.forEach((acquisition) => {
    const date = acquisition.date_reference;
    const asset = acquisition.asset_name;
    const quantity = acquisition.quantidade_cotas;

    // Add to cumulative position for this date and all future dates
    sortedDates.forEach((sortedDate) => {
      if (new Date(sortedDate) >= new Date(date)) {
        const currentPosition =
          cumulativePositions.get(sortedDate)!.get(asset) || 0;
        cumulativePositions
          .get(sortedDate)!
          .set(asset, currentPosition + quantity);
      }
    });
  });

  // Convert to array format
  const result: PositionHeldData[] = sortedDates.map((date) => {
    const row: PositionHeldData = { date_reference: date };
    assetNames.forEach((asset) => {
      row[asset] = cumulativePositions.get(date)!.get(asset) || 0;
    });
    return row;
  });

  return result;
}
