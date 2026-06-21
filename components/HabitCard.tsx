"use client";

import { Flame, Pencil, Trash2, Check, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CATEGORY_COLORS } from "@/lib/utils";

export type Habit = {
  id: string;
  name: string;
  frequency: "DAILY" | "WEEKLY";
  streak: number;
  longestStreak: number;
  category: string;
  doneToday: boolean;
  reminderTime?: string | null;
};

export function HabitCard({
  habit,
  onCheck,
  onEdit,
  onDelete,
  busy,
}: {
  habit: Habit;
  onCheck: (h: Habit) => void;
  onEdit: (h: Habit) => void;
  onDelete: (h: Habit) => void;
  busy?: boolean;
}) {
  return (
    <div className="glass glass-interactive flex flex-wrap items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-medium text-ink">{habit.name}</h3>
          <Badge className={CATEGORY_COLORS[habit.category]}>
            {habit.category}
          </Badge>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <span className="rounded bg-white/5 px-1.5 py-0.5">
            {habit.frequency}
          </span>
          <span className="flex items-center gap-1">
            {habit.streak >= 3 && <Flame className="h-3.5 w-3.5 text-amber" />}
            {habit.streak} day streak
          </span>
          <span>Best: {habit.longestStreak}</span>
          {habit.reminderTime && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {habit.reminderTime}
            </span>
          )}
        </div>
      </div>
      <Button
        size="sm"
        variant={habit.doneToday ? "secondary" : "default"}
        onClick={() => onCheck(habit)}
        disabled={busy}
      >
        {habit.doneToday ? (
          <>
            <Check className="h-4 w-4" /> Done today
          </>
        ) : (
          "Mark done"
        )}
      </Button>
      <button
        onClick={() => onEdit(habit)}
        className="text-muted transition hover:text-ink"
        aria-label="Edit habit"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        onClick={() => onDelete(habit)}
        className="text-muted transition hover:text-red-400"
        aria-label="Delete habit"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
