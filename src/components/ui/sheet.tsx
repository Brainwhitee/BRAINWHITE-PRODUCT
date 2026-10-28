"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextValue | undefined>(undefined);

export interface SheetProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Sheet({ children, open: controlledOpen, onOpenChange: controlledOnOpenChange }: SheetProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const onOpenChange = React.useCallback(
    (val: boolean) => {
      if (!isControlled) {
        setInternalOpen(val);
      }
      controlledOnOpenChange?.(val);
    },
    [isControlled, controlledOnOpenChange]
  );

  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
}

export function SheetTrigger({
  children,
  className,
  asChild,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const context = React.useContext(SheetContext);
  if (!context) throw new Error("SheetTrigger must be used inside Sheet");

  return (
    <button
      type="button"
      onClick={() => context.onOpenChange(!context.open)}
      className={cn("cursor-pointer", className)}
      {...props}
    >
      {children}
    </button>
  );
}

export interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "left" | "right";
}

export function SheetContent({
  children,
  className,
  side = "right",
  ...props
}: SheetContentProps) {
  const context = React.useContext(SheetContext);
  if (!context) throw new Error("SheetContent must be used inside Sheet");

  const { open, onOpenChange } = context;

  // Handle escape key
  React.useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed top-0 bottom-0 z-50 flex flex-col w-full max-w-sm bg-[var(--surface)] text-[var(--foreground)] border-[var(--border)] shadow-2xl p-6 transition ease-in-out duration-200",
          side === "right"
            ? "right-0 border-l animate-in slide-in-from-right"
            : "left-0 border-r animate-in slide-in-from-left",
          className
        )}
        {...props}
      >
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-subtle)] transition-colors"
          aria-label="Close sheet"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  );
}

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-2 text-left mb-6", className)}
      {...props}
    />
  );
}

export function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg font-semibold text-[var(--foreground)]", className)}
      {...props}
    />
  );
}
