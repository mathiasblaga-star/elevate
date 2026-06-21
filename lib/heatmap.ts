import { prisma } from "@/lib/prisma";
import { todayUTC, dayKey } from "@/lib/utils";

export interface HeatmapDay {
  date: string; // YYYY-MM-DD (UTC)
  count: number; // completed habit entries that day
}

/** Daily completed-habit-entry counts for the last `days` days (optionally one habit). */
export async function getHeatmap(
  userId: string,
  days = 133,
  habitId?: string
): Promise<HeatmapDay[]> {
  const start = todayUTC();
  start.setUTCDate(start.getUTCDate() - (days - 1));

  const entries = await prisma.habitEntry.findMany({
    where: {
      userId,
      completed: true,
      date: { gte: start },
      ...(habitId ? { habitId } : {}),
    },
    select: { date: true },
  });

  const counts = new Map<string, number>();
  for (const e of entries) {
    const k = dayKey(e.date);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }

  const out: HeatmapDay[] = [];
  const today = todayUTC();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    const k = dayKey(d);
    out.push({ date: k, count: counts.get(k) ?? 0 });
  }
  return out;
}
