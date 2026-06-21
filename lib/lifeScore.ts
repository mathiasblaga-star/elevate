export interface LifeScoreInputs {
  habitCompletionRate: number; // 0-100
  goalProgressAvg: number; // 0-100
  moodAvg: number; // 0-10 (avg mood score over window)
  journalStreak: number; // consecutive days with a journal entry
}

export interface LifeScoreWeights {
  habits: number;
  goals: number;
  mood: number;
  journal: number;
}

export const DEFAULT_WEIGHTS: LifeScoreWeights = {
  habits: 0.3,
  goals: 0.3,
  mood: 0.2,
  journal: 0.2,
};

export interface LifeScoreBreakdown {
  total: number; // 0-100
  categories: LifeScoreWeights; // each normalised 0-100
  weights: LifeScoreWeights;
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));

/** Normalise arbitrary positive weights so they sum to 1 (falls back to defaults if invalid). */
export function normalizeWeights(w: Partial<LifeScoreWeights> | null | undefined): LifeScoreWeights {
  if (!w) return DEFAULT_WEIGHTS;
  const h = Math.max(0, w.habits ?? 0);
  const g = Math.max(0, w.goals ?? 0);
  const m = Math.max(0, w.mood ?? 0);
  const j = Math.max(0, w.journal ?? 0);
  const sum = h + g + m + j;
  if (sum <= 0) return DEFAULT_WEIGHTS;
  return { habits: h / sum, goals: g / sum, mood: m / sum, journal: j / sum };
}

/** Per-category normalised values (0-100) + weighted total. */
export function lifeScoreBreakdown(
  i: LifeScoreInputs,
  weights: LifeScoreWeights = DEFAULT_WEIGHTS
): LifeScoreBreakdown {
  const categories: LifeScoreWeights = {
    habits: clamp(i.habitCompletionRate),
    goals: clamp(i.goalProgressAvg),
    mood: clamp((i.moodAvg / 10) * 100),
    journal: clamp(Math.min(i.journalStreak, 100)),
  };
  const total = Math.round(
    categories.habits * weights.habits +
      categories.goals * weights.goals +
      categories.mood * weights.mood +
      categories.journal * weights.journal
  );
  return { total: clamp(total), categories, weights };
}

/** Composite life score 0-100 (back-compat wrapper). */
export function lifeScore(i: LifeScoreInputs, weights: LifeScoreWeights = DEFAULT_WEIGHTS): number {
  return lifeScoreBreakdown(i, weights).total;
}

// ponytail: self-check — run `npx tsx lib/lifeScore.ts`
if (process.argv[1]?.includes("lifeScore")) {
  const max = lifeScore({ habitCompletionRate: 100, goalProgressAvg: 100, moodAvg: 10, journalStreak: 100 });
  console.assert(max === 100, `max should be 100, got ${max}`);
  const min = lifeScore({ habitCompletionRate: 0, goalProgressAvg: 0, moodAvg: 0, journalStreak: 0 });
  console.assert(min === 0, `min should be 0, got ${min}`);
  const mid = lifeScore({ habitCompletionRate: 50, goalProgressAvg: 50, moodAvg: 5, journalStreak: 50 });
  console.assert(mid === 50, `mid should be 50, got ${mid}`);
  const capped = lifeScore({ habitCompletionRate: 0, goalProgressAvg: 0, moodAvg: 0, journalStreak: 500 });
  console.assert(capped === 20, `capped streak should be 20, got ${capped}`);
  // custom weights: all weight on habits -> equals habit rate
  const custom = lifeScore(
    { habitCompletionRate: 80, goalProgressAvg: 0, moodAvg: 0, journalStreak: 0 },
    normalizeWeights({ habits: 1, goals: 0, mood: 0, journal: 0 })
  );
  console.assert(custom === 80, `custom-weighted should be 80, got ${custom}`);
  // normalize sums to 1
  const nw = normalizeWeights({ habits: 2, goals: 2, mood: 1, journal: 1 });
  console.assert(Math.abs(nw.habits + nw.goals + nw.mood + nw.journal - 1) < 1e-9, "weights sum to 1");
  console.log("lifeScore self-check passed");
}
