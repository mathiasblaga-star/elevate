import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CATEGORIES = [
  "HEALTH",
  "MINDSET",
  "PRODUCTIVITY",
  "SOCIAL",
  "FINANCE",
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  HEALTH: "bg-mint/15 text-mint",
  MINDSET: "bg-violet/15 text-violet-500",
  PRODUCTIVITY: "bg-sky-500/15 text-sky-400",
  SOCIAL: "bg-pink-500/15 text-pink-400",
  FINANCE: "bg-amber/15 text-amber",
};

export const MOOD_EMOJI = ["😞", "😕", "😐", "🙂", "😄"]; // index 0-4 -> mood 1-5

// ponytail: UTC day boundary everywhere — no per-user timezone (add tz column if users complain)
export function todayUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Consecutive-day streak ending today (or yesterday, if today not yet logged). */
export function currentStreak(dates: Date[]): number {
  const set = new Set(dates.map(dayKey));
  const cursor = todayUTC();
  if (!set.has(dayKey(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    if (!set.has(dayKey(cursor))) return 0;
  }
  let streak = 0;
  while (set.has(dayKey(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
