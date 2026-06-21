import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[80px] w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-ink placeholder:text-muted transition-all duration-200 ease-liquid hover:border-white/20 focus-visible:border-violet/40 focus-visible:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet/40 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
