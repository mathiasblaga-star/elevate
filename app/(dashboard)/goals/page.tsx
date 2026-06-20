"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCorners,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus } from "lucide-react";
import { GoalCard, type Goal } from "@/components/GoalCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { CATEGORIES } from "@/lib/utils";

type Status = Goal["status"];
const HEADERS = { "Content-Type": "application/json" };
const COLUMNS: { status: Status; title: string }[] = [
  { status: "NOT_STARTED", title: "Not started" },
  { status: "IN_PROGRESS", title: "In progress" },
  { status: "COMPLETED", title: "Completed" },
];

function SortableGoal({
  goal,
  onEdit,
  onDelete,
}: {
  goal: Goal;
  onEdit: (g: Goal) => void;
  onDelete: (g: Goal) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: goal.id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <GoalCard
        goal={goal}
        onEdit={onEdit}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

function Column({
  status,
  title,
  goals,
  onEdit,
  onDelete,
}: {
  status: Status;
  title: string;
  goals: Goal[];
  onEdit: (g: Goal) => void;
  onDelete: (g: Goal) => void;
}) {
  const { setNodeRef } = useDroppable({ id: `col:${status}` });
  return (
    <div className="flex flex-col rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <h2 className="mb-3 flex items-center justify-between px-1 text-sm font-semibold text-ink">
        {title}
        <span className="rounded-full bg-white/10 px-2 text-xs text-muted">
          {goals.length}
        </span>
      </h2>
      <SortableContext
        items={goals.map((g) => g.id)}
        strategy={verticalListSortingStrategy}
      >
        <div ref={setNodeRef} className="min-h-[80px] space-y-2">
          {goals.map((g) => (
            <SortableGoal
              key={g.id}
              goal={g}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

const emptyForm = {
  title: "",
  category: "PRODUCTIVITY",
  targetDate: "",
  progress: 0,
  status: "NOT_STARTED" as Status,
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [form, setForm] = useState(emptyForm);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  async function load() {
    const r = await fetch("/api/goals");
    if (r.ok) setGoals((await r.json()).goals as Goal[]);
  }
  useEffect(() => {
    load();
  }, []);

  function colItems(status: Status) {
    return goals
      .filter((g) => g.status === status)
      .sort((a, b) => a.order - b.order);
  }

  function persistDiff(prev: Goal[], next: Goal[]) {
    // ponytail: only PATCH cards whose status/order actually changed
    for (const g of next) {
      const p = prev.find((x) => x.id === g.id);
      if (p && (p.order !== g.order || p.status !== g.status)) {
        fetch("/api/goals", {
          method: "PATCH",
          headers: HEADERS,
          body: JSON.stringify({ id: g.id, status: g.status, order: g.order }),
        });
      }
    }
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const activeGoal = goals.find((g) => g.id === activeId);
    if (!activeGoal) return;

    const targetStatus: Status = overId.startsWith("col:")
      ? (overId.slice(4) as Status)
      : (goals.find((g) => g.id === overId)?.status ?? activeGoal.status);

    const prev = goals;
    const working = goals.map((g) => ({ ...g }));
    const moved = working.find((g) => g.id === activeId)!;
    const sourceStatus = moved.status;

    const targetCol = working
      .filter((g) => g.status === targetStatus && g.id !== activeId)
      .sort((a, b) => a.order - b.order);

    let insertIndex = targetCol.length;
    if (!overId.startsWith("col:")) {
      const idx = targetCol.findIndex((g) => g.id === overId);
      if (idx !== -1) insertIndex = idx;
    }

    moved.status = targetStatus;
    targetCol.splice(insertIndex, 0, moved);
    targetCol.forEach((g, i) => (g.order = i));

    if (sourceStatus !== targetStatus) {
      working
        .filter((g) => g.status === sourceStatus && g.id !== activeId)
        .sort((a, b) => a.order - b.order)
        .forEach((g, i) => (g.order = i));
    }

    setGoals(working);
    persistDiff(prev, working);
  }

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }
  function openEdit(g: Goal) {
    setEditing(g);
    setForm({
      title: g.title,
      category: g.category,
      targetDate: g.targetDate ? g.targetDate.slice(0, 10) : "",
      progress: g.progress,
      status: g.status,
    });
    setOpen(true);
  }

  async function submit() {
    if (!form.title.trim()) return;
    const payload = {
      title: form.title,
      category: form.category,
      progress: form.progress,
      targetDate: form.targetDate || null,
    };
    const r = editing
      ? await fetch("/api/goals", {
          method: "PATCH",
          headers: HEADERS,
          body: JSON.stringify({
            id: editing.id,
            ...payload,
            status: form.status,
          }),
        })
      : await fetch("/api/goals", {
          method: "POST",
          headers: HEADERS,
          body: JSON.stringify(payload),
        });
    if (r.ok) {
      setOpen(false);
      await load();
    }
  }

  async function del(g: Goal) {
    await fetch(`/api/goals?id=${g.id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl text-ink">Goals</h1>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> Add goal
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={onDragEnd}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {COLUMNS.map((c) => (
            <Column
              key={c.status}
              status={c.status}
              title={c.title}
              goals={colItems(c.status)}
              onEdit={openEdit}
              onDelete={del}
            />
          ))}
        </div>
      </DndContext>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit goal" : "New goal"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="gtitle">Title</Label>
              <Input
                id="gtitle"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Run a half marathon"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gdate">Target date</Label>
              <Input
                id="gdate"
                type="date"
                value={form.targetDate}
                onChange={(e) =>
                  setForm({ ...form, targetDate: e.target.value })
                }
                className="[color-scheme:dark]"
              />
            </div>
            <div className="space-y-2">
              <Label>
                Progress —{" "}
                <span className="font-mono text-ink">{form.progress}%</span>
              </Label>
              <Slider
                min={0}
                max={100}
                step={1}
                value={[form.progress]}
                onValueChange={(v) => setForm({ ...form, progress: v[0] })}
              />
            </div>
            {editing && (
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm({ ...form, status: v as Status })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLUMNS.map((c) => (
                      <SelectItem key={c.status} value={c.status}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button onClick={submit} className="w-full">
              {editing ? "Save changes" : "Create goal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
