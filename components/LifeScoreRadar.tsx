"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

export function LifeScoreRadar({
  breakdown,
  weights,
}: {
  breakdown: { habits: number; goals: number; mood: number; journal: number };
  weights: { habits: number; goals: number; mood: number; journal: number };
}) {
  const pct = (n: number) => Math.round(n * 100);
  const data = [
    { dimension: `Habits ${pct(weights.habits)}%`, value: breakdown.habits },
    { dimension: `Goals ${pct(weights.goals)}%`, value: breakdown.goals },
    { dimension: `Mood ${pct(weights.mood)}%`, value: breakdown.mood },
    { dimension: `Journal ${pct(weights.journal)}%`, value: breakdown.journal },
  ];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="rgba(255,255,255,0.1)" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fill: "#9ca3af", fontSize: 11 }}
        />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Radar
          dataKey="value"
          stroke="#fafafa"
          strokeWidth={2}
          fill="#ffffff"
          fillOpacity={0.12}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
