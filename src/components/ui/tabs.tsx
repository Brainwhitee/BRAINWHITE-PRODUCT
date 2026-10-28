"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({ defaultValue, value, onValueChange, className, children, ...props }: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "");
  const activeValue = value !== undefined ? value : internalValue;

  const handleValueChange = React.useCallback(
    (val: string) => {
      if (value === undefined) {
        setInternalValue(val);
      }
      onValueChange?.(val);
    },
    [value, onValueChange]
  );

  return (
    <TabsContext.Provider value={{ value: activeValue, onValueChange: handleValueChange }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "line" | "pill";
}

export function TabsList({ className, variant = "line", ...props }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        variant === "line"
          ? "inline-flex items-center gap-6 border-b border-[var(--border)] w-full overflow-x-auto scrollbar-none"
          : "inline-flex items-center gap-1 rounded-lg bg-[var(--surface-subtle)] p-1 border border-[var(--border)]",
        className
      )}
      {...props}
    />
  );
}

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  variant?: "line" | "pill";
}

export function TabsTrigger({ value, className, variant = "line", children, ...props }: TabsTriggerProps) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("TabsTrigger must be used within Tabs");

  const isSelected = context.value === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      onClick={() => context.onValueChange(value)}
      className={cn(
        "cursor-pointer text-sm font-medium transition-all select-none disabled:pointer-events-none disabled:opacity-50",
        variant === "line"
          ? cn(
              "pb-3 pt-1 border-b-2 -mb-[1px] whitespace-nowrap",
              isSelected
                ? "border-[var(--brand-orange)] text-[var(--foreground)] font-semibold"
                : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--border-strong)]"
            )
          : cn(
              "px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider",
              isSelected
                ? "bg-[var(--surface)] text-[var(--foreground)] shadow-xs font-bold"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
            ),
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({ value, className, children, ...props }: TabsContentProps) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("TabsContent must be used within Tabs");

  if (context.value !== value) return null;

  return (
    <div
      role="tabpanel"
      tabIndex={0}
      className={cn("mt-4 focus-visible:outline-none", className)}
      {...props}
    >
      {children}
    </div>
  );
}
