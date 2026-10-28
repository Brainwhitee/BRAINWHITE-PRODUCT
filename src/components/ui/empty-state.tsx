import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] p-8 text-center bg-[var(--surface-subtle)]/50",
        className
      )}
    >
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface)] border border-[var(--border)] mb-4 text-[var(--muted-foreground)]">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h3 className="text-base font-semibold text-[var(--foreground)]">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-[var(--muted-foreground)] leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onAction}
          className="mt-4"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
