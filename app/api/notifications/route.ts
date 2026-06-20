import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId, unauthorized } from "@/lib/api";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const [notifications, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);
  return NextResponse.json({ notifications, unread });
}

// Mark one (by id) or all unread notifications as read.
export async function PATCH(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const body = await req.json().catch(() => ({}) as { id?: string });
  if (body?.id) {
    await prisma.notification.updateMany({
      where: { id: body.id, userId },
      data: { read: true },
    });
  } else {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }
  return NextResponse.json({ ok: true });
}
