import { auth } from "@/lib/auth";
import { getWeeklyReview } from "@/lib/review";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

function Delta({ value, suffix = "" }: { value: number; suffix?: string }) {
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted">
      <Icon className="h-3.5 w-3.5" />
      {value > 0 ? "+" : ""}
      {value}
      {suffix} vs last week
    </span>
  );
}

export default async function ReviewPage() {
  const session = await auth();
  const r = await getWeeklyReview(session!.user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-4xl text-ink">Weekly review</h1>
        <p className="mt-1 text-sm text-muted">Your last 7 days at a glance.</p>
      </div>

      <Card className="text-center">
        <p className="text-sm text-muted">Momentum vs last week</p>
        <p className="mt-1 font-mono text-5xl text-foreground">
          {r.momentumDelta > 0 ? "+" : ""}
          {r.momentumDelta}
        </p>
        <p className="mt-1 text-xs text-muted">
          Weighted habit consistency &amp; mood, compared to the prior week.
        </p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-muted">Habits completed</p>
          <p className="mt-1 font-mono text-3xl text-foreground">{r.habitsThisWeek}</p>
          <Delta value={r.habitsThisWeek - r.habitsLastWeek} />
        </Card>
        <Card>
          <p className="text-sm text-muted">Best current streak</p>
          <p className="mt-1 font-mono text-3xl text-foreground">{r.bestStreak}</p>
          <span className="text-xs text-muted">days</span>
        </Card>
        <Card>
          <p className="text-sm text-muted">Journal entries</p>
          <p className="mt-1 font-mono text-3xl text-foreground">{r.journalThisWeek}</p>
          <Delta value={r.journalThisWeek - r.journalLastWeek} />
        </Card>
        <Card>
          <p className="text-sm text-muted">Average mood</p>
          <p className="mt-1 font-mono text-3xl text-foreground">
            {r.moodThisWeek ?? "—"}
            {r.moodThisWeek != null && <span className="text-base text-muted">/10</span>}
          </p>
          {r.moodThisWeek != null && r.moodLastWeek != null && (
            <Delta value={Math.round((r.moodThisWeek - r.moodLastWeek) * 10) / 10} />
          )}
        </Card>
        <Card>
          <p className="text-sm text-muted">Goals completed</p>
          <p className="mt-1 font-mono text-3xl text-foreground">{r.goalsMoved}</p>
          <span className="text-xs text-muted">this week</span>
        </Card>
        <Card>
          <p className="text-sm text-muted">Focused time</p>
          <p className="mt-1 font-mono text-3xl text-foreground">{r.focusMinutes}</p>
          <span className="text-xs text-muted">minutes</span>
        </Card>
      </div>

      {r.worstMoodDay && (
        <Card>
          <p className="text-sm text-muted">Toughest day</p>
          <p className="mt-1 text-foreground">
            {new Date(r.worstMoodDay.date).toLocaleDateString(undefined, {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}{" "}
            — mood averaged{" "}
            <span className="font-mono">{r.worstMoodDay.score}/10</span>. Be kind to yourself.
          </p>
        </Card>
      )}
    </div>
  );
}
