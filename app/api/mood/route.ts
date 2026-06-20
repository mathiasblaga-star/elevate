import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId, unauthorized, badRequest, zodErrors } from "@/lib/api";
import { moodSchema } from "@/lib/validations";

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
  const body = await req.json().catch(() => null);
  const parsed = moodSchema.safeParse(body);
  if (!parsed.success) return badRequest(zodErrors(parsed.error));
  const mood = await prisma.moodLog.create({
    data: { userId, score: parsed.data.score, note: parsed.data.note ?? null },
  });
  return NextResponse.json({ mood }, { status: 201 });
}
