import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getUserId,
  unauthorized,
  badRequest,
  zodErrors,
  tooManyRequests,
} from "@/lib/api";
import { moodSchema } from "@/lib/validations";
import { rateLimitApi } from "@/lib/ratelimit";
import { awardXp, XP_AWARD } from "@/lib/xp";
import { awardBadges } from "@/lib/badges";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const moods = await prisma.moodLog.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ moods });
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { success } = await rateLimitApi(`mood:${userId}`);
  if (!success) return tooManyRequests();
  const body = await req.json().catch(() => null);
  const parsed = moodSchema.safeParse(body);
  if (!parsed.success) return badRequest(zodErrors(parsed.error));
  const mood = await prisma.moodLog.create({
    data: { userId, score: parsed.data.score, note: parsed.data.note ?? null },
  });
  const { xp, level, leveledUp } = await awardXp(userId, XP_AWARD.MOOD);
  const badges = await awardBadges(userId);
  return NextResponse.json({ mood, xp, level, leveledUp, badges }, { status: 201 });
}
