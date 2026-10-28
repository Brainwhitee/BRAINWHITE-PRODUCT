import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wider uppercase transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--surface-subtle)] text-[var(--foreground)] border border-[var(--border)]",
        brand:
          "bg-[var(--brand-orange)]/10 text-[var(--brand-orange)] border border-[var(--brand-orange)]/25",
        success:
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
        warning:
          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
        destructive:
          "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
        info:
          "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20",
        outline:
          "text-[var(--foreground)] border border-[var(--border-strong)] bg-transparent",
        dev:
          "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30",
        lead:
          "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30",
        manager:
          "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30",
        admin:
          "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
