import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/api";

// PNG share card showing the user's best current streak. Node runtime (auth + prisma).
export async function GET() {
  const userId = await getUserId();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const [user, habits] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
    prisma.habit.findMany({ where: { userId }, select: { streak: true } }),
  ]);
  const best = habits.reduce((m, h) => Math.max(m, h.streak), 0);
  const name = user?.name ?? user?.email?.split("@")[0] ?? "Someone";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 28, color: "#9ca3af", letterSpacing: 4 }}>ELEVATE</div>
        <div style={{ fontSize: 160, fontWeight: 700, lineHeight: 1, marginTop: 16 }}>{best}</div>
        <div style={{ fontSize: 40, marginTop: 8 }}>day streak</div>
        <div style={{ fontSize: 28, color: "#9ca3af", marginTop: 28 }}>
          {name} is building better days
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
