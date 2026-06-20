import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
      <div className="absolute inset-0 grid-bg opacity-60" />
      <Link
        href="/"
        className="relative mb-8 flex items-center gap-2"
      >
        <Sparkles className="h-6 w-6 text-violet-500" />
        <span className="font-display text-3xl text-ink">Elevate</span>
      </Link>
      <div className="relative w-full max-w-sm">{children}</div>
    </div>
  );
}
