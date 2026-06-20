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
} from "@/lib/validations";

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
  await prisma.user.delete({ where: { id: userId } }); // cascade wipes all children
  return NextResponse.json({ ok: true });
}
