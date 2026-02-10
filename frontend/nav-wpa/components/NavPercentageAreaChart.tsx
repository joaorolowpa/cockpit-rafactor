"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartDataPoint, formatPercentage, formatDate } from "../actions";

interface NavPercentageAreaChartProps {
  data: ChartDataPoint[];
  assets: string[];
  height?: number;
}

// Generate distinct colors for each asset
const generateColors = (count: number): string[] => {
  const colors = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7c7c",
    "#8dd1e1",
    "#d084d0",
    "#ffb347",
    "#87ceeb",
    "#dda0dd",
    "#98fb98",
    "#f0e68c",
    "#ff6347",
    "#40e0d0",
    "#ee82ee",
    "#90ee90",
  ];

  // If we need more colors than predefined, generate them
  if (count > colors.length) {
    for (let i = colors.length; i < count; i++) {
      const hue = (i * 137.508) % 360; // Golden angle approximation
      colors.push(`hsl(${hue}, 70%, 50%)`);
    }
  }

  return colors.slice(0, count);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded border border-gray-200 bg-white p-3 shadow-lg">
        <p className="font-semibold text-gray-900">{formatDate(label)}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.dataKey}: {formatPercentage(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function NavPercentageAreaChart({
  data,
  assets,
  height = 400,
}: NavPercentageAreaChartProps) {
  const colors = generateColors(assets.length);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        No data available for percentage area chart
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="mb-4 text-lg font-semibold">
        NAV Evolution - 100% Stacked Area Chart (Percentage)
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{ top: 20, right: 20, left: 50, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date_reference"
            tickFormatter={formatDate}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tickFormatter={(value) => `${Math.round(value)}%`}
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            width={45}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {assets.map((asset, index) => (
            <Area
              key={asset}
              type="monotone"
              dataKey={asset}
              stackId="1"
              stroke={colors[index]}
              fill={colors[index]}
              fillOpacity={0.6}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
