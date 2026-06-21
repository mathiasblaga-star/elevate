// Offline-first habit ticks: when a tick fails (offline), queue it in localStorage and
// replay on reconnect. ponytail: localStorage queue, not IndexedDB — ticks are tiny.
// Known ceiling: a tick is a toggle, so replay assumes the offline attempt never reached
// the server (true when fully offline). Upgrade to a server-side idempotency key if needed.

const KEY = "elevate-tick-queue";

type TickResult = { ok: boolean; queued?: boolean; data?: unknown };

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
function write(q: string[]) {
  localStorage.setItem(KEY, JSON.stringify(q));
}

export async function tickHabit(id: string): Promise<TickResult> {
  try {
    const r = await fetch(`/api/habits/${id}/check`, { method: "POST" });
    if (!r.ok) throw new Error(String(r.status));
    return { ok: true, data: await r.json() };
  } catch {
    write([...read(), id]);
    return { ok: false, queued: true };
  }
}

export async function flushQueue(): Promise<void> {
  const q = read();
  if (!q.length) return;
  const remaining: string[] = [];
  for (const id of q) {
    try {
      const r = await fetch(`/api/habits/${id}/check`, { method: "POST" });
      if (!r.ok) remaining.push(id);
    } catch {
      remaining.push(id);
    }
  }
  write(remaining);
}

export function pendingCount(): number {
  return read().length;
}
