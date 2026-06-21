"use client";

import { Pencil, Trash2, GripVertical, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_COLORS } from "@/lib/utils";

export type Goal = {
  id: string;
  title: string;
  category: string;
  targetDate: string | null;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  progress: number;
  order: number;
};

export function GoalCard({
  goal,
  onEdit,
  onDelete,
  dragHandleProps,
}: {
  goal: Goal;
  onEdit: (g: Goal) => void;
  onDelete: (g: Goal) => void;
  dragHandleProps?: Record<string, unknown>;
}) {
  return (
    <div className="glass glass-interactive p-4">
      <div className="flex items-start gap-2">
        <button
          {...dragHandleProps}
          className="mt-0.5 cursor-grab text-muted/60 hover:text-muted active:cursor-grabbing"
          aria-label="Drag goal"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <h3 className="min-w-0 flex-1 break-words font-medium text-ink">
          {goal.title}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(goal)}
            className="text-muted transition hover:text-ink"
            aria-label="Edit goal"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(goal)}
            className="text-muted transition hover:text-red-400"
            aria-label="Delete goal"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Badge className={CATEGORY_COLORS[goal.category]}>{goal.category}</Badge>
        {goal.targetDate && (
          <span className="flex items-center gap-1 text-xs text-muted">
            <CalendarDays className="h-3 w-3" />
            {new Date(goal.targetDate).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="mt-3">
        <div className="mb-1 flex justify-between text-xs text-muted">
          <span>Progress</span>
          <span className="font-mono text-ink">{goal.progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500 ease-liquid"
            style={{ width: `${goal.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
