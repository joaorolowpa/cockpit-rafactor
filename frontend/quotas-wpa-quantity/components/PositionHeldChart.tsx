"use client";

import { useEffect, useState } from "react";
import {
  getQuotaAcquisitionWPA,
  transformAcquisitionToPositionHeld,
  PositionHeldData,
} from "../actions";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { LoaderCircle, Copy, Check } from "lucide-react";

// Helper function to format numbers for display
function formatNumber(value: number): string {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + "M";
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + "K";
  }
  return value.toFixed(0);
}

// Helper function to format numbers for table display
function formatTableNumber(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

// Copy button component
function CopyTableButton({
  data,
  assetNames,
}: {
  data: PositionHeldData[];
  assetNames: string[];
}) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      if (data.length === 0) return;

      // Create header row
      const headers = ["Date Reference", ...assetNames];
      const headerRow = headers.join("\t");

      // Create data rows
      const dataRows = data.map((row) =>
        [
          row.date_reference,
          ...assetNames.map((asset) => formatTableNumber(row[asset] as number)),
        ].join("\t"),
      );

      const csvContent = [headerRow, ...dataRows].join("\n");
      await navigator.clipboard.writeText(csvContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  return (
    <Button onClick={copyToClipboard} variant="outline" size="sm">
      {copied ? (
        <>
          <Check className="mr-2 h-4 w-4" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="mr-2 h-4 w-4" />
          Copy Table
        </>
      )}
    </Button>
  );
}

// Custom tooltip component
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
        <p className="font-medium">{`Date: ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {`${entry.dataKey}: ${entry.value.toLocaleString("en-US", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function PositionHeldChart() {
  const [positionData, setPositionData] = useState<PositionHeldData[]>([]);
  const [assetNames, setAssetNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPositionData = async () => {
      try {
        setIsLoading(true);
        const acquisitionData = await getQuotaAcquisitionWPA(true);
        const transformedData =
          transformAcquisitionToPositionHeld(acquisitionData);

        setPositionData(transformedData);

        // Extract asset names (excluding date_reference)
        const assets = Object.keys(transformedData[0] || {}).filter(
          (key) => key !== "date_reference",
        );
        setAssetNames(assets);

        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load position data",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadPositionData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoaderCircle className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading position data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-500">
        <span>Error: {error}</span>
      </div>
    );
  }

  if (positionData.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500">
        <span>No position data found</span>
      </div>
    );
  }

  // Define colors for different assets
  const colors = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7300",
    "#00ff00",
    "#ff00ff",
    "#00ffff",
    "#ff0000",
    "#0000ff",
    "#ffff00",
  ];

  return (
    <div className="space-y-6">
      {/* Chart Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">WPA Position Held Over Time</h3>
          <div className="text-sm text-gray-500">
            {assetNames.length} assets tracked
          </div>
        </div>

        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={positionData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date_reference"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={formatNumber} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {assetNames.map((asset, index) => (
                <Line
                  key={asset}
                  type="monotone"
                  dataKey={asset}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={false}
                  name={asset}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="text-sm text-gray-500">
          <p>
            This chart shows the cumulative number of shares held for each WPA
            asset over time.
          </p>
          <p>
            Each line represents a different asset, and the values are
            cumulative from acquisition dates.
          </p>
        </div>
      </div>

      {/* Table Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Position Held Data</h3>
          <CopyTableButton data={positionData} assetNames={assetNames} />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader className="sticky top-0 z-50 bg-white shadow-sm">
              <TableRow>
                <TableHead className="text-left">Date Reference</TableHead>
                {assetNames.map((asset) => (
                  <TableHead key={asset} className="text-right">
                    {asset}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {positionData.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-mono">
                    {row.date_reference}
                  </TableCell>
                  {assetNames.map((asset) => (
                    <TableCell key={asset} className="text-right">
                      {formatTableNumber(row[asset] as number)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
