"use client";

import { useEffect, useState } from "react";
import { Plus, CheckCircle2 } from "lucide-react";
import { HabitCard, type Habit } from "@/components/HabitCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { CATEGORIES } from "@/lib/utils";

const HEADERS = { "Content-Type": "application/json" };

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "HEALTH",
    frequency: "DAILY",
  });

  async function load() {
    const r = await fetch("/api/habits");
    if (r.ok) setHabits((await r.json()).habits as Habit[]);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setEditing(null);
    setForm({ name: "", category: "HEALTH", frequency: "DAILY" });
    setOpen(true);
  }
  function openEdit(h: Habit) {
    setEditing(h);
    setForm({ name: h.name, category: h.category, frequency: h.frequency });
    setOpen(true);
  }

  async function check(h: Habit) {
    setBusy(h.id);
    const r = await fetch(`/api/habits/${h.id}/check`, { method: "POST" });
    if (r.ok) {
      const d = await r.json();
      setHabits((prev) =>
        prev.map((x) =>
          x.id === h.id
            ? {
                ...x,
                doneToday: d.completed,
                streak: d.streak,
                longestStreak: d.longestStreak,
              }
            : x
        )
      );
    }
    setBusy(null);
  }

  async function submit() {
    if (!form.name.trim()) return;
    const r = editing
      ? await fetch("/api/habits", {
          method: "PATCH",
          headers: HEADERS,
          body: JSON.stringify({ id: editing.id, ...form }),
        })
      : await fetch("/api/habits", {
          method: "POST",
          headers: HEADERS,
          body: JSON.stringify(form),
        });
    if (r.ok) {
      setOpen(false);
      await load();
    }
  }

  async function del(h: Habit) {
    await fetch(`/api/habits?id=${h.id}`, { method: "DELETE" });
    await load();
  }

  const groups = CATEGORIES.map((cat) => ({
    cat,
    items: habits.filter((h) => h.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl text-ink">Habits</h1>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> New habit
        </Button>
      </div>

      {!loading && habits.length === 0 && (
        <div className="glass flex flex-col items-center gap-3 py-16 text-center">
          <CheckCircle2 className="h-10 w-10 text-violet-500" />
          <p className="text-muted">No habits yet.</p>
          <Button onClick={openNew}>Add your first habit</Button>
        </div>
      )}

      {groups.map((g) => (
        <section key={g.cat} className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
            {g.cat}
          </h2>
          <div className="space-y-2">
            {g.items.map((h) => (
              <HabitCard
                key={h.id}
                habit={h}
                onCheck={check}
                onEdit={openEdit}
                onDelete={del}
                busy={busy === h.id}
              />
            ))}
          </div>
        </section>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit habit" : "New habit"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="hname">Name</Label>
              <Input
                id="hname"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Morning run"
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
              <Label>Frequency</Label>
              <Select
                value={form.frequency}
                onValueChange={(v) => setForm({ ...form, frequency: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={submit} className="w-full">
              {editing ? "Save changes" : "Create habit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
