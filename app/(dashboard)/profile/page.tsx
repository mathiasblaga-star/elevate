import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { xpProgress } from "@/lib/xp";
import { BADGES } from "@/lib/badges";
import { Card } from "@/components/ui/card";
import { Award, Snowflake, Lock } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();
  const userId = session!.user.id;

  const [user, earned] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, avatar: true, xp: true, level: true, streakFreezeTokens: true },
    }),
    prisma.userBadge.findMany({ where: { userId }, select: { key: true } }),
  ]);
  if (!user) return null;

  const earnedKeys = new Set(earned.map((b) => b.key));
  const p = xpProgress(user.xp);
  const pct = p.span > 0 ? Math.round((p.intoLevel / p.span) * 100) : 100;
  const initial = (user.name ?? user.email ?? "?")[0]?.toUpperCase() ?? "?";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-4xl text-ink">Profile</h1>

      {/* Level + XP */}
      <Card className="space-y-5">
        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-semibold text-white ring-1 ring-white/15"
            style={{ background: user.avatar ?? "#262626" }}
          >
            {initial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-foreground">
              {user.name ?? user.email}
            </p>
            <p className="text-sm text-muted">Level {p.level}</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-sm text-foreground ring-1 ring-white/10">
            <Snowflake className="h-4 w-4" />
            {user.streakFreezeTokens} freeze{user.streakFreezeTokens === 1 ? "" : "s"}
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs text-muted">
            <span>{p.xp} XP</span>
            <span className="font-mono">
              {p.intoLevel}/{p.span} to L{p.level + 1}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500 ease-liquid"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Badges */}
      <Card className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Badges</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {BADGES.map((b) => {
            const has = earnedKeys.has(b.key);
            return (
              <div
                key={b.key}
                className={`rounded-xl border p-4 text-center transition ${
                  has
                    ? "border-white/20 bg-white/[0.06]"
                    : "border-white/5 bg-white/[0.02] opacity-50"
                }`}
              >
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
                  {has ? (
                    <Award className="h-5 w-5 text-foreground" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted" />
                  )}
                </div>
                <p className="text-sm font-medium text-foreground">{b.name}</p>
                <p className="mt-0.5 text-[11px] text-muted">{b.description}</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
