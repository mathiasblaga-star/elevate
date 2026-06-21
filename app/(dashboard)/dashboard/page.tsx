import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDashboardStats } from "@/lib/stats";
import { getHeatmap } from "@/lib/heatmap";
import { todayUTC, MOOD_LABELS } from "@/lib/utils";
import { LifeScoreRing } from "@/components/LifeScoreRing";
import { LifeScoreRadar } from "@/components/LifeScoreRadar";
import { HabitHeatmap } from "@/components/HabitHeatmap";
import { MoodChart } from "@/components/MoodChart";
import { DashboardHabits } from "@/components/DashboardHabits";
import { Card } from "@/components/ui/card";
import { Target, CheckCircle2, Flame, Smile } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [stats, habits, todayEntries, journal, heatmap] = await Promise.all([
    getDashboardStats(userId),
    prisma.habit.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.habitEntry.findMany({
      where: { userId, date: todayUTC(), completed: true },
      select: { habitId: true },
    }),
    prisma.journalEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    getHeatmap(userId, 133),
  ]);

  const done = new Set(todayEntries.map((e) => e.habitId));
  const todayHabits = habits.map((h) => ({
    id: h.id,
    name: h.name,
    category: h.category as string,
    doneToday: done.has(h.id),
  }));

  const metrics = [
    { label: "Active goals", value: stats.activeGoals, icon: Target },
    {
      label: "Habits done today",
      value: `${stats.todaysHabitsDone}/${stats.todaysHabitsTotal}`,
      icon: CheckCircle2,
    },
    { label: "Best streak", value: stats.bestStreak, icon: Flame },
    { label: "Avg mood (7d)", value: stats.moodAvg7d || "—", icon: Smile },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex justify-end">
        <Link
          href="/review"
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-muted transition hover:text-foreground"
        >
          Weekly review →
        </Link>
      </div>

      {/* Life score ring + radar breakdown */}
      <section className="grid items-center gap-6 md:grid-cols-2">
        <div className="flex flex-col items-center gap-2 pt-2">
          <LifeScoreRing score={stats.lifeScore} />
          <p className="text-sm text-muted">
            Composite of habits, goals, mood &amp; journaling
          </p>
        </div>
        <Card>
          <h2 className="mb-1 font-display text-2xl text-ink">Score breakdown</h2>
          <p className="mb-2 text-xs text-muted">
            Weighted across your four dimensions — tune the weights in Settings.
          </p>
          <LifeScoreRadar breakdown={stats.scoreBreakdown} weights={stats.weights} />
        </Card>
      </section>

      {/* Stat row */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label} className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">{m.label}</span>
              <m.icon className="h-4 w-4 text-muted" />
            </div>
            <p className="mt-2 font-mono text-2xl text-ink">{m.value}</p>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's habits */}
        <Card>
          <h2 className="mb-3 font-display text-2xl text-ink">Today&apos;s habits</h2>
          <DashboardHabits initial={todayHabits} />
        </Card>

        {/* Recent journal */}
        <Card>
          <h2 className="mb-3 font-display text-2xl text-ink">Recent journal</h2>
          {journal.length === 0 ? (
            <p className="text-sm text-muted">
              No entries yet — write your first on the Journal page.
            </p>
          ) : (
            <ul className="space-y-3">
              {journal.map((j) => (
                <li
                  key={j.id}
                  className="rounded-lg border border-white/5 bg-white/[0.02] p-3"
                >
                  <div className="mb-1 flex items-center justify-between text-xs text-muted">
                    <span className="uppercase tracking-wide">{MOOD_LABELS[j.mood - 1]}</span>
                    <span>{new Date(j.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="line-clamp-2 text-sm text-ink/90">{j.content}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Global habit heatmap */}
      <Card>
        <h2 className="mb-3 font-display text-2xl text-ink">
          Consistency — last 19 weeks
        </h2>
        <HabitHeatmap days={heatmap} />
      </Card>

      {/* Mood chart */}
      <Card>
        <h2 className="mb-3 font-display text-2xl text-ink">
          Mood — last 14 days
        </h2>
        <MoodChart data={stats.moodSeries} />
      </Card>
    </div>
  );
}
