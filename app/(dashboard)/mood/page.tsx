"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// 1-10 mood scale, text labels (no emoji)
const MOOD_SCALE = [
  "Awful", "Bad", "Low", "Meh", "Okay", "Fine", "Good", "Great", "Amazing", "Euphoric",
];
const moodLabel = (s: number) => MOOD_SCALE[Math.max(1, Math.min(10, s)) - 1];

type Mood = { score: number; createdAt: string };

export default function MoodPage() {
  const [score, setScore] = useState(7);
  const [note, setNote] = useState("");
  const [moods, setMoods] = useState<Mood[]>([]);
  const [saving, setSaving] = useState(false);

  async function load() {
    const r = await fetch("/api/mood");
    if (r.ok) setMoods((await r.json()).moods);
  }
  useEffect(() => {
    load();
  }, []);

  async function submit() {
    setSaving(true);
    const r = await fetch("/api/mood", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score, note: note || null }),
    });
    if (r.ok) {
      setNote("");
      await load();
    }
    setSaving(false);
  }

  const data = moods.map((m) => ({
    date: new Date(m.createdAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    score: m.score,
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-4xl text-ink">Mood</h1>

      <Card className="space-y-6">
        <div className="text-center">
          <p className="font-display text-5xl text-foreground">{moodLabel(score)}</p>
          <p className="mt-2 font-mono text-2xl text-muted">{score}/10</p>
        </div>
        <Slider
          min={1}
          max={10}
          step={1}
          value={[score]}
          onValueChange={(v) => setScore(v[0])}
        />
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What's behind this mood? (optional)"
          maxLength={500}
        />
        <Button onClick={submit} disabled={saving} className="w-full">
          {saving ? "Logging…" : "Log mood"}
        </Button>
      </Card>

      <Card>
        <h2 className="mb-3 font-display text-2xl text-ink">Mood history</h2>
        {data.length === 0 ? (
          <p className="text-sm text-muted">No moods logged yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#9CA3AF", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 10]}
                tick={{ fill: "#9CA3AF", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  background: "#1a1a1a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: "#fafafa",
                }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#fafafa"
                strokeWidth={2}
                fill="url(#moodGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
