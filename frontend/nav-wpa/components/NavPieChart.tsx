"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { LatestAssetValue, formatCurrencyInMillions } from "../actions";

interface NavPieChartProps {
  data: LatestAssetValue[];
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

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const percentage = ((data.value / payload[0].payload.total) * 100).toFixed(
      1,
    );

    return (
      <div className="rounded border border-gray-200 bg-white p-3 shadow-lg">
        <p className="font-semibold text-gray-900">{data.displayName}</p>
        <p className="text-sm text-gray-600">
          Value: {formatCurrencyInMillions(data.value)}
        </p>
        <p className="text-sm text-gray-600">Percentage: {percentage}%</p>
      </div>
    );
  }
  return null;
};

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize="12"
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function NavPieChart({ data, height = 400 }: NavPieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        No data available for pie chart
      </div>
    );
  }

  const colors = generateColors(data.length);
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Add total to each data point for tooltip calculation
  const pieData = data.map((item) => ({
    ...item,
    total,
  }));

  return (
    <div className="w-full">
      <h3 className="mb-4 text-lg font-semibold">Current NAV Distribution</h3>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={Math.min(height * 0.35, 120)}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry) => (
              <span style={{ color: entry.color }}>
                {entry.payload.displayName}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
