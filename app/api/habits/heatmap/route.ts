import { NextResponse } from "next/server";
import { getUserId, unauthorized, tooManyRequests } from "@/lib/api";
import { rateLimit } from "@/lib/ratelimit";
import { getHeatmap } from "@/lib/heatmap";

export async function GET(req: Request) {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { success } = await rateLimit(`heatmap:${userId}`);
  if (!success) return tooManyRequests();

  const sp = new URL(req.url).searchParams;
  const habitId = sp.get("habitId") || undefined;
  const days = Math.min(366, Math.max(7, parseInt(sp.get("days") ?? "133", 10) || 133));

  const heatmap = await getHeatmap(userId, days, habitId);
  return NextResponse.json({ heatmap });
}
