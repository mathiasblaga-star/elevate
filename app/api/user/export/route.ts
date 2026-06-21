import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId, unauthorized, tooManyRequests } from "@/lib/api";
import { rateLimit } from "@/lib/ratelimit";
import { dayKey } from "@/lib/utils";

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  // strict limit on full-data export
  const { success } = await rateLimit(`export:${userId}`);
  if (!success) return tooManyRequests();

  const format = new URL(req.url).searchParams.get("format") === "csv" ? "csv" : "json";

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      goals: { include: { milestones: true } },
      habits: true,
      habitEntries: true,
      journal: true,
      moods: true,
      pomodoros: true,
      badges: true,
      routines: true,
    },
  });
  if (!user) return unauthorized();

  // never export the password hash
  const safe: Record<string, unknown> = { ...user };
  delete safe.passwordHash;

  if (format === "json") {
    return new NextResponse(JSON.stringify(safe, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="elevate-export.json"',
      },
    });
  }

  // CSV = unified event log across journal / mood / habit completions
  const rows: string[][] = [["type", "date", "detail", "value"]];
  for (const j of user.journal)
    rows.push(["journal", j.createdAt.toISOString(), j.content.slice(0, 200), String(j.mood)]);
  for (const m of user.moods)
    rows.push(["mood", m.createdAt.toISOString(), m.note ?? "", String(m.score)]);
  for (const e of user.habitEntries)
    rows.push(["habit", dayKey(e.date), e.habitId, e.completed ? "1" : "0"]);
  for (const p of user.pomodoros)
    rows.push(["focus", p.completedAt.toISOString(), p.goalId ?? "", String(p.minutes)]);

  const csv = rows.map((r) => r.map(csvCell).join(",")).join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="elevate-export.csv"',
    },
  });
}
