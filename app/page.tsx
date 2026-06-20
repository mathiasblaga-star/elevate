import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  Target,
  Smile,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { LifeScoreRing } from "@/components/LifeScoreRing";
import { Button } from "@/components/ui/button";

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

const TESTIMONIALS = [
  {
    initials: "JR",
    name: "Jordan Reyes",
    quote:
      "Elevate is the first tracker that actually stuck. The life score keeps me honest.",
  },
  {
    initials: "AML",
    name: "Amelia Lewis",
    quote:
      "Seeing habits, goals and mood in one ring changed how I plan my weeks.",
  },
  {
    initials: "DK",
    name: "Devin Kapoor",
    quote: "Clean, fast, and genuinely motivating. My streaks have never been longer.",
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-center">
        <div className="absolute inset-0 grid-bg" />
        <header className="absolute left-0 top-0 flex w-full items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            <span className="font-display text-2xl text-ink">Elevate</span>
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
          <LifeScoreRing score={78} size={200} />
          <div className="space-y-4">
            <h1 className="font-display text-6xl leading-none text-ink md:text-8xl">
              Live at full capacity.
            </h1>
            <p className="mx-auto max-w-xl text-lg text-muted">
              Track every dimension of your life — habits, goals, mood, and
              growth — in one place.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
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
        <h2 className="mb-12 text-center font-display text-4xl text-ink md:text-5xl">
          Everything in one place
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass p-6">
              <f.icon className="h-7 w-7 text-violet-500" />
              <h3 className="mt-4 text-lg font-semibold text-ink">{f.title}</h3>
              <p className="mt-2 text-sm text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-5xl px-4 pb-24">
        <h2 className="mb-12 text-center font-display text-4xl text-ink md:text-5xl">
          Loved by people building better days
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="glass p-6">
              <p className="text-ink/90">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet/20 text-sm font-semibold text-violet-500">
                  {t.initials}
                </div>
                <span className="text-sm font-medium text-ink">{t.name}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            <span className="font-display text-xl text-ink">Elevate</span>
          </div>
          <nav className="flex gap-6 text-sm text-muted">
            <Link href="/login" className="hover:text-ink">
              Log in
            </Link>
            <Link href="/register" className="hover:text-ink">
              Start free
            </Link>
            <a href="#features" className="hover:text-ink">
              Features
            </a>
          </nav>
          <span className="text-xs text-muted">Built with Next.js</span>
        </div>
      </footer>
    </div>
  );
}
