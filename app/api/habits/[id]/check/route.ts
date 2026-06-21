import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId, unauthorized, notFound } from "@/lib/api";
import { todayUTC, currentStreak } from "@/lib/utils";

const MILESTONES = [3, 7, 14, 30];

// Toggle today's completion for a habit, recompute streak, fire milestone notifications.
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const habit = await prisma.habit.findFirst({
    where: { id: params.id, userId },
  });
  if (!habit) return notFound();

  const today = todayUTC();
  const existing = await prisma.habitEntry.findUnique({
    where: { habitId_date: { habitId: habit.id, date: today } },
  });

  let completed: boolean;
  if (existing) {
    await prisma.habitEntry.delete({ where: { id: existing.id } });
    completed = false;
  } else {
    await prisma.habitEntry.create({
      data: { userId, habitId: habit.id, date: today, completed: true },
    });
    completed = true;
  }

  const entries = await prisma.habitEntry.findMany({
    where: { habitId: habit.id, completed: true },
    select: { date: true },
  });
  const streak = currentStreak(entries.map((e) => e.date));
  const longestStreak = Math.max(habit.longestStreak, streak);
  await prisma.habit.update({
    where: { id: habit.id },
    data: { streak, longestStreak },
  });

  let milestone: number | null = null;
  if (completed && MILESTONES.includes(streak) && streak > habit.streak) {
    milestone = streak;
    await prisma.notification.create({
      data: {
        userId,
        type: "STREAK",
        message: `${streak}-day streak on ${habit.name}!`,
      },
    });
  }

  return NextResponse.json({ completed, streak, longestStreak, milestone });
}
