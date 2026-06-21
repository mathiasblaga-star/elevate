import { prisma } from "@/lib/prisma";
import {
  lifeScoreBreakdown,
  normalizeWeights,
  type LifeScoreWeights,
} from "@/lib/lifeScore";
import { todayUTC, dayKey, currentStreak } from "@/lib/utils";

export interface DashboardStats {
  lifeScore: number;
  scoreBreakdown: LifeScoreWeights; // per-category normalised 0-100 (for radar)
  weights: LifeScoreWeights; // active weighting (fractions)
  habitCompletionRate: number; // 0-100
  activeGoals: number;
  todaysHabitsDone: number;
  todaysHabitsTotal: number;
  bestStreak: number;
  moodAvg7d: number; // 0-10
  journalStreak: number;
  moodSeries: { date: string; score: number }[]; // last 14 days
}

export interface MoodInsights {
  correlation: { habit: string; withAvg: number; withoutAvg: number; lift: number } | null;
  prediction: { estimate: number; reason: string } | null;
}

/**
 * Mood × habit correlation (which habit lifts mood most) + a next-day mood estimate
 * from the rolling trend. Pure computation — no AI.
 */
export async function getMoodInsights(userId: string): Promise<MoodInsights> {
  const since = todayUTC();
  since.setUTCDate(since.getUTCDate() - 60);

  const [moods, habits, entries] = await Promise.all([
    prisma.moodLog.findMany({
      where: { userId, createdAt: { gte: since } },
      select: { score: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.habit.findMany({ where: { userId }, select: { id: true, name: true } }),
    prisma.habitEntry.findMany({
      where: { userId, completed: true, date: { gte: since } },
      select: { habitId: true, date: true },
    }),
  ]);

  if (moods.length < 5) return { correlation: null, prediction: null };

  // average mood per day
  const moodByDay = new Map<string, { sum: number; n: number }>();
  for (const m of moods) {
    const k = dayKey(m.createdAt);
    const c = moodByDay.get(k) ?? { sum: 0, n: 0 };
    c.sum += m.score;
    c.n += 1;
    moodByDay.set(k, c);
  }
  const dayMood = new Map<string, number>();
  for (const [k, v] of moodByDay) dayMood.set(k, v.sum / v.n);

  // completed-day set per habit
  const habitDays = new Map<string, Set<string>>();
  for (const e of entries) {
    const set = habitDays.get(e.habitId) ?? new Set<string>();
    set.add(dayKey(e.date));
    habitDays.set(e.habitId, set);
  }

  let best: MoodInsights["correlation"] = null;
  for (const h of habits) {
    const days = habitDays.get(h.id);
    if (!days) continue;
    const withVals: number[] = [];
    const withoutVals: number[] = [];
    for (const [day, mood] of dayMood) {
      (days.has(day) ? withVals : withoutVals).push(mood);
    }
    if (withVals.length < 3 || withoutVals.length < 3) continue;
    const avg = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
    const withAvg = avg(withVals);
    const withoutAvg = avg(withoutVals);
    const lift = withAvg - withoutAvg;
    if (!best || lift > best.lift) {
      best = {
        habit: h.name,
        withAvg: Math.round(withAvg * 10) / 10,
        withoutAvg: Math.round(withoutAvg * 10) / 10,
        lift: Math.round(lift * 10) / 10,
      };
    }
  }

  // prediction: recent 7-day avg nudged by the trend vs the prior 7 days
  const scores = moods.map((m) => m.score);
  const last7 = scores.slice(-7);
  const prev7 = scores.slice(-14, -7);
  const mean = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
  const recent = mean(last7);
  const trend = prev7.length ? recent - mean(prev7) : 0;
  const estimate = Math.max(1, Math.min(10, Math.round((recent + trend * 0.5) * 10) / 10));
  const dir = trend > 0.3 ? "rising" : trend < -0.3 ? "dipping" : "steady";
  const reason =
    `Your 7-day average is ${Math.round(recent * 10) / 10}/10 and ${dir}` +
    (best && best.lift > 0.3
      ? `. Completing "${best.habit}" tends to lift your mood by ${best.lift}.`
      : ".");

  return { correlation: best, prediction: { estimate, reason } };
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const today = todayUTC();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setUTCDate(today.getUTCDate() - 7);
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setUTCDate(today.getUTCDate() - 13);

  const [habits, todaysEntries, goals, recentMoods, journalDates, user] =
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
      prisma.user.findUnique({ where: { id: userId }, select: { lifeScoreWeights: true } }),
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

  const weights = normalizeWeights(
    (user?.lifeScoreWeights as Partial<LifeScoreWeights> | null) ?? null
  );
  const breakdown = lifeScoreBreakdown(
    {
      habitCompletionRate,
      goalProgressAvg,
      moodAvg: moodAvg7d,
      journalStreak: jStreak,
    },
    weights
  );

  return {
    lifeScore: breakdown.total,
    scoreBreakdown: breakdown.categories,
    weights,
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
