"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Home,
  CheckCircle2,
  Target,
  BookOpen,
  Smile,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/habits", label: "Habits", icon: CheckCircle2 },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/mood", label: "Mood", icon: Smile },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-60 flex-col border-r border-white/10 bg-card/40 p-4 backdrop-blur-xl md:flex">
        <Link href="/dashboard" className="mb-8 flex items-center gap-2 px-2">
          <Logo className="h-6 w-6 text-ink" />
          <span className="font-display text-2xl text-ink">Elevate</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300 ease-liquid",
                  active
                    ? "bg-white/10 text-foreground ring-1 ring-white/15"
                    : "text-muted hover:translate-x-0.5 hover:bg-white/5 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-all duration-300 ease-liquid hover:translate-x-0.5 hover:bg-white/5 hover:text-ink"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 z-30 flex w-full items-center justify-around border-t border-white/10 bg-card/80 px-2 py-2 backdrop-blur-xl md:hidden">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-md px-2 py-1 text-[10px] transition-colors duration-300",
                active ? "text-violet-500" : "text-muted"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
