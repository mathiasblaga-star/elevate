"use client";

import { useEffect, useState } from "react";
import { Flame, UserPlus, Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Partner = { id: string; name: string; bestStreak: number };
type Sent = { id: string; email: string };
type Received = { id: string; from: string };

export function Partners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [sent, setSent] = useState<Sent[]>([]);
  const [received, setReceived] = useState<Received[]>([]);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const r = await fetch("/api/partners");
    if (!r.ok) return;
    const d = await r.json();
    setPartners(d.partners);
    setSent(d.sentPending);
    setReceived(d.received);
  }
  useEffect(() => {
    load();
  }, []);

  async function invite() {
    setMsg("");
    const r = await fetch("/api/partners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (r.ok) {
      setEmail("");
      load();
    } else {
      const d = await r.json().catch(() => ({}));
      setMsg(typeof d.error === "object" ? Object.values(d.error)[0] as string : "Could not send invite");
    }
  }

  async function act(id: string, action: "accept" | "decline") {
    await fetch("/api/partners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/partners?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="font-display text-2xl text-ink">Accountability partners</h2>
        <p className="text-sm text-muted">
          Partners share streak counts only — never your journal, mood, or goals.
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="partner@email.com"
        />
        <Button onClick={invite} disabled={!email.trim()}>
          <UserPlus className="h-4 w-4" /> Invite
        </Button>
      </div>
      {msg && <p className="text-sm text-red-400">{msg}</p>}

      {received.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted">Invites for you</p>
          {received.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2"
            >
              <span className="text-sm text-foreground">{r.from}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => act(r.id, "accept")}
                  className="rounded-md bg-white/10 p-1.5 text-foreground hover:bg-white/20"
                  aria-label="Accept"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => act(r.id, "decline")}
                  className="rounded-md p-1.5 text-muted hover:text-red-400"
                  aria-label="Decline"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {partners.length > 0 && (
        <div className="space-y-2">
          {partners.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2"
            >
              <span className="text-sm text-foreground">{p.name}</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-sm text-muted">
                  <Flame className="h-4 w-4" /> {p.bestStreak}
                </span>
                <button
                  onClick={() => remove(p.id)}
                  className="text-muted hover:text-red-400"
                  aria-label="Remove partner"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {sent.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted">Pending sent</p>
          {sent.map((s) => (
            <div key={s.id} className="flex items-center justify-between text-sm text-muted">
              <span>{s.email}</span>
              <button onClick={() => remove(s.id)} className="hover:text-red-400">
                Cancel
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
