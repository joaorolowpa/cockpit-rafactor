import ChartCard, {
  ChartConfig,
} from "@/components/reusable/CockpitCharts/ChartCard";
import { generateInitialSeriesConfig } from "@/components/reusable/CockpitCharts/functions/create-initial-series-config";
import { extractUniqueNonNullFields } from "@/components/reusable/CockpitCharts/functions/extract-unique-non-null-fields";
import { prepareGroupedChartData } from "@/utils/prepare-groupedchart-data";

const chartConfig: ChartConfig = {
  title: "WPA NAV - Initial implementation only with ACCOUNTING information",
  chart_type: "area-stacked",
  fill_method: "forward",
  interval: "weekly",
};

interface WPAIlliquidChartsProps {
  wpaAssets: any;
}

export function WPAIlliquidCharts({ wpaAssets }: WPAIlliquidChartsProps) {
  if (!wpaAssets) {
    return (
      <div className="flex h-96 items-center justify-center">
        No data available
      </div>
    );
  }

  const groupedChartData = prepareGroupedChartData(
    wpaAssets,
    "asset_type_name",
    "date_reference",
    "wpa_value_in_brl",
    "name",
  );

  const seriesNames = extractUniqueNonNullFields(groupedChartData, "name");

  const initialSeriesConfig = generateInitialSeriesConfig(seriesNames);

  if (!groupedChartData) {
    return (
      <div className="flex h-96 items-center justify-center">
        No data available
      </div>
    );
  }

  return (
    <ChartCard
      chartConfig={chartConfig}
      series={groupedChartData}
      initialSeriesConfig={initialSeriesConfig}
      cardHeight={600}
      enableMissingDates
    />
  );
}
