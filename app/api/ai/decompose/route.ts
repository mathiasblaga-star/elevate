import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getUserId,
  unauthorized,
  badRequest,
  notFound,
  tooManyRequests,
  zodErrors,
} from "@/lib/api";
import { rateLimitAi } from "@/lib/ratelimit";
import { aiGenerate, isAIConfigured } from "@/lib/ai";

const schema = z.object({
  goalId: z.string().min(1),
  weeks: z.number().int().min(2).max(16).optional(),
});

const aiOff = () =>
  NextResponse.json({ error: "AI is not configured" }, { status: 503 });

/** Parse a JSON array of milestone strings; fall back to line extraction for small models. */
function parseTitles(text: string, max: number): string[] {
  const m = text.match(/\[[\s\S]*\]/);
  if (m) {
    try {
      const arr = JSON.parse(m[0]);
      if (Array.isArray(arr)) {
        return arr
          .map((x) => (typeof x === "string" ? x : x?.title ?? ""))
          .map((s: string) => s.trim())
          .filter(Boolean)
          .slice(0, max);
      }
    } catch {
      /* fall through */
    }
  }
  return text
    .split("\n")
    .map((l) => l.replace(/^[\s\-*\d.)]+/, "").trim())
    .filter((l) => l.length > 3)
    .slice(0, max);
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  if (!isAIConfigured()) return aiOff();
  const { success } = await rateLimitAi(`ai:${userId}`);
  if (!success) return tooManyRequests();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return badRequest(zodErrors(parsed.error));

  const goal = await prisma.goal.findFirst({
    where: { id: parsed.data.goalId, userId },
  });
  if (!goal) return notFound();

  const weeks = parsed.data.weeks ?? 6;
  const prompt = `Goal: "${goal.title}" (category: ${goal.category}). Break it into ${weeks} sequential, concrete weekly milestones that build toward the goal. Each milestone must be a short actionable phrase (max ~12 words). Respond ONLY with a JSON array of exactly ${weeks} strings — no prose, no numbering.`;

  let text: string;
  try {
    text = await aiGenerate({
      system: "You are a concise planning assistant. Output strictly valid JSON only.",
      prompt,
      maxOutputTokens: 600,
    });
  } catch {
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }

  const titles = parseTitles(text, weeks);
  if (!titles.length)
    return NextResponse.json({ error: "Could not parse AI response" }, { status: 502 });

  // Replace any existing milestones for this goal with the new plan.
  const now = Date.now();
  await prisma.goalMilestone.deleteMany({ where: { goalId: goal.id, userId } });
  await prisma.goalMilestone.createMany({
    data: titles.map((title, i) => ({
      goalId: goal.id,
      userId,
      title,
      order: i,
      dueDate: new Date(now + (i + 1) * 7 * 24 * 60 * 60 * 1000),
    })),
  });
  const milestones = await prisma.goalMilestone.findMany({
    where: { goalId: goal.id },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({ milestones });
}
