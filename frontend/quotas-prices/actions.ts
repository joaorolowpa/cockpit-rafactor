import { fetchDataFromInternalAPI } from "@/server-actions/internal-api/fetch-data";
import { submitFormWithToast } from "@/modules/internal-api/submitFormWithToast";

// FUNCTION TO FETCH DATA

export interface QuotaPrice {
  id: number;
  portfolio_id: number;
  milestones_name: string;
  date_reference: string;
  price_quota: number;
  active: boolean | null;
}

export async function fetchQuotaPrices(debug?: boolean): Promise<QuotaPrice[]> {
  const endpoint = "/v1/portfolios-quotas-prices/prices";
  const cacheDurationInSeconds = 60; // Cache for 1 minute
  const data = await fetchDataFromInternalAPI(
    endpoint,
    {},
    debug,
    cacheDurationInSeconds,
  );
  return data;
}

// FUNCTION TO TRANSFORM DATA

export interface TransformedQuotaRow {
  date_reference: string;
  // Dynamic asset columns: asset_name -> quota (or null if missing for the date)
  [assetName: string]: string | number | null;
}

export interface CellStyle {
  isMissing: boolean;
  isFirstNonNull: boolean;
}

export interface TransformedQuotaRowWithStyles {
  date_reference: string;
  _cellStyles: { [assetName: string]: CellStyle };
  [assetName: string]:
    | string
    | number
    | null
    | { [assetName: string]: CellStyle };
}

export interface TransformedQuotaResult {
  columns: string[]; // ["date_reference", ...assetNames]
  rows: TransformedQuotaRowWithStyles[];
}

// Helper function to format numbers with 8 decimal places
function formatNumber(value: number | null): string {
  if (value === null || value === undefined) return "-";
  return value.toFixed(8);
}

export function transformQuotaPrices(
  data: QuotaPrice[],
): TransformedQuotaResult {
  if (!Array.isArray(data) || data.length === 0) {
    return { columns: ["date_reference"], rows: [] };
  }

  // Collect unique asset names and dates
  const assetNamesSet = new Set<string>();
  const dateToRowMap = new Map<string, TransformedQuotaRowWithStyles>();

  for (const item of data) {
    if (item.milestones_name) assetNamesSet.add(item.milestones_name);
    if (!dateToRowMap.has(item.date_reference)) {
      const newRow: TransformedQuotaRowWithStyles = {
        date_reference: item.date_reference,
        _cellStyles: {},
      };
      dateToRowMap.set(item.date_reference, newRow);
    }
  }

  const assetNames = Array.from(assetNamesSet).sort((a, b) =>
    a.localeCompare(b),
  );

  // Initialize all rows with nulls for each asset column
  dateToRowMap.forEach((row) => {
    for (const assetName of assetNames) {
      if (!(assetName in row)) row[assetName] = null;
      row._cellStyles[assetName] = {
        isMissing: false,
        isFirstNonNull: false,
      };
    }
  });

  // Fill values and track first non-null for each asset
  const firstNonNullFound = new Set<string>();
  for (const item of data) {
    const row = dateToRowMap.get(item.date_reference);
    if (!row) continue;
    const value =
      typeof item.price_quota === "number" ? item.price_quota : null;
    row[item.milestones_name] = value;

    // Track first non-null value for each asset
    if (value !== null && !firstNonNullFound.has(item.milestones_name)) {
      firstNonNullFound.add(item.milestones_name);
      row._cellStyles[item.milestones_name].isFirstNonNull = true;
    }
  }

  // Mark missing values
  dateToRowMap.forEach((row) => {
    // Mark missing values for each asset
    for (const assetName of assetNames) {
      if (row[assetName] === null) {
        row._cellStyles[assetName].isMissing = true;
      }
    }
  });

  // Sort rows by date (string compare works for ISO YYYY-MM-DD)
  const rows: TransformedQuotaRowWithStyles[] = [];
  dateToRowMap.forEach((row) => rows.push(row));
  rows.sort((a, b) => a.date_reference.localeCompare(b.date_reference));

  return { columns: ["date_reference", ...assetNames], rows };
}

// FUNCTION TO UPLOAD DATA

export interface UploadQuotaPricesOptions {
  formData: FormData;
  pathToRevalidate?: string;
  debug?: boolean;
}

export async function uploadQuotaPrices({
  formData,
  pathToRevalidate = "/dashboard/backoffice/quotas-prices",
  debug = false,
}: UploadQuotaPricesOptions): Promise<void> {
  await submitFormWithToast({
    endpoint: "/v1/portfolios-quotas-prices/upload-xlsx",
    formData,
    pathToRevalidate,
    debug,
    method: "POST",
  });
}
