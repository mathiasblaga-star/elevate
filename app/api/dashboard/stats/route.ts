import { NextResponse } from "next/server";
import { getUserId, unauthorized } from "@/lib/api";
import { getDashboardStats } from "@/lib/stats";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return unauthorized();
  return NextResponse.json(await getDashboardStats(userId));
}
