import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  getUserId,
  unauthorized,
  badRequest,
  notFound,
  zodErrors,
} from "@/lib/api";
import {
  profileSchema,
  passwordSchema,
  deleteAccountSchema,
  prefsSchema,
} from "@/lib/validations";
import { normalizeWeights } from "@/lib/lifeScore";
import type { Prisma } from "@prisma/client";

// PATCH handles both profile updates and password changes (password if newPassword present).
export async function PATCH(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const body = await req.json().catch(() => null);

  if (body && typeof body === "object" && "newPassword" in body) {
    const parsed = passwordSchema.safeParse(body);
    if (!parsed.success) return badRequest(zodErrors(parsed.error));
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return notFound();
    const ok = await bcrypt.compare(
      parsed.data.currentPassword,
      user.passwordHash
    );
    if (!ok)
      return badRequest({ currentPassword: "Current password is incorrect" });
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 10) },
    });
    return NextResponse.json({ ok: true });
  }

  // Preferences branch: Life Score weights + theme/accent.
  if (
    body &&
    typeof body === "object" &&
    ("lifeScoreWeights" in body || "theme" in body || "accent" in body)
  ) {
    const parsed = prefsSchema.safeParse(body);
    if (!parsed.success) return badRequest(zodErrors(parsed.error));
    const data: Prisma.UserUpdateInput = {};
    if (parsed.data.lifeScoreWeights)
      data.lifeScoreWeights = normalizeWeights(
        parsed.data.lifeScoreWeights
      ) as unknown as Prisma.InputJsonValue;
    if (parsed.data.theme) data.theme = parsed.data.theme;
    if (parsed.data.accent) data.accent = parsed.data.accent;
    await prisma.user.update({ where: { id: userId }, data });
    return NextResponse.json({ ok: true });
  }

  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) return badRequest(zodErrors(parsed.error));
  const user = await prisma.user.update({
    where: { id: userId },
    data: parsed.data,
    select: { id: true, name: true, avatar: true, emailDigest: true },
  });
  return NextResponse.json({ user });
}

export async function DELETE(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const body = await req.json().catch(() => null);
  const parsed = deleteAccountSchema.safeParse(body);
  if (!parsed.success)
    return badRequest({ confirm: 'Type "DELETE" to confirm' });
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  // FK cascades wipe the user's own children; also remove inbound partner invites
  // (addresseeId/email have no FK), then delete the user. GDPR full purge.
  await prisma.$transaction([
    prisma.partnership.deleteMany({
      where: { OR: [{ addresseeId: userId }, ...(user ? [{ addresseeEmail: user.email }] : [])] },
    }),
    prisma.user.delete({ where: { id: userId } }),
  ]);
  return NextResponse.json({ ok: true });
}
