import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/api";
import { rateLimitAi } from "@/lib/ratelimit";
import { aiStreamResponse, isAIConfigured } from "@/lib/ai";

const MIN_ENTRIES = 7;

export async function POST() {
  const userId = await getUserId();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  if (!isAIConfigured()) return new Response("AI is not configured", { status: 503 });
  const { success } = await rateLimitAi(`ai:${userId}`);
  if (!success) return new Response("Too many requests", { status: 429 });

  const entries = await prisma.journalEntry.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { content: true, mood: true, createdAt: true, tags: true },
  });
  if (entries.length < MIN_ENTRIES)
    return new Response(`Need at least ${MIN_ENTRIES} entries`, { status: 400 });

  // Cap the corpus; this is the user's own data fed back to them (low injection risk).
  const corpus = entries
    .map(
      (e) =>
        `[${e.createdAt.toISOString().slice(0, 10)} mood ${e.mood}/5${
          e.tags.length ? ` tags:${e.tags.join(",")}` : ""
        }] ${e.content}`
    )
    .join("\n\n")
    .slice(0, 6000);

  const system =
    "You are a thoughtful, warm journaling coach. Analyse the user's recent entries and surface: recurring themes, emotional patterns over time, and 2-3 concrete, gentle suggested actions. Be specific and concise. Use short markdown headings.";
  const prompt = `Here are my recent journal entries (newest first):\n\n${corpus}\n\nGive me your insights.`;

  try {
    return aiStreamResponse({ system, prompt, maxOutputTokens: 700 });
  } catch {
    return new Response("AI request failed", { status: 502 });
  }
}
