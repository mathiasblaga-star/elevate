import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/Sidebar";
import { NotificationBell } from "@/components/NotificationBell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, avatar: true },
  });
  const initial = (user?.name ?? user?.email ?? "?")[0]?.toUpperCase() ?? "?";

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="md:pl-60">
        <header className="sticky top-0 z-20 flex items-center justify-end gap-3 border-b border-white/10 bg-navy/70 px-4 py-3 backdrop-blur-xl md:px-8">
          <NotificationBell />
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ background: user?.avatar ?? "#7C3AED" }}
            title={user?.name ?? user?.email ?? ""}
          >
            {initial}
          </div>
        </header>
        <main className="px-4 pb-24 pt-6 md:px-8 md:pb-10">{children}</main>
      </div>
    </div>
  );
}
