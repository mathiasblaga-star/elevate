import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function dayUTC(offset: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
}

async function main() {
  const email = "demo@elevate.app";
  await prisma.user.deleteMany({ where: { email } }); // idempotent reseed (cascades children)

  const user = await prisma.user.create({
    data: {
      email,
      name: "Demo",
      passwordHash: await bcrypt.hash("password", 10),
      avatar: "#7C3AED",
    },
  });
  const userId = user.id;

  const habits = await Promise.all(
    [
      { name: "Morning meditation", category: "MINDSET" as const, streak: 5, longestStreak: 12 },
      { name: "Drink 2L water", category: "HEALTH" as const, streak: 3, longestStreak: 9 },
      { name: "Read 20 minutes", category: "PRODUCTIVITY" as const, streak: 0, longestStreak: 7 },
      { name: "Call a friend", category: "SOCIAL" as const, frequency: "WEEKLY" as const, streak: 2, longestStreak: 4 },
    ].map((h) =>
      prisma.habit.create({
        data: { userId, frequency: "DAILY", ...h },
      })
    )
  );

  // mark first two habits done today + a few past days
  for (const h of habits.slice(0, 2)) {
    for (let i = 0; i < 4; i++) {
      await prisma.habitEntry.create({
        data: { userId, habitId: h.id, date: dayUTC(-i), completed: true },
      });
    }
  }

  await Promise.all([
    prisma.goal.create({
      data: { userId, title: "Run a half marathon", category: "HEALTH", status: "IN_PROGRESS", progress: 60, targetDate: dayUTC(90), order: 0 },
    }),
    prisma.goal.create({
      data: { userId, title: "Save 3-month emergency fund", category: "FINANCE", status: "IN_PROGRESS", progress: 35, targetDate: dayUTC(180), order: 1 },
    }),
    prisma.goal.create({
      data: { userId, title: "Read 12 books this year", category: "MINDSET", status: "NOT_STARTED", progress: 0, order: 0 },
    }),
    prisma.goal.create({
      data: { userId, title: "Launch side project", category: "PRODUCTIVITY", status: "COMPLETED", progress: 100, order: 0 },
    }),
  ]);

  await Promise.all([
    prisma.journalEntry.create({
      data: { userId, content: "Felt focused today. Knocked out the hardest task before lunch.", mood: 5, tags: ["work", "win"], createdAt: dayUTC(0) },
    }),
    prisma.journalEntry.create({
      data: { userId, content: "A bit tired but kept the streak going. Small steps.", mood: 3, tags: ["reflection"], createdAt: dayUTC(-1) },
    }),
    prisma.journalEntry.create({
      data: { userId, content: "Great workout, then a long walk. Mind feels clear.", mood: 4, tags: ["health"], createdAt: dayUTC(-2) },
    }),
  ]);

  // 14 days of mood logs
  const scores = [6, 7, 5, 8, 7, 6, 9, 8, 7, 7, 6, 8, 9, 7];
  await Promise.all(
    scores.map((score, i) =>
      prisma.moodLog.create({
        data: { userId, score, createdAt: dayUTC(-(scores.length - 1 - i)) },
      })
    )
  );

  await prisma.notification.create({
    data: { userId, message: "🔥 5-day streak on Morning meditation!", type: "STREAK" },
  });

  console.log(`Seeded demo user: ${email} / password`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
