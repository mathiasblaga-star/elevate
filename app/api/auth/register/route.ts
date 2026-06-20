import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/ratelimit";
import { badRequest, zodErrors } from "@/lib/api";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "anon";
  const { success } = await rateLimit(`register:${ip}`);
  if (!success)
    return NextResponse.json(
      { error: "Too many attempts. Try again in a minute." },
      { status: 429 }
    );

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return badRequest(zodErrors(parsed.error));

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing)
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash,
    },
    select: { id: true, email: true, name: true }, // never return passwordHash
  });

  return NextResponse.json({ user }, { status: 201 });
}
