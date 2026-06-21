import { prisma } from "@/lib/prisma";

export type PublicStats = {
  habitsTracked: number;
  goalsCompleted: number;
  entriesLogged: number;
  activeUsers: number;
};

// Real, DB-computed aggregates for the public landing page. No auth, no user data exposed —
// only counts. ponytail: counts are cheap; cache via revalidate if traffic ever warrants it.
export async function getPublicStats(): Promise<PublicStats> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [habitsTracked, goalsCompleted, journalCount, moodCount, activeUsers] =
    await Promise.all([
      prisma.habitEntry.count({ where: { completed: true } }),
      prisma.goal.count({ where: { status: "COMPLETED" } }),
      prisma.journalEntry.count(),
      prisma.moodLog.count(),
      prisma.user.count({
        where: {
          OR: [
            { habitEntries: { some: { date: { gte: since } } } },
            { journal: { some: { createdAt: { gte: since } } } },
            { moods: { some: { createdAt: { gte: since } } } },
          ],
        },
      }),
    ]);
  return {
    habitsTracked,
    goalsCompleted,
    entriesLogged: journalCount + moodCount,
    activeUsers,
  };
}
