import Link from "next/link";
import { Logo } from "@/components/Logo";

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
        <Logo className="h-8 w-8 text-ink" />
        <span className="font-display text-3xl text-ink">Elevate</span>
      </Link>
      <div className="relative w-full max-w-sm">{children}</div>
    </div>
  );
}
