import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getUserId,
  unauthorized,
  badRequest,
  notFound,
  zodErrors,
  tooManyRequests,
} from "@/lib/api";
import { journalCreateSchema, journalUpdateSchema } from "@/lib/validations";
import { rateLimitApi } from "@/lib/ratelimit";
import { awardXp, XP_AWARD } from "@/lib/xp";
import { awardBadges } from "@/lib/badges";

const PAGE_SIZE = 10;

export async function GET(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const sp = new URL(req.url).searchParams;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);
  const [entries, total] = await Promise.all([
    prisma.journalEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.journalEntry.count({ where: { userId } }),
  ]);
  return NextResponse.json({
    entries,
    total,
    page,
    hasMore: page * PAGE_SIZE < total,
  });
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { success } = await rateLimitApi(`journal:${userId}`);
  if (!success) return tooManyRequests();
  const body = await req.json().catch(() => null);
  const parsed = journalCreateSchema.safeParse(body);
  if (!parsed.success) return badRequest(zodErrors(parsed.error));
  const entry = await prisma.journalEntry.create({
    data: { userId, ...parsed.data },
  });
  const { xp, level, leveledUp } = await awardXp(userId, XP_AWARD.JOURNAL);
  const badges = await awardBadges(userId);
  return NextResponse.json({ entry, xp, level, leveledUp, badges }, { status: 201 });
}

export async function PATCH(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const body = await req.json().catch(() => null);
  const parsed = journalUpdateSchema.safeParse(body);
  if (!parsed.success) return badRequest(zodErrors(parsed.error));
  const { id, ...rest } = parsed.data;
  const existing = await prisma.journalEntry.findFirst({ where: { id, userId } });
  if (!existing) return notFound();
  const entry = await prisma.journalEntry.update({ where: { id }, data: rest });
  return NextResponse.json({ entry });
}

export async function DELETE(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return badRequest("Missing id");
  const existing = await prisma.journalEntry.findFirst({ where: { id, userId } });
  if (!existing) return notFound();
  await prisma.journalEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
