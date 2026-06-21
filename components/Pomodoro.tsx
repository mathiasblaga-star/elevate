"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type Goal = { id: string; title: string };
const WORK_PRESETS = [15, 25, 50];
const BREAK_MIN = 5;
const NONE = "__none__";

export function Pomodoro() {
  const [workMin, setWorkMin] = useState(25);
  const [mode, setMode] = useState<"work" | "break">("work");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [goalId, setGoalId] = useState<string>(NONE);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadStats = useCallback(async () => {
    const r = await fetch("/api/pomodoro");
    if (r.ok) setTodayMinutes((await r.json()).todayMinutes);
  }, []);

  useEffect(() => {
    fetch("/api/goals")
      .then((r) => (r.ok ? r.json() : { goals: [] }))
      .then((d) => setGoals((d.goals ?? []).map((g: Goal) => ({ id: g.id, title: g.title }))));
    loadStats();
  }, [loadStats]);

  const total = (mode === "work" ? workMin : BREAK_MIN) * 60;

  const logSession = useCallback(async () => {
    await fetch("/api/pomodoro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ minutes: workMin, goalId: goalId === NONE ? null : goalId }),
    });
    loadStats();
  }, [workMin, goalId, loadStats]);

  // countdown
  useEffect(() => {
    if (!running) return;
    tick.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s > 1) return s - 1;
        // session finished
        if (mode === "work") {
          logSession();
          setMode("break");
          setRunning(false);
          return BREAK_MIN * 60;
        }
        setMode("work");
        setRunning(false);
        return workMin * 60;
      });
    }, 1000);
    return () => {
      if (tick.current) clearInterval(tick.current);
    };
  }, [running, mode, workMin, logSession]);

  function reset() {
    setRunning(false);
    setSecondsLeft(total);
  }
  function pickWork(m: number) {
    setWorkMin(m);
    if (mode === "work") setSecondsLeft(m * 60);
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const pct = total > 0 ? 1 - secondsLeft / total : 0;

  return (
    <Card className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-ink">Focus timer</h2>
        <span className="text-xs uppercase tracking-wide text-muted">
          {mode === "work" ? "Focus" : "Break"}
        </span>
      </div>

      <div className="relative mx-auto flex h-48 w-48 items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="#fafafa"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 46}
            strokeDashoffset={2 * Math.PI * 46 * (1 - pct)}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <span className="font-mono text-4xl text-foreground">
          {mm}:{ss}
        </span>
      </div>

      <div className="flex justify-center gap-2">
        {WORK_PRESETS.map((m) => (
          <button
            key={m}
            onClick={() => pickWork(m)}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              workMin === m
                ? "bg-white/10 text-foreground ring-1 ring-white/20"
                : "text-muted hover:bg-white/5"
            }`}
          >
            {m}m
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <span className="text-sm text-muted">Link to a goal (optional)</span>
        <Select value={goalId} onValueChange={setGoalId}>
          <SelectTrigger>
            <SelectValue placeholder="No goal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>No goal</SelectItem>
            {goals.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-center gap-2">
        <Button onClick={() => setRunning((r) => !r)}>
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {running ? "Pause" : "Start"}
        </Button>
        <Button variant="ghost" onClick={reset}>
          <RotateCcw className="h-4 w-4" /> Reset
        </Button>
      </div>

      <p className="text-center text-sm text-muted">
        <span className="font-mono text-foreground">{todayMinutes}</span> focused minutes today
      </p>
    </Card>
  );
}
