"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export function MoodChart({
  data,
}: {
  data: { date: string; score: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="date"
          tick={{ fill: "#9CA3AF", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={[0, 10]}
          tick={{ fill: "#9CA3AF", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip
          contentStyle={{
            background: "#131929",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            color: "#F0EEF9",
          }}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#7C3AED"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "#8B5CF6" }}
          activeDot={{ r: 5 }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
