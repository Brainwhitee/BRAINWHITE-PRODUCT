"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.99]",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--brand-orange)] text-white hover:bg-[var(--brand-orange-hover)] shadow-sm font-semibold border border-transparent",
        default:
          "bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 shadow-sm font-medium",
        secondary:
          "bg-[var(--surface-subtle)] text-[var(--foreground)] hover:bg-[var(--border)] border border-[var(--border)] shadow-xs",
        outline:
          "border border-[var(--border)] bg-transparent text-[var(--foreground)] hover:bg-[var(--surface-subtle)] hover:border-[var(--border-strong)]",
        ghost:
          "text-[var(--foreground)] hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)]",
        destructive:
          "bg-[var(--status-error)] text-white hover:opacity-90 shadow-xs",
        link:
          "text-[var(--brand-blue)] underline-offset-4 hover:underline p-0 h-auto font-normal",
        subtle:
          "bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--surface-hover)] shadow-xs",
      },
      size: {
        default: "h-9.5 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        md: "h-9.5 px-4 text-sm",
        lg: "h-11 rounded-lg px-6 text-base font-medium",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
