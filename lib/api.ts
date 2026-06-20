import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import { auth } from "@/lib/auth";

/** Flatten a ZodError to { field: message } — stable across zod v3/v4 (uses .issues). */
export function zodErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Returns the authenticated user id, or null. Every /api route (except /auth/*) gates on this. */
export async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export const badRequest = (error: unknown) =>
  NextResponse.json({ error }, { status: 400 });

export const notFound = () =>
  NextResponse.json({ error: "Not found" }, { status: 404 });
