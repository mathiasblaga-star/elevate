import { prisma } from "@/lib/prisma";

export interface BadgeDef {
  key: string;
  name: string;
  description: string;
}

// Static catalogue — milestone unlocks. Order = display order.
export const BADGES: BadgeDef[] = [
  { key: "first_habit", name: "First Step", description: "Create your first habit" },
  { key: "streak_7", name: "Week Warrior", description: "Reach a 7-day streak" },
  { key: "streak_30", name: "Unstoppable", description: "Reach a 30-day streak" },
  { key: "first_goal", name: "Closer", description: "Complete your first goal" },
  { key: "journal_30", name: "Chronicler", description: "Write 30 journal entries" },
  { key: "mood_30", name: "In Tune", description: "Log your mood 30 times" },
  { key: "level_5", name: "Ascendant", description: "Reach level 5" },
];

export const BADGE_MAP = Object.fromEntries(BADGES.map((b) => [b.key, b]));

/**
 * Recompute earned badges from current data and persist any new ones.
 * Returns the keys newly awarded this call.
 */
export async function awardBadges(userId: string): Promise<string[]> {
  const [habitCount, bestStreakRow, goalsDone, journalCount, moodCount, user, existing] =
    await Promise.all([
      prisma.habit.count({ where: { userId } }),
      prisma.habit.findFirst({
        where: { userId },
        orderBy: { longestStreak: "desc" },
        select: { longestStreak: true },
      }),
      prisma.goal.count({ where: { userId, status: "COMPLETED" } }),
      prisma.journalEntry.count({ where: { userId } }),
      prisma.moodLog.count({ where: { userId } }),
      prisma.user.findUnique({ where: { id: userId }, select: { level: true } }),
      prisma.userBadge.findMany({ where: { userId }, select: { key: true } }),
    ]);

  const best = bestStreakRow?.longestStreak ?? 0;
  const earned = new Set<string>();
  if (habitCount > 0) earned.add("first_habit");
  if (best >= 7) earned.add("streak_7");
  if (best >= 30) earned.add("streak_30");
  if (goalsDone > 0) earned.add("first_goal");
  if (journalCount >= 30) earned.add("journal_30");
  if (moodCount >= 30) earned.add("mood_30");
  if ((user?.level ?? 1) >= 5) earned.add("level_5");

  const have = new Set(existing.map((e) => e.key));
  const toAdd = Array.from(earned).filter((k) => !have.has(k));
  if (toAdd.length) {
    await prisma.userBadge.createMany({
      data: toAdd.map((key) => ({ userId, key })),
      skipDuplicates: true,
    });
  }
  return toAdd;
}
