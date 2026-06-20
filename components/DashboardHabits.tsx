"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_COLORS, cn } from "@/lib/utils";

type TH = { id: string; name: string; category: string; doneToday: boolean };

export function DashboardHabits({ initial }: { initial: TH[] }) {
  const [habits, setHabits] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const router = useRouter();

  async function toggle(h: TH) {
    setBusy(h.id);
    const res = await fetch(`/api/habits/${h.id}/check`, { method: "POST" });
    if (res.ok) {
      const d = await res.json();
      setHabits((prev) =>
        prev.map((x) => (x.id === h.id ? { ...x, doneToday: d.completed } : x))
      );
      router.refresh(); // re-pull life score + stats
    }
    setBusy(null);
  }

  if (habits.length === 0) {
    return (
      <p className="text-sm text-muted">
        No habits yet — add some on the Habits page.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {habits.map((h) => (
        <li key={h.id}>
          <button
            onClick={() => toggle(h)}
            disabled={busy === h.id}
            className="flex w-full items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-left transition hover:bg-white/5 disabled:opacity-60"
          >
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition",
                h.doneToday
                  ? "border-mint bg-mint/20 text-mint"
                  : "border-white/20"
              )}
            >
              {h.doneToday && <Check className="h-3.5 w-3.5" />}
            </span>
            <span
              className={cn(
                "flex-1 text-sm",
                h.doneToday ? "text-muted line-through" : "text-ink"
              )}
            >
              {h.name}
            </span>
            <Badge className={CATEGORY_COLORS[h.category]}>{h.category}</Badge>
          </button>
        </li>
      ))}
    </ul>
  );
}
