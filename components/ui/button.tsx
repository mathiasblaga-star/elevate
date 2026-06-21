import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 ease-liquid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet/60 focus-visible:ring-offset-2 focus-visible:ring-offset-navy active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-violet to-indigo text-white shadow-glow hover:-translate-y-0.5 hover:shadow-glow-lg",
        secondary: "bg-white/5 text-ink hover:bg-white/10 hover:-translate-y-0.5 border border-white/10",
        outline: "border border-white/15 text-ink hover:bg-white/5 hover:border-white/25",
        ghost: "text-ink hover:bg-white/5",
        destructive: "bg-red-600 text-white hover:bg-red-500 hover:-translate-y-0.5 active:scale-[0.97]",
        link: "text-violet-500 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
