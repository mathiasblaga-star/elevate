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

const EMOJI = ["😣", "😞", "😕", "😐", "🙂", "😊", "😄", "😁", "🤩", "🥳"]; // score 1-10
const moodEmoji = (s: number) => EMOJI[Math.max(1, Math.min(10, s)) - 1];

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
          <div className="text-6xl">{moodEmoji(score)}</div>
          <p className="mt-2 font-mono text-2xl text-ink">{score}/10</p>
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
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.7} />
                  <stop offset="50%" stopColor="#F59E0B" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity={0.3} />
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
                  background: "#131929",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: "#F0EEF9",
                }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#10B981"
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
