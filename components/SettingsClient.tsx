"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type User = {
  name: string | null;
  email: string;
  avatar: string | null;
  emailDigest: boolean;
};

function Note({ msg }: { msg: { type: "ok" | "err"; text: string } | null }) {
  if (!msg) return null;
  return (
    <p
      className={cn(
        "rounded-md px-3 py-2 text-sm",
        msg.type === "ok"
          ? "bg-mint/10 text-mint"
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
            "relative h-6 w-11 rounded-full transition",
            digest ? "bg-violet" : "bg-white/15"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
              digest ? "left-[22px]" : "left-0.5"
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
