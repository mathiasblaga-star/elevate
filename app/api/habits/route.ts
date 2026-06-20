import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getUserId,
  unauthorized,
  badRequest,
  notFound,
  zodErrors,
} from "@/lib/api";
import { habitCreateSchema, habitUpdateSchema } from "@/lib/validations";
import { todayUTC } from "@/lib/utils";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const [habits, entries] = await Promise.all([
    prisma.habit.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.habitEntry.findMany({
      where: { userId, date: todayUTC(), completed: true },
      select: { habitId: true },
    }),
  ]);
  const done = new Set(entries.map((e) => e.habitId));
  return NextResponse.json({
    habits: habits.map((h) => ({ ...h, doneToday: done.has(h.id) })),
  });
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const body = await req.json().catch(() => null);
  const parsed = habitCreateSchema.safeParse(body);
  if (!parsed.success) return badRequest(zodErrors(parsed.error));
  const habit = await prisma.habit.create({ data: { userId, ...parsed.data } });
  return NextResponse.json({ habit }, { status: 201 });
}

export async function PATCH(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const body = await req.json().catch(() => null);
  const parsed = habitUpdateSchema.safeParse(body);
  if (!parsed.success) return badRequest(zodErrors(parsed.error));
  const { id, ...rest } = parsed.data;
  const existing = await prisma.habit.findFirst({ where: { id, userId } });
  if (!existing) return notFound();
  const habit = await prisma.habit.update({ where: { id }, data: rest });
  return NextResponse.json({ habit });
}

export async function DELETE(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return badRequest("Missing id");
  const existing = await prisma.habit.findFirst({ where: { id, userId } });
  if (!existing) return notFound();
  await prisma.habit.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
