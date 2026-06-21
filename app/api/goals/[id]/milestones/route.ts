import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getUserId,
  unauthorized,
  badRequest,
  notFound,
  tooManyRequests,
  zodErrors,
} from "@/lib/api";
import { rateLimitApi } from "@/lib/ratelimit";
import { milestoneToggleSchema } from "@/lib/validations";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const goal = await prisma.goal.findFirst({
    where: { id: params.id, userId },
    select: { id: true },
  });
  if (!goal) return notFound();
  const milestones = await prisma.goalMilestone.findMany({
    where: { goalId: params.id, userId },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({ milestones });
}

// Toggle a milestone's completion.
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { success } = await rateLimitApi(`milestone:${userId}`);
  if (!success) return tooManyRequests();
  const body = await req.json().catch(() => null);
  const parsed = milestoneToggleSchema.safeParse(body);
  if (!parsed.success) return badRequest(zodErrors(parsed.error));

  // ownership: milestone must belong to this user AND this goal
  const existing = await prisma.goalMilestone.findFirst({
    where: { id: parsed.data.milestoneId, userId, goalId: params.id },
    select: { id: true },
  });
  if (!existing) return notFound();

  await prisma.goalMilestone.update({
    where: { id: existing.id },
    data: { completed: parsed.data.completed },
  });
  return NextResponse.json({ ok: true });
}
