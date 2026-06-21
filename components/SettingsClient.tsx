"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { normalizeWeights, DEFAULT_WEIGHTS } from "@/lib/lifeScore";
import { applyTheme, applyAccent } from "@/components/ThemeController";

type User = {
  name: string | null;
  email: string;
  avatar: string | null;
  emailDigest: boolean;
  theme: string;
  accent: string;
  lifeScoreWeights: unknown;
};

const WEIGHT_KEYS = ["habits", "goals", "mood", "journal"] as const;
type WeightKey = (typeof WEIGHT_KEYS)[number];

function Note({ msg }: { msg: { type: "ok" | "err"; text: string } | null }) {
  if (!msg) return null;
  return (
    <p
      className={cn(
        "rounded-md px-3 py-2 text-sm",
        msg.type === "ok"
          ? "bg-white/10 text-foreground"
          : "bg-red-500/10 text-red-400"
      )}
    >
      {msg.text}
    </p>
  );
}

export function SettingsClient({ user }: { user: User }) {
  const router = useRouter();

  const [name, setName] = useState(user.name ?? "");
  const [avatar, setAvatar] = useState(user.avatar ?? "#262626");
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [digest, setDigest] = useState(user.emailDigest);

  // Life Score weights as integer percentages (0-100) for the sliders.
  const initialWeights = normalizeWeights(
    (user.lifeScoreWeights as Partial<Record<WeightKey, number>>) ?? null
  );
  const [weights, setWeights] = useState<Record<WeightKey, number>>({
    habits: Math.round(initialWeights.habits * 100),
    goals: Math.round(initialWeights.goals * 100),
    mood: Math.round(initialWeights.mood * 100),
    journal: Math.round(initialWeights.journal * 100),
  });
  const [weightsMsg, setWeightsMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const weightTotal = WEIGHT_KEYS.reduce((s, k) => s + weights[k], 0);

  async function saveWeights() {
    setWeightsMsg(null);
    // send as fractions; server re-normalises
    const r = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lifeScoreWeights: {
          habits: weights.habits,
          goals: weights.goals,
          mood: weights.mood,
          journal: weights.journal,
        },
      }),
    });
    setWeightsMsg(
      r.ok
        ? { type: "ok", text: "Weighting saved" }
        : { type: "err", text: "Could not save weighting" }
    );
    if (r.ok) router.refresh();
  }

  const [theme, setTheme] = useState(user.theme);
  const [accent, setAccent] = useState(user.accent);

  function changeTheme(value: string) {
    setTheme(value);
    applyTheme(value);
    fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: value }),
    });
  }
  function changeAccent(value: string) {
    setAccent(value);
    applyAccent(value);
  }
  function saveAccent() {
    fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accent }),
    });
  }

  const [confirmDelete, setConfirmDelete] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function saveProfile() {
    setProfileMsg(null);
    const r = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, avatar }),
    });
    setProfileMsg(
      r.ok
        ? { type: "ok", text: "Profile updated" }
        : { type: "err", text: "Could not update profile" }
    );
    if (r.ok) router.refresh();
  }

  async function changePassword() {
    setPwMsg(null);
    if (next !== confirm) {
      setPwMsg({ type: "err", text: "New passwords don't match" });
      return;
    }
    const r = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    if (r.ok) {
      setPwMsg({ type: "ok", text: "Password changed" });
      setCurrent("");
      setNext("");
      setConfirm("");
    } else {
      const d = await r.json().catch(() => ({}));
      const text =
        typeof d.error === "string"
          ? d.error
          : Object.values(d.error ?? {})[0]?.toString() ||
            "Could not change password";
      setPwMsg({ type: "err", text });
    }
  }

  async function toggleDigest() {
    const value = !digest;
    setDigest(value);
    await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailDigest: value }),
    });
  }

  async function deleteAccount() {
    setDeleting(true);
    const r = await fetch("/api/user", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: confirmDelete }),
    });
    if (r.ok) {
      await signOut({ callbackUrl: "/" });
    } else {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-4xl text-ink">Settings</h1>

      {/* Profile */}
      <Card className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Profile</h2>
        <div className="space-y-1.5">
          <Label htmlFor="name">Display name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="avatar">Avatar colour</Label>
          <div className="flex items-center gap-3">
            <input
              id="avatar"
              type="color"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border border-white/10 bg-transparent"
            />
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{ background: avatar }}
            >
              {(name || user.email)[0]?.toUpperCase()}
            </div>
          </div>
        </div>
        <Note msg={profileMsg} />
        <Button onClick={saveProfile}>Save profile</Button>
      </Card>

      {/* Password */}
      <Card className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Password</h2>
        <div className="space-y-1.5">
          <Label htmlFor="current">Current password</Label>
          <Input id="current" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="next">New password</Label>
          <Input id="next" type="password" value={next} onChange={(e) => setNext(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm new password</Label>
          <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <Note msg={pwMsg} />
        <Button onClick={changePassword}>Change password</Button>
      </Card>

      {/* Appearance */}
      <Card className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Appearance</h2>
        <div className="space-y-1.5">
          <Label>Theme</Label>
          <div className="flex rounded-lg border border-white/10 p-0.5">
            {[
              { v: "oled", label: "OLED black" },
              { v: "dark", label: "Dark" },
            ].map((t) => (
              <button
                key={t.v}
                onClick={() => changeTheme(t.v)}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-sm transition",
                  theme === t.v ? "bg-white/10 text-foreground" : "text-muted hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="accent">Accent colour</Label>
          <div className="flex items-center gap-3">
            <input
              id="accent"
              type="color"
              value={accent}
              onChange={(e) => changeAccent(e.target.value)}
              onBlur={saveAccent}
              className="h-10 w-14 cursor-pointer rounded border border-white/10 bg-transparent"
            />
            <Button variant="secondary" onClick={saveAccent}>
              Save accent
            </Button>
            <button
              onClick={() => {
                changeAccent("#ffffff");
                fetch("/api/user", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ accent: "#ffffff" }),
                });
              }}
              className="text-sm text-muted hover:text-foreground"
            >
              Reset
            </button>
          </div>
        </div>
      </Card>

      {/* Data export */}
      <Card className="space-y-3">
        <h2 className="font-display text-2xl text-ink">Your data</h2>
        <p className="text-sm text-muted">
          Download everything you&apos;ve tracked. Yours to keep, anytime.
        </p>
        <div className="flex gap-2">
          <Button asChild variant="secondary">
            <a href="/api/user/export?format=json" download>
              Export JSON
            </a>
          </Button>
          <Button asChild variant="secondary">
            <a href="/api/user/export?format=csv" download>
              Export CSV
            </a>
          </Button>
        </div>
      </Card>

      {/* Life Score weighting */}
      <Card className="space-y-4">
        <div>
          <h2 className="font-display text-2xl text-ink">Life Score weighting</h2>
          <p className="text-sm text-muted">
            Decide how much each dimension counts toward your Life Score. Values are
            normalised, so they don&apos;t need to sum to 100.
          </p>
        </div>
        {WEIGHT_KEYS.map((k) => (
          <div key={k} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="capitalize text-foreground">{k}</span>
              <span className="font-mono text-muted">
                {weightTotal > 0 ? Math.round((weights[k] / weightTotal) * 100) : 0}%
              </span>
            </div>
            <Slider
              min={0}
              max={100}
              step={5}
              value={[weights[k]]}
              onValueChange={(v) => setWeights((w) => ({ ...w, [k]: v[0] }))}
            />
          </div>
        ))}
        <Note msg={weightsMsg} />
        <div className="flex gap-2">
          <Button onClick={saveWeights} disabled={weightTotal === 0}>
            Save weighting
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              setWeights({
                habits: DEFAULT_WEIGHTS.habits * 100,
                goals: DEFAULT_WEIGHTS.goals * 100,
                mood: DEFAULT_WEIGHTS.mood * 100,
                journal: DEFAULT_WEIGHTS.journal * 100,
              })
            }
          >
            Reset to default
          </Button>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-ink">Email digest</h2>
          <p className="text-sm text-muted">Weekly summary of your progress.</p>
        </div>
        <button
          onClick={toggleDigest}
          role="switch"
          aria-checked={digest}
          className={cn(
            "relative h-6 w-11 rounded-full transition-colors duration-300",
            digest ? "bg-white/90" : "bg-white/15"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full transition-all duration-300",
              digest ? "left-[22px] bg-black" : "left-0.5 bg-white"
            )}
          />
        </button>
      </Card>

      {/* Danger zone */}
      <Card className="space-y-3 border-red-500/30">
        <h2 className="font-display text-2xl text-red-400">Danger zone</h2>
        <p className="text-sm text-muted">
          This permanently deletes your account and all data. Type{" "}
          <span className="font-mono text-ink">DELETE</span> to confirm.
        </p>
        <Input
          value={confirmDelete}
          onChange={(e) => setConfirmDelete(e.target.value)}
          placeholder="DELETE"
        />
        <Button
          variant="destructive"
          disabled={confirmDelete !== "DELETE" || deleting}
          onClick={deleteAccount}
        >
          {deleting ? "Deleting…" : "Delete my account"}
        </Button>
      </Card>
    </div>
  );
}
