import { prisma } from "@/lib/prisma";

export const XP_AWARD = { HABIT: 10, MOOD: 5, JOURNAL: 15 } as const;

/** Level curve: level N needs (N-1)^2 * 100 XP. Inverse below. */
export function levelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
}
export function xpForLevel(level: number): number {
  return (Math.max(1, level) - 1) ** 2 * 100;
}

export interface XpProgress {
  xp: number;
  level: number;
  intoLevel: number; // xp earned within the current level
  span: number; // xp needed to clear the current level
}
export function xpProgress(xp: number): XpProgress {
  const level = levelFromXp(xp);
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { xp, level, intoLevel: xp - base, span: next - base };
}

/** Award XP and keep `level` in sync. Safe to await inside a route. */
export async function awardXp(
  userId: string,
  amount: number
): Promise<{ xp: number; level: number; leveledUp: boolean }> {
  const u = await prisma.user.update({
    where: { id: userId },
    data: { xp: { increment: amount } },
    select: { xp: true, level: true },
  });
  const newLevel = levelFromXp(u.xp);
  if (newLevel !== u.level) {
    await prisma.user.update({ where: { id: userId }, data: { level: newLevel } });
  }
  return { xp: u.xp, level: newLevel, leveledUp: newLevel > u.level };
}

// ponytail: self-check — `npx tsx lib/xp.ts`
if (process.argv[1]?.includes("xp")) {
  console.assert(levelFromXp(0) === 1, "0xp -> L1");
  console.assert(levelFromXp(100) === 2, "100xp -> L2");
  console.assert(levelFromXp(400) === 3, "400xp -> L3");
  console.assert(xpForLevel(3) === 400, "L3 needs 400");
  const p = xpProgress(150);
  console.assert(p.level === 2 && p.intoLevel === 50 && p.span === 300, "progress at 150xp");
  console.log("xp self-check passed");
}
