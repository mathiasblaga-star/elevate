import { NextResponse } from "next/server";
import { getUserId, unauthorized, tooManyRequests } from "@/lib/api";
import { rateLimitApi } from "@/lib/ratelimit";
import { getMoodInsights } from "@/lib/stats";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  const { success } = await rateLimitApi(`moodinsights:${userId}`);
  if (!success) return tooManyRequests();
  const insights = await getMoodInsights(userId);
  return NextResponse.json(insights);
}
