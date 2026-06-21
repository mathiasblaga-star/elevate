import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/Sidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeController } from "@/components/ThemeController";
import { ToastProvider } from "@/components/ui/toast";
import { PageTransition } from "@/components/PageTransition";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, avatar: true, theme: true, accent: true },
  });
  const initial = (user?.name ?? user?.email ?? "?")[0]?.toUpperCase() ?? "?";

  return (
    <ToastProvider>
      <div className="relative min-h-screen overflow-hidden">
        <ThemeController theme={user?.theme ?? "oled"} accent={user?.accent ?? "#ffffff"} />
        <Sidebar />
        <div className="relative md:pl-60">
          <header className="sticky top-0 z-20 flex items-center justify-end gap-3 border-b border-white/10 bg-navy/70 px-4 py-3 backdrop-blur-xl md:px-8">
            <NotificationBell />
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white ring-1 ring-white/15 transition-transform duration-300 ease-liquid hover:scale-105"
              style={{ background: user?.avatar ?? "#262626" }}
              title={user?.name ?? user?.email ?? ""}
            >
              {initial}
            </div>
          </header>
          <main className="px-4 pb-28 pt-6 md:px-8 md:pb-10">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
