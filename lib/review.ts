import { prisma } from "@/lib/prisma";
import { todayUTC, dayKey } from "@/lib/utils";

export interface WeeklyReview {
  habitsThisWeek: number;
  habitsLastWeek: number;
  bestStreak: number;
  journalThisWeek: number;
  journalLastWeek: number;
  moodThisWeek: number | null;
  moodLastWeek: number | null;
  worstMoodDay: { date: string; score: number } | null;
  goalsMoved: number;
  focusMinutes: number;
  momentumDelta: number; // weekly momentum (0-100) vs prior week
}

const avg = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);

// Lightweight weekly "momentum": habit consistency + mood, windowed to a 7-day span.
function momentum(habitDoneDays: number, moodAvg: number): number {
  const habitPart = Math.min(100, (habitDoneDays / 7) * 100); // 0-100 (cap at daily)
  const moodPart = (moodAvg / 10) * 100;
  return Math.round(habitPart * 0.6 + moodPart * 0.4);
}

export async function getWeeklyReview(userId: string): Promise<WeeklyReview> {
  const today = todayUTC();
  const weekAgo = new Date(today);
  weekAgo.setUTCDate(today.getUTCDate() - 7);
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setUTCDate(today.getUTCDate() - 14);

  const [habitEntries, habits, journal, moods, goalsMoved, focus] = await Promise.all([
    prisma.habitEntry.findMany({
      where: { userId, completed: true, date: { gte: twoWeeksAgo } },
      select: { date: true },
    }),
    prisma.habit.findMany({ where: { userId }, select: { streak: true } }),
    prisma.journalEntry.findMany({
      where: { userId, createdAt: { gte: twoWeeksAgo } },
      select: { createdAt: true },
    }),
    prisma.moodLog.findMany({
      where: { userId, createdAt: { gte: twoWeeksAgo } },
      select: { score: true, createdAt: true },
    }),
    prisma.goal.count({
      where: { userId, status: "COMPLETED", updatedAt: { gte: weekAgo } },
    }),
    prisma.pomodoroSession.aggregate({
      where: { userId, completedAt: { gte: weekAgo } },
      _sum: { minutes: true },
    }),
  ]);

  const inThisWeek = (d: Date) => d >= weekAgo;
  const habitsThisWeek = habitEntries.filter((e) => inThisWeek(e.date)).length;
  const habitsLastWeek = habitEntries.length - habitsThisWeek;
  const journalThisWeek = journal.filter((j) => inThisWeek(j.createdAt)).length;
  const journalLastWeek = journal.length - journalThisWeek;

  const moodsThis = moods.filter((m) => inThisWeek(m.createdAt));
  const moodsLast = moods.filter((m) => !inThisWeek(m.createdAt));
  const moodThisWeek = moodsThis.length ? Math.round(avg(moodsThis.map((m) => m.score)) * 10) / 10 : null;
  const moodLastWeek = moodsLast.length ? Math.round(avg(moodsLast.map((m) => m.score)) * 10) / 10 : null;

  // worst mood day this week (lowest daily average)
  const byDay = new Map<string, { sum: number; n: number }>();
  for (const m of moodsThis) {
    const k = dayKey(m.createdAt);
    const c = byDay.get(k) ?? { sum: 0, n: 0 };
    c.sum += m.score;
    c.n += 1;
    byDay.set(k, c);
  }
  let worstMoodDay: WeeklyReview["worstMoodDay"] = null;
  for (const [k, v] of byDay) {
    const score = Math.round((v.sum / v.n) * 10) / 10;
    if (!worstMoodDay || score < worstMoodDay.score) worstMoodDay = { date: k, score };
  }

  const distinctDays = (es: { date: Date }[]) => new Set(es.map((e) => dayKey(e.date))).size;
  const thisDays = distinctDays(habitEntries.filter((e) => inThisWeek(e.date)));
  const lastDays = distinctDays(habitEntries.filter((e) => !inThisWeek(e.date)));
  const momentumDelta =
    momentum(thisDays, moodThisWeek ?? 0) - momentum(lastDays, moodLastWeek ?? 0);

  return {
    habitsThisWeek,
    habitsLastWeek,
    bestStreak: habits.reduce((m, h) => Math.max(m, h.streak), 0),
    journalThisWeek,
    journalLastWeek,
    moodThisWeek,
    moodLastWeek,
    worstMoodDay,
    goalsMoved,
    focusMinutes: focus._sum.minutes ?? 0,
    momentumDelta,
  };
}
