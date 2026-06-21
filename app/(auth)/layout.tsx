import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      <div className="aurora" />
      <div className="absolute inset-0 grid-bg opacity-60" />
      <Link
        href="/"
        className="relative mb-8 flex items-center gap-2 animate-fade-in-up"
      >
        <Logo className="h-8 w-8 text-ink" />
        <span className="font-display text-3xl text-ink">Elevate</span>
      </Link>
      <div className="relative w-full max-w-sm animate-fade-in-up [animation-delay:100ms]">
        {children}
      </div>
    </div>
  );
}
