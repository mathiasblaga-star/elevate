export interface LifeScoreInputs {
  habitCompletionRate: number; // 0-100
  goalProgressAvg: number; // 0-100
  moodAvg: number; // 0-10 (avg mood score over window)
  journalStreak: number; // consecutive days with a journal entry
}

/**
 * Composite life score 0-100:
 * habitCompletionRate*0.3 + goalProgressAvg*0.3 + (moodAvg/10*100)*0.2 + min(journalStreak,100)*0.2
 */
export function lifeScore(i: LifeScoreInputs): number {
  const raw =
    i.habitCompletionRate * 0.3 +
    i.goalProgressAvg * 0.3 +
    (i.moodAvg / 10) * 100 * 0.2 +
    Math.min(i.journalStreak, 100) * 0.2;
  return Math.round(Math.max(0, Math.min(100, raw)));
}

// ponytail: self-check — run `npx tsx lib/lifeScore.ts`
if (process.argv[1]?.includes("lifeScore")) {
  const max = lifeScore({ habitCompletionRate: 100, goalProgressAvg: 100, moodAvg: 10, journalStreak: 100 });
  console.assert(max === 100, `max should be 100, got ${max}`);
  const min = lifeScore({ habitCompletionRate: 0, goalProgressAvg: 0, moodAvg: 0, journalStreak: 0 });
  console.assert(min === 0, `min should be 0, got ${min}`);
  const mid = lifeScore({ habitCompletionRate: 50, goalProgressAvg: 50, moodAvg: 5, journalStreak: 50 });
  console.assert(mid === 50, `mid should be 50, got ${mid}`);
  // journal streak caps at 100 days
  const capped = lifeScore({ habitCompletionRate: 0, goalProgressAvg: 0, moodAvg: 0, journalStreak: 500 });
  console.assert(capped === 20, `capped streak should be 20, got ${capped}`);
  console.log("lifeScore self-check passed");
}
