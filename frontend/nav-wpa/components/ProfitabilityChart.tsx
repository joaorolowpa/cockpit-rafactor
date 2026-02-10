"use client";

import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { NavProfitabilityData, formatDate } from "../actions";

interface ProfitabilityChartProps {
  data: NavProfitabilityData[];
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded border border-gray-200 bg-white p-3 shadow-lg">
        <p className="font-semibold text-gray-900">{formatDate(label)}</p>
        {payload.map((entry: any, index: number) => {
          const formattedValue = entry.value.toFixed(4);
          return (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formattedValue}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

export default function ProfitabilityChart({
  data,
  height = 400,
}: ProfitabilityChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        No profitability data available
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="mb-4 text-lg font-semibold">NAV Index Chart</h3>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 20, left: 60, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="month_end"
            tickFormatter={formatDate}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            domain={[0, "dataMax"]}
            tickFormatter={(value) => value.toFixed(2)}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />

          {/* NAV Index - Line Chart */}
          <Line
            type="monotone"
            dataKey="nav_index"
            stroke="#82ca9d"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name="NAV Index"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
