"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "success" | "error";
type Toast = { id: number; message: string; variant: Variant };
type Ctx = { toast: (message: string, variant?: Variant) => void };

const ToastCtx = createContext<Ctx>({ toast: () => {} });
export const useToast = () => useContext(ToastCtx);

let counter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, variant: Variant = "default") => {
    const id = ++counter;
    setToasts((t) => [...t, { id, message, variant }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 md:inset-x-auto md:bottom-6 md:right-6 md:items-end">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "glass animate-toast-in pointer-events-auto max-w-xs rounded-xl px-4 py-2.5 text-sm font-medium shadow-glow-lg",
              t.variant === "success" && "text-foreground ring-1 ring-white/25",
              t.variant === "error" && "border-red-500/30 text-red-400",
              t.variant === "default" && "text-foreground"
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
