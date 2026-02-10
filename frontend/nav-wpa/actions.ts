import { fetchDataFromInternalAPI } from "@/server-actions/internal-api/fetch-data";

// FUNCTION TO FETCH DATA

export interface WpaPosition {
  position_value_adj: number;
  asset_name: string;
  date_reference: string;
}

export async function fetchWpaPositions(
  debug?: boolean,
  dateReference?: string,
  consolidate: boolean = false,
): Promise<WpaPosition[]> {
  const endpoint = "/v1/wpa-positions/combined/positions";
  const queryParams: Record<string, string | boolean> = {
    date_type: "month",
    consolidate,
  };

  // Add date_reference to query params if provided
  if (dateReference) {
    queryParams.date_reference = dateReference;
  }

  const cacheDurationInSeconds = 60; // Cache for 1 minute
  const data = await fetchDataFromInternalAPI(
    endpoint,
    queryParams,
    debug,
    cacheDurationInSeconds,
  );
  return data;
}

export interface NavProfitabilityData {
  month_end: string;
  position_value: number;
  total_inflows: number;
  position_adj_for_inflows: number;
  nav_index: number;
  monthly_profitability: number | null;
}

export async function fetchNavProfitabilityData(
  debug?: boolean,
  dateReference?: string,
): Promise<NavProfitabilityData[]> {
  const endpoint = "/v1/wpa-positions/combined/nav-with-profitability";
  const queryParams: Record<string, string> = {};
  
  // Add date_reference to query params if provided
  if (dateReference) {
    queryParams.date_reference = dateReference;
  }
  
  const cacheDurationInSeconds = 60; // Cache for 1 minute
  const data = await fetchDataFromInternalAPI(
    endpoint,
    queryParams,
    debug,
    cacheDurationInSeconds,
  );
  return data;
}

// FUNCTION TO TRANSFORM DATA FOR CHARTS

export interface ChartDataPoint {
  date_reference: string;
  [assetName: string]: string | number;
}

export interface ProcessedChartData {
  data: ChartDataPoint[];
  assets: string[];
  dateRange: {
    min: string;
    max: string;
  };
}

export function transformWpaPositionsForCharts(
  data: WpaPosition[],
): ProcessedChartData {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      data: [],
      assets: [],
      dateRange: { min: "", max: "" },
    };
  }

  // Group data by date and collect unique asset names
  const dateToValuesMap = new Map<string, { [assetName: string]: number }>();
  const assetNamesSet = new Set<string>();

  for (const item of data) {
    if (item.asset_name) assetNamesSet.add(item.asset_name);

    if (!dateToValuesMap.has(item.date_reference)) {
      dateToValuesMap.set(item.date_reference, {});
    }

    const dateValues = dateToValuesMap.get(item.date_reference)!;
    dateValues[item.asset_name] = item.position_value_adj;
  }

  // Sort assets alphabetically for consistent ordering
  const assets = Array.from(assetNamesSet).sort((a, b) => a.localeCompare(b));

  // Convert to chart data format
  const chartData: ChartDataPoint[] = [];
  const sortedDates = Array.from(dateToValuesMap.keys()).sort();

  for (const date of sortedDates) {
    const dateValues = dateToValuesMap.get(date)!;
    const dataPoint: ChartDataPoint = {
      date_reference: date,
    };

    // Add each asset's value (or 0 if missing)
    for (const asset of assets) {
      dataPoint[asset] = dateValues[asset] || 0;
    }

    chartData.push(dataPoint);
  }

  // Calculate date range
  const dateRange = {
    min: sortedDates.length > 0 ? sortedDates[0] : "",
    max: sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : "",
  };

  return {
    data: chartData,
    assets,
    dateRange,
  };
}

// FUNCTION TO CALCULATE PERCENTAGE DATA FOR 100% STACKED AREA CHART

export function transformToPercentageData(
  data: ChartDataPoint[],
  assets: string[],
): ChartDataPoint[] {
  return data.map((point) => {
    const total = assets.reduce((sum, asset) => {
      const value = point[asset] as number;
      return sum + (value || 0);
    }, 0);

    if (total === 0) {
      // If total is 0, distribute equally or set all to 0
      const percentagePoint: ChartDataPoint = {
        date_reference: point.date_reference,
      };
      assets.forEach((asset) => {
        percentagePoint[asset] = 0;
      });
      return percentagePoint;
    }

    const percentagePoint: ChartDataPoint = {
      date_reference: point.date_reference,
    };

    assets.forEach((asset) => {
      const value = point[asset] as number;
      percentagePoint[asset] = ((value || 0) / total) * 100;
    });

    return percentagePoint;
  });
}

// UTILITY FUNCTIONS FOR FORMATTING AND PROCESSING

// Stock symbols that should be consolidated
const STOCK_SYMBOLS = [
  "BBAS3",
  "BBDC4",
  "BRFS3",
  "CLSC4",
  "CMIG3",
  "CMIG4",
  "CPFE3",
  "EGIE3",
  "ITUB4",
  "PETR4",
  "TRPL4",
  "USIM5",
  "VALE5",
];

// Human-readable name mappings
const ASSET_NAME_MAPPINGS: Record<string, string> = {
  SALDO_PARTICIPACAO_OXFORD_SA: "Oxford",
  "WPA_GLOBAL_(EST)": "WPA Global (Est)",
  WPA_I: "WPA I",
  WPA_II: "WPA II",
  WPA_III: "WPA III",
  WPA_INTERNATIONAL: "WPA International",
  WPA_IV: "WPA IV",
};

export function getHumanReadableName(assetName: string): string {
  return ASSET_NAME_MAPPINGS[assetName] || assetName;
}

export function isStockSymbol(assetName: string): boolean {
  return STOCK_SYMBOLS.includes(assetName);
}

export function consolidateStocks(
  data: ChartDataPoint[],
  assets: string[],
): { data: ChartDataPoint[]; assets: string[] } {
  const consolidatedData = data.map((point) => {
    const newPoint: ChartDataPoint = {
      date_reference: point.date_reference,
    };

    let stocksTotal = 0;

    // Process each asset
    assets.forEach((asset) => {
      if (isStockSymbol(asset)) {
        stocksTotal += (point[asset] as number) || 0;
      } else {
        newPoint[asset] = point[asset];
      }
    });

    // Add consolidated stocks value
    if (stocksTotal > 0) {
      newPoint["Stocks"] = stocksTotal;
    }

    return newPoint;
  });

  // Create new assets list with stocks consolidated
  const nonStockAssets = assets.filter((asset) => !isStockSymbol(asset));
  const hasStocks = assets.some((asset) => isStockSymbol(asset));
  const consolidatedAssets = hasStocks
    ? ["Stocks", ...nonStockAssets]
    : nonStockAssets;

  return {
    data: consolidatedData,
    assets: consolidatedAssets,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCurrencyInMillions(value: number): string {
  const valueInMillions = value / 1000000;
  return (
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valueInMillions) + "M"
  );
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
}

// Function to get latest values for summary table
export interface LatestAssetValue {
  assetName: string;
  displayName: string;
  value: number;
  formattedValue: string;
}

// Function to transform data with human-readable names
export function applyHumanReadableNames(
  data: ChartDataPoint[],
  assets: string[],
): { data: ChartDataPoint[]; assets: string[] } {
  const transformedData = data.map((point) => {
    const newPoint: ChartDataPoint = {
      date_reference: point.date_reference,
    };

    // Transform each asset key to human-readable name
    assets.forEach((asset) => {
      const humanReadableName = getHumanReadableName(asset);
      newPoint[humanReadableName] = point[asset];
    });

    return newPoint;
  });

  const transformedAssets = assets.map(getHumanReadableName);

  return {
    data: transformedData,
    assets: transformedAssets,
  };
}

export function getLatestValues(
  data: ChartDataPoint[],
  assets: string[],
): LatestAssetValue[] {
  if (!data || data.length === 0) return [];

  const latestDataPoint = data[data.length - 1];
  const latestValues: LatestAssetValue[] = [];

  assets.forEach((asset) => {
    const value = (latestDataPoint[asset] as number) || 0;
    if (value > 0) {
      latestValues.push({
        assetName: asset,
        displayName: getHumanReadableName(asset),
        value,
        formattedValue: formatCurrencyInMillions(value),
      });
    }
  });

  // Sort by value descending (largest to smallest)
  return latestValues.sort((a, b) => b.value - a.value);
}
