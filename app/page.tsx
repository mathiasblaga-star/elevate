import Link from "next/link";
import {
  CheckCircle2,
  Target,
  Smile,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { LifeScoreRing } from "@/components/LifeScoreRing";
import { Button } from "@/components/ui/button";
import { getPublicStats } from "@/lib/publicStats";

const FEATURES = [
  {
    icon: CheckCircle2,
    title: "Habit Tracking",
    desc: "Build streaks and watch consistency compound day after day.",
  },
  {
    icon: Target,
    title: "Goal Setting",
    desc: "Set ambitions across every area and track progress to done.",
  },
  {
    icon: Smile,
    title: "Mood Logging",
    desc: "Capture how you feel and spot patterns over time.",
  },
  {
    icon: BookOpen,
    title: "Journal",
    desc: "Reflect daily with tags and mood to remember what mattered.",
  },
];

const fmt = (n: number) => n.toLocaleString("en-US");

export default async function Home() {
  const stats = await getPublicStats();
  const liveStats = [
    { label: "Habits tracked", value: fmt(stats.habitsTracked) },
    { label: "Goals completed", value: fmt(stats.goalsCompleted) },
    { label: "Entries logged", value: fmt(stats.entriesLogged) },
    { label: "Active members", value: fmt(stats.activeUsers) },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-center">
        <div className="absolute inset-0 grid-bg" />
        <header className="absolute left-0 top-0 z-10 flex w-full items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <Logo className="h-6 w-6 text-foreground" />
            <span className="font-display text-2xl text-foreground">Elevate</span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">Start free</Link>
            </Button>
          </div>
        </header>

        <div className="relative flex flex-col items-center gap-8">
          <div className="animate-fade-in-up">
            <LifeScoreRing score={78} size={200} />
          </div>
          <div className="space-y-4 animate-fade-in-up [animation-delay:120ms]">
            <h1 className="font-display text-6xl font-semibold leading-none text-foreground md:text-8xl">
              Live at full capacity.
            </h1>
            <p className="mx-auto max-w-xl text-lg text-muted">
              Track every dimension of your life — habits, goals, mood, and
              growth — in one place.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 animate-fade-in-up [animation-delay:240ms]">
            <Button asChild size="lg">
              <Link href="/register">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#features">See how it works</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-5xl px-4 py-24">
        <h2 className="mb-12 text-center font-display text-4xl font-semibold text-foreground md:text-5xl">
          Everything in one place
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="glass glass-interactive p-6 animate-fade-in-up"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                <f.icon className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Live stats */}
      <section className="mx-auto max-w-5xl px-4 pb-24">
        <h2 className="mb-12 text-center font-display text-4xl font-semibold text-foreground md:text-5xl">
          Built on real momentum
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {liveStats.map((s, i) => (
            <div
              key={s.label}
              className="glass p-6 text-center animate-fade-in-up"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <p className="font-mono text-4xl font-semibold text-foreground">{s.value}</p>
              <p className="mt-2 text-sm text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="mx-auto max-w-5xl px-4 pb-24">
        <div className="glass relative overflow-hidden p-10 text-center sm:p-16">
          <div className="space-y-6">
            <h2 className="font-display text-4xl font-semibold text-foreground md:text-5xl">
              Ready to elevate?
            </h2>
            <p className="mx-auto max-w-md text-muted">
              Start tracking what matters today — free, no card required.
            </p>
            <Button asChild size="lg">
              <Link href="/register">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Logo className="h-5 w-5 text-foreground" />
            <span className="font-display text-xl text-foreground">Elevate</span>
          </div>
          <nav className="flex gap-6 text-sm text-muted">
            <Link href="/login" className="transition-colors hover:text-foreground">
              Log in
            </Link>
            <Link href="/register" className="transition-colors hover:text-foreground">
              Start free
            </Link>
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
          </nav>
          <span className="text-xs text-muted">Elevate</span>
        </div>
      </footer>
    </div>
  );
}
