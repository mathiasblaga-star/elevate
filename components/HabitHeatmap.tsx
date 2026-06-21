import type { HeatmapDay } from "@/lib/heatmap";

// Monochrome intensity steps (white alpha) by completion count.
function level(count: number, max: number): string {
  if (count <= 0) return "rgba(255,255,255,0.04)";
  const t = max > 0 ? count / max : 0;
  if (t > 0.75) return "rgba(255,255,255,0.9)";
  if (t > 0.5) return "rgba(255,255,255,0.65)";
  if (t > 0.25) return "rgba(255,255,255,0.4)";
  return "rgba(255,255,255,0.2)";
}

/**
 * GitHub-style contribution grid. `days` should be oldest→newest and a multiple of 7
 * for clean columns (the route defaults to 133 = 19 weeks).
 */
export function HabitHeatmap({ days }: { days: HeatmapDay[] }) {
  const max = days.reduce((m, d) => Math.max(m, d.count), 0);
  return (
    <div className="overflow-x-auto">
      <div
        className="grid grid-flow-col gap-1"
        style={{ gridTemplateRows: "repeat(7, minmax(0, 1fr))" }}
      >
        {days.map((d) => (
          <div
            key={d.date}
            title={`${d.date}: ${d.count} completed`}
            className="h-3 w-3 rounded-[3px]"
            style={{ background: level(d.count, max) }}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-muted">
        <span>Less</span>
        {[0.04, 0.2, 0.4, 0.65, 0.9].map((a) => (
          <span
            key={a}
            className="h-3 w-3 rounded-[3px]"
            style={{ background: `rgba(255,255,255,${a})` }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
