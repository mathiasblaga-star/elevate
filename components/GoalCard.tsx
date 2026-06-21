"use client";

import { useState } from "react";
import {
  Pencil,
  Trash2,
  GripVertical,
  CalendarDays,
  ChevronDown,
  Sparkles,
  ListTodo,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_COLORS } from "@/lib/utils";
import { GoalTimeline, type Milestone } from "@/components/GoalTimeline";

export type Goal = {
  id: string;
  title: string;
  category: string;
  targetDate: string | null;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  progress: number;
  order: number;
  urgency?: number | null;
  importance?: number | null;
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
  const [expanded, setExpanded] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[] | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState("");

  async function loadMilestones() {
    const r = await fetch(`/api/goals/${goal.id}/milestones`);
    if (r.ok) setMilestones((await r.json()).milestones);
  }

  function toggleExpand() {
    const next = !expanded;
    setExpanded(next);
    if (next && milestones === null) loadMilestones();
  }

  async function toggleMilestone(m: Milestone) {
    setMilestones((ms) =>
      ms ? ms.map((x) => (x.id === m.id ? { ...x, completed: !x.completed } : x)) : ms
    );
    await fetch(`/api/goals/${goal.id}/milestones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ milestoneId: m.id, completed: !m.completed }),
    });
  }

  async function decompose() {
    setAiBusy(true);
    setAiErr("");
    try {
      const r = await fetch("/api/ai/decompose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId: goal.id }),
      });
      if (r.ok) {
        setMilestones((await r.json()).milestones);
      } else {
        setAiErr(r.status === 503 ? "AI is not configured yet." : "Could not generate milestones.");
      }
    } catch {
      setAiErr("Could not generate milestones.");
    } finally {
      setAiBusy(false);
    }
  }

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
        <h3 className="min-w-0 flex-1 break-words font-medium text-ink">{goal.title}</h3>
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

      <button
        onClick={toggleExpand}
        className="mt-3 flex w-full items-center justify-between rounded-md px-1 py-1 text-xs text-muted transition hover:text-foreground"
      >
        <span className="flex items-center gap-1">
          <ListTodo className="h-3.5 w-3.5" /> Milestones
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="mt-2 space-y-3 border-t border-white/10 pt-3">
          {milestones === null ? (
            <p className="text-xs text-muted">Loading…</p>
          ) : (
            <GoalTimeline milestones={milestones} onToggle={toggleMilestone} />
          )}
          {aiErr && <p className="text-xs text-red-400">{aiErr}</p>}
          <button
            onClick={decompose}
            disabled={aiBusy}
            className="flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1.5 text-xs text-foreground ring-1 ring-white/10 transition hover:bg-white/10 disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {aiBusy ? "Generating…" : "Break down with AI"}
          </button>
        </div>
      )}
    </div>
  );
}
