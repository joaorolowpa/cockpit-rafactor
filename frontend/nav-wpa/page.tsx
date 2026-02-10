"use client";

import { useState, useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import ReusableTopBar from "@/components/reusable/GeneralLayout/ReusableTopBar";
import { DatePickerWithPresets } from "@/components/reusable/DatePickerWithPresets";
import {
  fetchWpaPositions,
  fetchNavProfitabilityData,
  transformWpaPositionsForCharts,
  transformToPercentageData,
  consolidateStocks,
  getLatestValues,
  getHumanReadableName,
  applyHumanReadableNames,
  ProcessedChartData,
  ChartDataPoint,
  LatestAssetValue,
  NavProfitabilityData,
} from "./actions";
import NavLineChart from "./components/NavLineChart";
import NavStackedAreaChart from "./components/NavStackedAreaChart";
import NavPercentageAreaChart from "./components/NavPercentageAreaChart";
import NavPieChart from "./components/NavPieChart";
import ProfitabilityChart from "./components/ProfitabilityChart";
import ChartModal from "./components/ChartModal";
import ChartCard from "./components/ChartCard";

export default function NavWpaPage() {
  const [originalChartData, setOriginalChartData] =
    useState<ProcessedChartData>({
      data: [],
      assets: [],
      dateRange: { min: "", max: "" },
    });
  const [chartData, setChartData] = useState<ProcessedChartData>({
    data: [],
    assets: [],
    dateRange: { min: "", max: "" },
  });
  const [percentageData, setPercentageData] = useState<ChartDataPoint[]>([]);
  const [latestValues, setLatestValues] = useState<LatestAssetValue[]>([]);
  const [profitabilityData, setProfitabilityData] = useState<
    NavProfitabilityData[]
  >([]);
  const [consolidateStocksEnabled, setConsolidateStocksEnabled] =
    useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Effect to load data when selectedDate changes
  useEffect(() => {
    const loadWpaPositions = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Format date to YYYY-MM-DD for backend if provided
        const dateReference = selectedDate
          ? format(selectedDate, "yyyy-MM-dd")
          : undefined;

        // Load both position data and profitability data in parallel
        const [positionData, profitabilityData] = await Promise.all([
          fetchWpaPositions(true, dateReference),
          fetchNavProfitabilityData(true, dateReference),
        ]);

        // console.log("Fetched WPA Positions:", positionData);
        // console.log("Fetched NAV Profitability Data:", profitabilityData);

        const processedData = transformWpaPositionsForCharts(positionData);
        setOriginalChartData(processedData);
        setProfitabilityData(profitabilityData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load NAV data",
        );
        console.error("Error loading WPA positions:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadWpaPositions();
  }, [selectedDate]);

  // Effect to handle consolidation and data processing
  useEffect(() => {
    if (originalChartData.data.length === 0) return;

    console.log("Original Chart Data:", originalChartData);

    let processedData = originalChartData;

    // Apply consolidation if enabled
    if (consolidateStocksEnabled) {
      processedData = {
        ...originalChartData,
        ...consolidateStocks(originalChartData.data, originalChartData.assets),
      };
    }

    // Apply human-readable names to both data and assets
    const dataWithReadableNames = applyHumanReadableNames(
      processedData.data,
      processedData.assets,
    );

    setChartData({
      ...dataWithReadableNames,
      dateRange: processedData.dateRange,
    });

    // Generate percentage data using the original asset names (before human-readable transformation)
    const percentageChartData = transformToPercentageData(
      processedData.data,
      processedData.assets,
    );

    // Apply human-readable names to percentage data as well
    const percentageWithReadableNames = applyHumanReadableNames(
      percentageChartData,
      processedData.assets,
    );
    setPercentageData(percentageWithReadableNames.data);

    // Generate latest values for summary table (using original data before name transformation)
    const latest = getLatestValues(processedData.data, processedData.assets);
    setLatestValues(latest);
  }, [originalChartData, consolidateStocksEnabled]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <ReusableTopBar
          displayTitle="NAV Evolution"
          displayText="Loading NAV evolution data..."
        />
        <div className="flex items-center justify-center p-8">
          <LoaderCircle className="mr-2 h-8 w-8 animate-spin" />
          <span>Loading NAV data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 p-4">
        <ReusableTopBar
          displayTitle="NAV Evolution"
          displayText="Error loading NAV evolution data"
        />
        <div className="flex items-center justify-center p-8 text-red-500">
          <span>Error: {error}</span>
        </div>
      </div>
    );
  }

  const { data, assets, dateRange } = chartData;

  return (
    <div className="space-y-4 p-4">
      <ReusableTopBar
        displayTitle="NAV Evolution"
        displayText={`Displaying NAV evolution for ${assets.length} assets from ${dateRange.min} to ${dateRange.max} (values in BRL)`}
      />

      <div className="space-y-6">
        {/* Date Filter Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Filters & Display</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="w-full max-w-sm">
                <DatePickerWithPresets
                  value={selectedDate}
                  onDateChange={setSelectedDate}
                  label="Select Reference Date"
                  placeholder="Select a date to filter chart data and profitability data"
                />
                {selectedDate && (
                  <p className="mt-2 text-sm text-gray-600">
                    Using data up to: {format(selectedDate, "PPP")}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <div className="text-sm font-medium">Display Options</div>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="consolidate-stocks"
                    checked={consolidateStocksEnabled}
                    onCheckedChange={(checked) =>
                      setConsolidateStocksEnabled(checked as boolean)
                    }
                  />
                  <Label htmlFor="consolidate-stocks" className="text-sm">
                    Consolidate stocks (group individual stocks as "Stocks")
                  </Label>
                </div>
                <p className="text-xs text-gray-500">
                  When enabled, individual stock symbols (BBAS3, BBDC4, etc.)
                  are grouped under a single "Stocks" category for cleaner
                  visualization.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Latest Values Summary Table */}
        <Card>
          <CardHeader>
            <CardTitle>Current Portfolio Values (Latest Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead className="text-right">
                    Value (Millions BRL)
                  </TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestValues.map((item) => {
                  const total = latestValues.reduce(
                    (sum, val) => sum + val.value,
                    0,
                  );
                  const percentage = (item.value / total) * 100;
                  return (
                    <TableRow key={item.assetName}>
                      <TableCell className="font-medium">
                        {item.displayName}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.formattedValue}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {percentage.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="border-t-2 border-gray-400 bg-gray-50 font-bold">
                  <TableCell className="font-bold">Total</TableCell>
                  <TableCell className="text-right font-mono">
                    {(() => {
                      const total = latestValues.reduce(
                        (sum, val) => sum + val.value,
                        0,
                      );
                      const valueInMillions = total / 1000000;
                      return (
                        new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(valueInMillions) + "M"
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-right font-mono">100.0%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {/* NAV Pie Chart */}
          <ChartCard>
            <ChartModal
              title="Current NAV Distribution - Expanded View"
              children={<NavPieChart data={latestValues} height={320} />}
              expandedChildren={
                <NavPieChart data={latestValues} height={600} />
              }
            />
          </ChartCard>

          {/* NAV Index Chart */}
          <ChartCard>
            <ChartModal
              title="NAV Index Chart - Expanded View"
              children={
                <ProfitabilityChart data={profitabilityData} height={320} />
              }
              expandedChildren={
                <ProfitabilityChart data={profitabilityData} height={600} />
              }
            />
          </ChartCard>

          {/* Stacked Area Chart */}
          <ChartCard>
            <ChartModal
              title="NAV Evolution - Stacked Area Chart - Expanded View"
              children={
                <NavStackedAreaChart data={data} assets={assets} height={320} />
              }
              expandedChildren={
                <NavStackedAreaChart data={data} assets={assets} height={600} />
              }
            />
          </ChartCard>

          {/* Line Chart */}
          <ChartCard>
            <ChartModal
              title="NAV Evolution - Line Chart - Expanded View"
              children={
                <NavLineChart data={data} assets={assets} height={320} />
              }
              expandedChildren={
                <NavLineChart data={data} assets={assets} height={600} />
              }
            />
          </ChartCard>

          {/* 100% Stacked Area Chart */}
          <ChartCard>
            <ChartModal
              title="NAV Evolution - 100% Stacked Area Chart - Expanded View"
              children={
                <NavPercentageAreaChart
                  data={percentageData}
                  assets={assets}
                  height={320}
                />
              }
              expandedChildren={
                <NavPercentageAreaChart
                  data={percentageData}
                  assets={assets}
                  height={600}
                />
              }
            />
          </ChartCard>
        </div>

        {/* Summary Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {assets.length}
                </p>
                <p className="text-sm text-gray-600">Assets</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {data.length}
                </p>
                <p className="text-sm text-gray-600">Data Points</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">Date Range</p>
                <p className="text-sm text-gray-600">
                  {dateRange.min} to {dateRange.max}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Asset List */}
        <Card>
          <CardHeader>
            <CardTitle>Assets in Portfolio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
              {assets.map((asset, index) => (
                <div
                  key={asset}
                  className="flex items-center space-x-2 rounded bg-gray-50 p-2"
                >
                  <div
                    className="h-4 w-4 rounded"
                    style={{
                      backgroundColor: `hsl(${(index * 137.508) % 360}, 70%, 50%)`,
                    }}
                  />
                  <span className="text-sm font-medium">{asset}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
