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
import { partnerInviteSchema, partnerActionSchema } from "@/lib/validations";

async function myEmail(userId: string) {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  return u?.email ?? "";
}

// Returns ONLY streak counts for accepted partners — never journal/mood/goals/private data.
export async function GET() {
  const me = await getUserId();
  if (!me) return unauthorized();
  const email = await myEmail(me);

  const all = await prisma.partnership.findMany({
    where: { OR: [{ requesterId: me }, { addresseeId: me }, { addresseeEmail: email }] },
  });

  const accepted = all.filter((p) => p.status === "ACCEPTED");
  const otherIds = accepted
    .map((p) => (p.requesterId === me ? p.addresseeId : p.requesterId))
    .filter((x): x is string => !!x);

  // streak-only projection: select nothing but the partner's habit streaks + display name
  const others = await prisma.user.findMany({
    where: { id: { in: otherIds } },
    select: { id: true, name: true, email: true, habits: { select: { streak: true } } },
  });

  const partners = accepted.map((p) => {
    const otherId = p.requesterId === me ? p.addresseeId : p.requesterId;
    const o = others.find((x) => x.id === otherId);
    const bestStreak = o ? o.habits.reduce((m, h) => Math.max(m, h.streak), 0) : 0;
    return { id: p.id, name: o?.name ?? o?.email ?? "Partner", bestStreak };
  });

  const sentPending = all
    .filter((p) => p.requesterId === me && p.status === "PENDING")
    .map((p) => ({ id: p.id, email: p.addresseeEmail }));

  const receivedRows = all.filter(
    (p) => p.requesterId !== me && p.status === "PENDING" && (p.addresseeId === me || p.addresseeEmail === email)
  );
  const reqUsers = await prisma.user.findMany({
    where: { id: { in: receivedRows.map((p) => p.requesterId) } },
    select: { id: true, name: true, email: true },
  });
  const received = receivedRows.map((p) => {
    const u = reqUsers.find((x) => x.id === p.requesterId);
    return { id: p.id, from: u?.name ?? u?.email ?? "Someone" };
  });

  return NextResponse.json({ partners, sentPending, received });
}

export async function POST(req: Request) {
  const me = await getUserId();
  if (!me) return unauthorized();
  const { success } = await rateLimitApi(`partner:${me}`);
  if (!success) return tooManyRequests();
  const body = await req.json().catch(() => null);
  const parsed = partnerInviteSchema.safeParse(body);
  if (!parsed.success) return badRequest(zodErrors(parsed.error));

  const email = parsed.data.email.toLowerCase();
  if (email === (await myEmail(me)).toLowerCase())
    return badRequest({ email: "You can't add yourself" });

  const addressee = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  try {
    await prisma.partnership.create({
      data: { requesterId: me, addresseeEmail: email, addresseeId: addressee?.id ?? null },
    });
  } catch {
    return badRequest({ email: "You've already invited this person" });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function PATCH(req: Request) {
  const me = await getUserId();
  if (!me) return unauthorized();
  const { success } = await rateLimitApi(`partner:${me}`);
  if (!success) return tooManyRequests();
  const body = await req.json().catch(() => null);
  const parsed = partnerActionSchema.safeParse(body);
  if (!parsed.success) return badRequest(zodErrors(parsed.error));
  const email = await myEmail(me);

  const p = await prisma.partnership.findFirst({
    where: {
      id: parsed.data.id,
      status: "PENDING",
      OR: [{ addresseeId: me }, { addresseeEmail: email }],
    },
  });
  if (!p) return notFound();

  if (parsed.data.action === "accept") {
    await prisma.partnership.update({
      where: { id: p.id },
      data: { status: "ACCEPTED", addresseeId: me },
    });
  } else {
    await prisma.partnership.delete({ where: { id: p.id } });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const me = await getUserId();
  if (!me) return unauthorized();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return badRequest("Missing id");
  const email = await myEmail(me);
  const p = await prisma.partnership.findFirst({
    where: { id, OR: [{ requesterId: me }, { addresseeId: me }, { addresseeEmail: email }] },
  });
  if (!p) return notFound();
  await prisma.partnership.delete({ where: { id: p.id } });
  return NextResponse.json({ ok: true });
}
