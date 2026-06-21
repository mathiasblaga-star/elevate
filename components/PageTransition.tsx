"use client";

import { usePathname } from "next/navigation";

// Re-mounts on route change (keyed by pathname) so content re-runs its entrance animation.
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="animate-fade-in">
      {children}
    </div>
  );
}
