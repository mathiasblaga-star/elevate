"use client";

import { Check } from "lucide-react";

export type Milestone = {
  id: string;
  title: string;
  dueDate: string | null;
  completed: boolean;
  order: number;
};

export function GoalTimeline({
  milestones,
  onToggle,
}: {
  milestones: Milestone[];
  onToggle: (m: Milestone) => void;
}) {
  if (!milestones.length) {
    return <p className="text-xs text-muted">No milestones yet.</p>;
  }
  const done = milestones.filter((m) => m.completed).length;
  const now = Date.now();
  // projected = milestones whose due date has passed (should be done by now)
  const due = milestones.filter(
    (m) => m.dueDate && new Date(m.dueDate).getTime() <= now
  ).length;
  const behind = Math.max(0, due - done);
  const pace = behind === 0 ? "On track" : `${behind} behind pace`;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-muted">
        <span>
          {done}/{milestones.length} milestones
        </span>
        <span className={behind === 0 ? "text-foreground" : "text-amber"}>{pace}</span>
      </div>
      <ol className="space-y-1.5">
        {milestones.map((m) => (
          <li key={m.id} className="flex items-start gap-2">
            <button
              onClick={() => onToggle(m)}
              aria-label={m.completed ? "Mark incomplete" : "Mark complete"}
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                m.completed
                  ? "border-white/40 bg-white/90 text-black"
                  : "border-white/20 hover:border-white/40"
              }`}
            >
              {m.completed && <Check className="h-3 w-3" />}
            </button>
            <div className="min-w-0 flex-1">
              <p className={`text-sm ${m.completed ? "text-muted line-through" : "text-ink/90"}`}>
                {m.title}
              </p>
              {m.dueDate && (
                <p className="text-[11px] text-muted">
                  by {new Date(m.dueDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
