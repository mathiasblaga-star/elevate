import { prisma } from "@/lib/prisma";
import { lifeScore } from "@/lib/lifeScore";
import { todayUTC, dayKey, currentStreak } from "@/lib/utils";

export interface DashboardStats {
  lifeScore: number;
  habitCompletionRate: number; // 0-100
  activeGoals: number;
  todaysHabitsDone: number;
  todaysHabitsTotal: number;
  bestStreak: number;
  moodAvg7d: number; // 0-10
  journalStreak: number;
  moodSeries: { date: string; score: number }[]; // last 14 days
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const today = todayUTC();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setUTCDate(today.getUTCDate() - 7);
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setUTCDate(today.getUTCDate() - 13);

  const [habits, todaysEntries, goals, recentMoods, journalDates] =
    await Promise.all([
      prisma.habit.findMany({ where: { userId }, select: { streak: true } }),
      prisma.habitEntry.count({ where: { userId, date: today, completed: true } }),
      prisma.goal.findMany({ where: { userId }, select: { progress: true, status: true } }),
      prisma.moodLog.findMany({
        where: { userId, createdAt: { gte: fourteenDaysAgo } },
        select: { score: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.journalEntry.findMany({
        where: { userId },
        select: { createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
    ]);

  const todaysHabitsTotal = habits.length;
  const todaysHabitsDone = todaysEntries;
  const habitCompletionRate = todaysHabitsTotal
    ? Math.round((todaysHabitsDone / todaysHabitsTotal) * 100)
    : 0;

  const activeGoals = goals.filter((g) => g.status !== "COMPLETED").length;
  const goalProgressAvg = goals.length
    ? goals.reduce((s, g) => s + g.progress, 0) / goals.length
    : 0;

  const moods7d = recentMoods.filter((m) => m.createdAt >= sevenDaysAgo);
  const moodAvg7d = moods7d.length
    ? moods7d.reduce((s, m) => s + m.score, 0) / moods7d.length
    : 0;

  const bestStreak = habits.reduce((m, h) => Math.max(m, h.streak), 0);
  const jStreak = currentStreak(journalDates.map((j) => j.createdAt));

  // bucket moods by day for the 14-day series
  const byDay = new Map<string, { sum: number; n: number }>();
  for (const m of recentMoods) {
    const k = dayKey(m.createdAt);
    const cur = byDay.get(k) ?? { sum: 0, n: 0 };
    cur.sum += m.score;
    cur.n += 1;
    byDay.set(k, cur);
  }
  const moodSeries: { date: string; score: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    const k = dayKey(d);
    const b = byDay.get(k);
    moodSeries.push({ date: k.slice(5), score: b ? Math.round((b.sum / b.n) * 10) / 10 : 0 });
  }

  const score = lifeScore({
    habitCompletionRate,
    goalProgressAvg,
    moodAvg: moodAvg7d,
    journalStreak: jStreak,
  });

  return {
    lifeScore: score,
    habitCompletionRate,
    activeGoals,
    todaysHabitsDone,
    todaysHabitsTotal,
    bestStreak,
    moodAvg7d: Math.round(moodAvg7d * 10) / 10,
    journalStreak: jStreak,
    moodSeries,
  };
}
