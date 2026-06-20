import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getUserId,
  unauthorized,
  badRequest,
  notFound,
  zodErrors,
} from "@/lib/api";
import { goalCreateSchema, goalUpdateSchema } from "@/lib/validations";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ goals });
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const body = await req.json().catch(() => null);
  const parsed = goalCreateSchema.safeParse(body);
  if (!parsed.success) return badRequest(zodErrors(parsed.error));

  const { title, category, progress, targetDate } = parsed.data;
  const goal = await prisma.goal.create({
    data: {
      userId,
      title,
      category,
      progress,
      targetDate: targetDate ? new Date(targetDate) : null,
      status:
        progress >= 100
          ? "COMPLETED"
          : progress > 0
            ? "IN_PROGRESS"
            : "NOT_STARTED",
    },
  });
  return NextResponse.json({ goal }, { status: 201 });
}

export async function PATCH(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const body = await req.json().catch(() => null);
  const parsed = goalUpdateSchema.safeParse(body);
  if (!parsed.success) return badRequest(zodErrors(parsed.error));

  const { id, targetDate, ...rest } = parsed.data;
  const existing = await prisma.goal.findFirst({ where: { id, userId } });
  if (!existing) return notFound();

  const goal = await prisma.goal.update({
    where: { id },
    data: {
      ...rest,
      ...(targetDate !== undefined
        ? { targetDate: targetDate ? new Date(targetDate) : null }
        : {}),
    },
  });
  return NextResponse.json({ goal });
}

export async function DELETE(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return badRequest("Missing id");
  const existing = await prisma.goal.findFirst({ where: { id, userId } });
  if (!existing) return notFound();
  await prisma.goal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
