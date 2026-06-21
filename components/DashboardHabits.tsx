"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_COLORS, cn } from "@/lib/utils";
import { tickHabit } from "@/lib/offlineQueue";
import { useToast } from "@/components/ui/toast";

type TH = { id: string; name: string; category: string; doneToday: boolean };

export function DashboardHabits({ initial }: { initial: TH[] }) {
  const [habits, setHabits] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [queued, setQueued] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function toggle(h: TH) {
    setBusy(h.id);
    // optimistic flip
    setHabits((prev) =>
      prev.map((x) => (x.id === h.id ? { ...x, doneToday: !x.doneToday } : x))
    );
    const res = await tickHabit(h.id);
    if (res.ok && res.data) {
      const d = res.data as {
        completed: boolean;
        leveledUp?: boolean;
        level?: number;
        badges?: string[];
      };
      setHabits((prev) =>
        prev.map((x) => (x.id === h.id ? { ...x, doneToday: d.completed } : x))
      );
      if (d.completed) toast("+10 XP", "success");
      if (d.leveledUp) toast(`Level up — you're level ${d.level}!`, "success");
      if (d.badges?.length) toast("Badge unlocked!", "success");
      router.refresh(); // re-pull life score + stats
    } else if (res.queued) {
      setQueued(true);
      toast("Saved offline — will sync when you reconnect", "default");
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
      {queued && (
        <li className="rounded-md bg-white/5 px-3 py-2 text-xs text-muted">
          You&apos;re offline — ticks are saved and will sync when you reconnect.
        </li>
      )}
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
