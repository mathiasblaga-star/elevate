import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getUserId,
  unauthorized,
  badRequest,
  tooManyRequests,
  zodErrors,
} from "@/lib/api";
import { rateLimitApi } from "@/lib/ratelimit";
import { pomodoroSchema } from "@/lib/validations";
import { todayUTC } from "@/lib/utils";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const today = todayUTC();
  const [recent, todays] = await Promise.all([
    prisma.pomodoroSession.findMany({
      where: { userId },
      orderBy: { completedAt: "desc" },
      take: 10,
    }),
    prisma.pomodoroSession.aggregate({
      where: { userId, completedAt: { gte: today } },
      _sum: { minutes: true },
    }),
  ]);
  return NextResponse.json({ recent, todayMinutes: todays._sum.minutes ?? 0 });
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { success } = await rateLimitApi(`pomodoro:${userId}`);
  if (!success) return tooManyRequests();
  const body = await req.json().catch(() => null);
  const parsed = pomodoroSchema.safeParse(body);
  if (!parsed.success) return badRequest(zodErrors(parsed.error));

  // verify goal ownership if linked
  if (parsed.data.goalId) {
    const goal = await prisma.goal.findFirst({
      where: { id: parsed.data.goalId, userId },
      select: { id: true },
    });
    if (!goal) return badRequest({ goalId: "Goal not found" });
  }

  const session = await prisma.pomodoroSession.create({
    data: { userId, minutes: parsed.data.minutes, goalId: parsed.data.goalId ?? null },
  });
  return NextResponse.json({ session }, { status: 201 });
}
