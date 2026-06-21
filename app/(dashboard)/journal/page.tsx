"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MOOD_LABELS, cn } from "@/lib/utils";

type Entry = {
  id: string;
  content: string;
  mood: number;
  tags: string[];
  createdAt: string;
};

const HEADERS = { "Content-Type": "application/json" };

export default function JournalPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<Entry | null>(null);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState(3);
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (p: number, append: boolean) => {
    const r = await fetch(`/api/journal?page=${p}`);
    if (!r.ok) return;
    const d = await r.json();
    setEntries((prev) => (append ? [...prev, ...d.entries] : d.entries));
    setHasMore(d.hasMore);
    setPage(p);
  }, []);

  useEffect(() => {
    load(1, false);
  }, [load]);

  function reset() {
    setSelected(null);
    setContent("");
    setMood(3);
    setTags("");
  }

  function select(e: Entry) {
    setSelected(e);
    setContent(e.content);
    setMood(e.mood);
    setTags(e.tags.join(", "));
  }

  async function save() {
    if (!content.trim()) return;
    setSaving(true);
    const tagArr = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const payload = { content, mood, tags: tagArr };
    const r = selected
      ? await fetch("/api/journal", {
          method: "PATCH",
          headers: HEADERS,
          body: JSON.stringify({ id: selected.id, ...payload }),
        })
      : await fetch("/api/journal", {
          method: "POST",
          headers: HEADERS,
          body: JSON.stringify(payload),
        });
    if (r.ok) {
      reset();
      await load(1, false);
    }
    setSaving(false);
  }

  async function del(e: Entry) {
    await fetch(`/api/journal?id=${e.id}`, { method: "DELETE" });
    if (selected?.id === e.id) reset();
    await load(1, false);
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[320px_1fr]">
      {/* List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl text-ink">Journal</h1>
          <Button size="sm" onClick={reset}>
            <Plus className="h-4 w-4" /> New
          </Button>
        </div>
        {entries.length === 0 ? (
          <p className="text-sm text-muted">No entries yet.</p>
        ) : (
          <ul className="space-y-2">
            {entries.map((e) => (
              <li key={e.id}>
                <button
                  onClick={() => select(e)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-lg border p-3 text-left transition",
                    selected?.id === e.id
                      ? "border-white/30 bg-white/10"
                      : "border-white/5 bg-white/[0.02] hover:bg-white/5"
                  )}
                >
                  <span className="shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
                    {MOOD_LABELS[e.mood - 1]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs text-muted">
                      {new Date(e.createdAt).toLocaleDateString()}
                    </span>
                    <span className="block truncate text-sm text-ink/90">
                      {e.content.slice(0, 80)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {hasMore && (
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => load(page + 1, true)}
          >
            Load more
          </Button>
        )}
      </div>

      {/* Editor */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-ink">
            {selected ? "Edit entry" : "New entry"}
          </h2>
          {selected && (
            <button
              onClick={() => del(selected)}
              className="text-muted transition hover:text-red-400"
              aria-label="Delete entry"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="min-h-[220px]"
          maxLength={10000}
        />
        <div className="text-right text-xs text-muted">
          {content.length} characters
        </div>

        <div>
          <p className="mb-2 text-sm text-muted">How are you feeling?</p>
          <div className="grid grid-cols-5 gap-2">
            {MOOD_LABELS.map((label, i) => (
              <button
                key={i}
                onClick={() => setMood(i + 1)}
                className={cn(
                  "flex h-11 flex-col items-center justify-center rounded-lg border text-xs font-medium transition",
                  mood === i + 1
                    ? "border-white/40 bg-white/10 text-foreground"
                    : "border-white/10 text-muted hover:bg-white/5"
                )}
              >
                <span className="font-mono text-sm">{i + 1}</span>
                <span className="text-[10px]">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm text-muted">Tags (comma separated)</label>
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="work, gratitude, health"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={save} disabled={saving || !content.trim()}>
            {saving ? "Saving…" : selected ? "Update entry" : "Save entry"}
          </Button>
          {selected && (
            <Button variant="ghost" onClick={reset}>
              Cancel
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
