import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[.98]", {
  variants: {
    variant: {
      default: "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 shadow-sm",
      secondary: "bg-[var(--surface-muted)] text-[var(--foreground)] hover:bg-[var(--border)]",
      outline: "border bg-[var(--surface)] hover:bg-[var(--surface-muted)]",
      ghost: "hover:bg-[var(--surface-muted)]",
      destructive: "bg-rose-600 text-white hover:bg-rose-700",
    },
    size: { default: "h-10 px-4", sm: "h-8 rounded-lg px-3 text-xs", lg: "h-12 px-6", icon: "size-10" },
  }, defaultVariants: { variant: "default", size: "default" },
});

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean }
export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
