import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/api";

// PNG monthly report. `month` = YYYY-MM. Node runtime.
export async function GET(
  _req: Request,
  { params }: { params: { month: string } }
) {
  const userId = await getUserId();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const m = /^\d{4}-\d{2}$/.test(params.month) ? params.month : new Date().toISOString().slice(0, 7);
  const start = new Date(`${m}-01T00:00:00Z`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);

  const [habitDone, journalCount, moods, goalsDone, focus] = await Promise.all([
    prisma.habitEntry.count({ where: { userId, completed: true, date: { gte: start, lt: end } } }),
    prisma.journalEntry.count({ where: { userId, createdAt: { gte: start, lt: end } } }),
    prisma.moodLog.findMany({
      where: { userId, createdAt: { gte: start, lt: end } },
      select: { score: true },
    }),
    prisma.goal.count({ where: { userId, status: "COMPLETED", updatedAt: { gte: start, lt: end } } }),
    prisma.pomodoroSession.aggregate({
      where: { userId, completedAt: { gte: start, lt: end } },
      _sum: { minutes: true },
    }),
  ]);
  const moodAvg = moods.length
    ? Math.round((moods.reduce((s, x) => s + x.score, 0) / moods.length) * 10) / 10
    : 0;

  const monthLabel = start.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const stats: [string, string][] = [
    ["Habits completed", String(habitDone)],
    ["Journal entries", String(journalCount)],
    ["Avg mood", moods.length ? `${moodAvg}/10` : "—"],
    ["Goals completed", String(goalsDone)],
    ["Focus minutes", String(focus._sum.minutes ?? 0)],
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: 64,
          background: "#0a0a0a",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 26, color: "#9ca3af", letterSpacing: 4 }}>ELEVATE · MONTHLY REPORT</div>
        <div style={{ fontSize: 64, fontWeight: 700, marginTop: 8 }}>{monthLabel}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24, marginTop: 48 }}>
          {stats.map(([label, value]) => (
            <div
              key={label}
              style={{
                display: "flex",
                flexDirection: "column",
                width: 300,
                padding: 24,
                borderRadius: 16,
                background: "#1a1a1a",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div style={{ fontSize: 56, fontWeight: 700 }}>{value}</div>
              <div style={{ fontSize: 24, color: "#9ca3af", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
