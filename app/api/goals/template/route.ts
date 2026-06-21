import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getUserId,
  unauthorized,
  badRequest,
  tooManyRequests,
  zodErrors,
} from "@/lib/api";
import { rateLimitApi } from "@/lib/ratelimit";
import { goalTemplateSchema } from "@/lib/validations";
import { TEMPLATE_MAP } from "@/lib/goalTemplates";

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { success } = await rateLimitApi(`goaltpl:${userId}`);
  if (!success) return tooManyRequests();
  const body = await req.json().catch(() => null);
  const parsed = goalTemplateSchema.safeParse(body);
  if (!parsed.success) return badRequest(zodErrors(parsed.error));

  const tpl = TEMPLATE_MAP[parsed.data.template];
  if (!tpl) return badRequest({ template: "Unknown template" });

  const now = Date.now();
  const goal = await prisma.goal.create({
    data: {
      userId,
      title: tpl.title,
      category: tpl.category,
      template: tpl.key,
      targetDate: new Date(now + tpl.weeks * 7 * 24 * 60 * 60 * 1000),
      milestones: {
        create: tpl.milestones.map((title, i) => ({
          userId,
          title,
          order: i,
          dueDate: new Date(now + (i + 1) * 7 * 24 * 60 * 60 * 1000),
        })),
      },
    },
  });
  return NextResponse.json({ goal }, { status: 201 });
}
