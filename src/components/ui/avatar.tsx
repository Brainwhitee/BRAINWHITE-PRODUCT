"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "busy" | "away";
  children?: React.ReactNode;
}

export function Avatar({
  src,
  alt = "User",
  fallback,
  size = "md",
  status,
  className,
  children,
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  const sizeStyles = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-11 w-11 text-base",
    xl: "h-14 w-14 text-lg",
  };

  const statusStyles = {
    online: "bg-white",
    offline: "bg-white/30",
    busy: "bg-white/60",
    away: "bg-white/40",
  };

  const statusSize = {
    sm: "h-2 w-2 right-0 bottom-0",
    md: "h-2.5 w-2.5 right-0 bottom-0",
    lg: "h-3 w-3 right-0.5 bottom-0.5",
    xl: "h-3.5 w-3.5 right-1 bottom-1",
  };

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-full flex-shrink-0 select-none overflow-hidden font-semibold border border-slate-200/80 bg-slate-100 text-slate-700 shadow-xs transition-transform hover:scale-105",
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children ? (
        children
      ) : src && !imageError ? (
        <img
          src={src}
          alt={alt}
          onError={() => setImageError(true)}
          className="h-full w-full object-cover rounded-full"
        />
      ) : (
        <span className="font-mono uppercase font-bold text-slate-800">
          {fallback || "U"}
        </span>
      )}

      {status && (
        <span
          className={cn(
            "absolute rounded-full ring-2 ring-white",
            statusStyles[status],
            statusSize[size]
          )}
        />
      )}
    </div>
  );
}

export function AvatarImage({
  src,
  alt = "Avatar",
  className,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src={src}
      alt={alt}
      className={cn("h-full w-full object-cover rounded-full", className)}
      {...props}
    />
  );
}

export function AvatarFallback({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "flex h-full w-full items-center justify-center font-mono uppercase font-bold text-slate-800",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

interface AvatarGroupProps {
  users: { name: string; fallback: string; src?: string; role?: string; status?: "online" | "offline" | "busy" | "away" }[];
  max?: number;
  size?: "sm" | "md";
}

export function AvatarGroup({ users, max = 3, size = "sm" }: AvatarGroupProps) {
  const visible = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className="flex items-center -space-x-2 overflow-hidden py-1">
      {visible.map((user, i) => (
        <div key={i} className="relative group cursor-pointer">
          <Avatar
            src={user.src}
            fallback={user.fallback}
            alt={user.name}
            size={size}
            status={user.status}
            className="ring-2 ring-white hover:z-10 hover:ring-indigo-500 transition-all"
          />
          {/* Tooltip on hover */}
          <div className="absolute bottom-full left-1/2 -translate-y-1/2 mb-1.5 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
            <div className="px-2 py-1 rounded-md bg-slate-900 text-white text-[10px] font-mono whitespace-nowrap shadow-lg">
              <span className="font-bold">{user.name}</span>
              {user.role && <span className="text-slate-400 block">{user.role}</span>}
            </div>
            <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 -mt-0.5" />
          </div>
        </div>
      ))}

      {remaining > 0 && (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-slate-100 text-slate-700 font-mono font-bold border border-slate-200 ring-2 ring-white text-[10px]",
            size === "sm" ? "h-7 w-7" : "h-9 w-9"
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
