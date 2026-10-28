"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownContextValue {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  hoverIntent: boolean;
}

const DropdownContext = React.createContext<DropdownContextValue | undefined>(undefined);

export interface DropdownMenuProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hoverIntent?: boolean;
}

export function DropdownMenu({ children, open, onOpenChange, hoverIntent = false }: DropdownMenuProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const closeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const openTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const setIsOpen = React.useCallback<React.Dispatch<React.SetStateAction<boolean>>>(
    (action) => {
      const next = typeof action === "function" ? action(isOpen) : action;
      if (!isControlled) {
        setInternalOpen(next);
      }
      onOpenChange?.(next);
    },
    [isControlled, isOpen, onOpenChange]
  );

  // Close on Escape & Outside Click
  React.useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    function handleClickOutside(e: MouseEvent) {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        contentRef.current &&
        !contentRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen, triggerRef, contentRef, hoverIntent }}>
      <div
        className="relative inline-block text-left"
        onMouseEnter={() => {
          if (!hoverIntent) return;
          if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
          openTimeoutRef.current = setTimeout(() => {
            setIsOpen(true);
          }, 120); // 120ms hover intent
        }}
        onMouseLeave={() => {
          if (!hoverIntent) return;
          if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
          closeTimeoutRef.current = setTimeout(() => {
            setIsOpen(false);
          }, 150); // 150ms grace period
        }}
      >
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({
  children,
  className,
  asChild,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const context = React.useContext(DropdownContext);
  if (!context) throw new Error("DropdownMenuTrigger must be inside DropdownMenu");

  return (
    <button
      ref={context.triggerRef}
      type="button"
      aria-haspopup="menu"
      aria-expanded={context.isOpen}
      onClick={() => context.setIsOpen((prev) => !prev)}
      className={cn("inline-flex items-center outline-none cursor-pointer", className)}
      {...props}
    >
      {children}
    </button>
  );
}

export interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "left" | "right" | "center";
  sideOffset?: number;
}

export function DropdownMenuContent({
  children,
  className,
  align = "left",
  sideOffset = 6,
  ...props
}: DropdownMenuContentProps) {
  const context = React.useContext(DropdownContext);
  if (!context) throw new Error("DropdownMenuContent must be inside DropdownMenu");

  if (!context.isOpen) return null;

  const alignClasses =
    align === "right"
      ? "right-0 origin-top-right"
      : align === "center"
      ? "left-1/2 -translate-x-1/2 origin-top"
      : "left-0 origin-top-left";

  return (
    <div
      ref={context.contentRef}
      role="menu"
      tabIndex={-1}
      style={{ marginTop: sideOffset }}
      className={cn(
        "absolute z-50 min-w-[220px] rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] p-1.5 shadow-xl transition-all animate-in fade-in zoom-in-95 duration-150 motion-reduce:transition-none focus:outline-none",
        alignClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  children,
  className,
  disabled,
  onClick,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { disabled?: boolean }) {
  const context = React.useContext(DropdownContext);

  return (
    <div
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={(e) => {
        if (disabled) return;
        onClick?.(e);
        context?.setIsOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!disabled) {
            onClick?.(e as any);
            context?.setIsOpen(false);
          }
        }
      }}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none transition-colors hover:bg-[var(--surface-subtle)] focus:bg-[var(--surface-subtle)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuLabel({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-3 py-1.5 font-mono text-[11px] font-semibold tracking-wider text-[var(--muted-foreground)] uppercase",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="separator"
      className={cn("-mx-1 my-1.5 h-px bg-[var(--border)]", className)}
      {...props}
    />
  );
}
