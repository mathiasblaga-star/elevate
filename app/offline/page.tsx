import { Logo } from "@/components/Logo";

export const metadata = { title: "Offline — Elevate" };

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <Logo className="h-10 w-10 text-foreground" />
      <h1 className="font-display text-3xl text-foreground">You&apos;re offline</h1>
      <p className="max-w-sm text-muted">
        Elevate needs a connection for this page. Any habits you ticked offline will sync
        automatically once you&apos;re back online.
      </p>
    </div>
  );
}
