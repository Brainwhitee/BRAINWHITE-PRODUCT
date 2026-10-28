"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TooltipContextValue {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

const TooltipContext = React.createContext<TooltipContextValue | undefined>(undefined);

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ children, delayDuration = 200 }: { children: React.ReactNode; delayDuration?: number }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, delayDuration);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(false);
  };

  return (
    <TooltipContext.Provider value={{ isOpen, setIsOpen }}>
      <div
        className="relative inline-flex"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
      >
        {children}
      </div>
    </TooltipContext.Provider>
  );
}

export function TooltipTrigger({
  children,
  className,
  asChild,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }) {
  return (
    <div className={cn("inline-flex", className)} {...props}>
      {children}
    </div>
  );
}

export function TooltipContent({
  children,
  className,
  side = "top",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { side?: "top" | "bottom" | "left" | "right" }) {
  const context = React.useContext(TooltipContext);
  if (!context?.isOpen) return null;

  const sideClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
    left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
    right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
  }[side];

  return (
    <div
      role="tooltip"
      className={cn(
        "absolute z-50 pointer-events-none whitespace-nowrap rounded-md bg-[var(--foreground)] px-2.5 py-1 text-xs text-[var(--background)] shadow-md animate-in fade-in zoom-in-95 duration-100",
        sideClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
