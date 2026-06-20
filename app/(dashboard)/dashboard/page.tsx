import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDashboardStats } from "@/lib/stats";
import { todayUTC, MOOD_EMOJI } from "@/lib/utils";
import { LifeScoreRing } from "@/components/LifeScoreRing";
import { MoodChart } from "@/components/MoodChart";
import { DashboardHabits } from "@/components/DashboardHabits";
import { Card } from "@/components/ui/card";
import { Target, CheckCircle2, Flame, Smile } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [stats, habits, todayEntries, journal] = await Promise.all([
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
  ]);

  const done = new Set(todayEntries.map((e) => e.habitId));
  const todayHabits = habits.map((h) => ({
    id: h.id,
    name: h.name,
    category: h.category as string,
    doneToday: done.has(h.id),
  }));

  const metrics = [
    {
      label: "Active goals",
      value: stats.activeGoals,
      icon: Target,
      tint: "text-violet-500",
    },
    {
      label: "Habits done today",
      value: `${stats.todaysHabitsDone}/${stats.todaysHabitsTotal}`,
      icon: CheckCircle2,
      tint: "text-mint",
    },
    {
      label: "Best streak",
      value: stats.bestStreak,
      icon: Flame,
      tint: "text-amber",
    },
    {
      label: "Avg mood (7d)",
      value: stats.moodAvg7d || "—",
      icon: Smile,
      tint: "text-sky-400",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Life score ring */}
      <section className="flex flex-col items-center gap-2 pt-2">
        <LifeScoreRing score={stats.lifeScore} />
        <p className="text-sm text-muted">
          Composite of habits, goals, mood &amp; journaling
        </p>
      </section>

      {/* Stat row */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label} className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">{m.label}</span>
              <m.icon className={`h-4 w-4 ${m.tint}`} />
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
                    <span>{MOOD_EMOJI[j.mood - 1]}</span>
                    <span>{new Date(j.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="line-clamp-2 text-sm text-ink/90">{j.content}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

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
