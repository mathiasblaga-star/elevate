"use client";

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { Goal } from "@/components/GoalCard";

const QUADRANTS = [
  { key: "11", u: 1, i: 1, title: "Do first", sub: "Urgent & important" },
  { key: "01", u: 0, i: 1, title: "Schedule", sub: "Important, not urgent" },
  { key: "10", u: 1, i: 0, title: "Delegate", sub: "Urgent, not important" },
  { key: "00", u: 0, i: 0, title: "Eliminate", sub: "Neither" },
];

function Chip({ goal }: { goal: Goal }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: goal.id,
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
        opacity: isDragging ? 0.4 : 1,
      }}
      className="cursor-grab touch-none rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-ink/90 active:cursor-grabbing"
    >
      {goal.title}
    </div>
  );
}

function Quadrant({
  id,
  title,
  sub,
  goals,
}: {
  id: string;
  title: string;
  sub: string;
  goals: Goal[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[140px] flex-col gap-2 rounded-xl border p-3 transition ${
        isOver ? "border-white/30 bg-white/[0.05]" : "border-white/10 bg-white/[0.02]"
      }`}
    >
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-[11px] text-muted">{sub}</p>
      </div>
      <div className="space-y-1.5">
        {goals.map((g) => (
          <Chip key={g.id} goal={g} />
        ))}
      </div>
    </div>
  );
}

export function PriorityMatrix({
  goals,
  onMove,
}: {
  goals: Goal[];
  onMove: (id: string, urgency: number, importance: number) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
  const bucket = (u: number, i: number) =>
    goals.filter((g) => g.urgency === u && g.importance === i);
  const unsorted = goals.filter((g) => g.urgency == null || g.importance == null);

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;
    const q = QUADRANTS.find((x) => x.key === String(over.id));
    if (q) onMove(String(active.id), q.u, q.i);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="grid gap-3 sm:grid-cols-2">
        {QUADRANTS.map((q) => (
          <Quadrant key={q.key} id={q.key} title={q.title} sub={q.sub} goals={bucket(q.u, q.i)} />
        ))}
      </div>
      {unsorted.length > 0 && (
        <div className="mt-4 rounded-xl border border-dashed border-white/15 p-3">
          <p className="mb-2 text-xs text-muted">
            Unsorted — drag each into a quadrant
          </p>
          <div className="flex flex-wrap gap-1.5">
            {unsorted.map((g) => (
              <Chip key={g.id} goal={g} />
            ))}
          </div>
        </div>
      )}
    </DndContext>
  );
}
