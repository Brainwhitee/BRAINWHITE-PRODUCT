"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  CheckSquare,
  FolderGit2,
  Users,
  ShieldCheck,
  Presentation,
  GitBranch,
  Home,
  Menu as MenuIcon,
  X,
  ExternalLink,
} from "lucide-react";

export interface NavItemConfig {
  label: string;
  href: string;
  iconName:
    | "LayoutDashboard"
    | "GraduationCap"
    | "CheckSquare"
    | "FolderGit2"
    | "Users"
    | "ShieldCheck"
    | "Presentation"
    | "BookOpen"
    | "GitBranch"
    | "Home";
}

const ICON_MAP = {
  LayoutDashboard,
  GraduationCap,
  CheckSquare,
  FolderGit2,
  Users,
  ShieldCheck,
  Presentation,
  BookOpen,
  GitBranch,
  Home,
};

export function SidebarNav({ items }: { items: NavItemConfig[] }) {
  const pathname = usePathname() || "";

  return (
    <div className="space-y-1">
      <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
        Main Navigation
      </div>

      {items.map((item) => {
        const Icon = ICON_MAP[item.iconName] || LayoutDashboard;
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" &&
            item.href !== "/learn" &&
            pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              isActive
                ? "bg-black text-white shadow-xs font-semibold"
                : "text-slate-600 hover:text-black hover:bg-slate-100/80"
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon
                className={`size-4.5 shrink-0 transition-colors ${
                  isActive ? "text-white" : "text-slate-500 group-hover:text-black"
                }`}
              />
              <span>{item.label}</span>
            </div>
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            )}
          </Link>
        );
      })}

      {/* Quick Action: Back to Home */}
      <div className="pt-4 mt-3 border-t border-slate-100">
        <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Quick Actions
        </div>
        <Link
          href="/"
          className="group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-black hover:bg-slate-100/80 transition-all duration-150"
        >
          <div className="flex items-center gap-3">
            <Home className="size-4.5 shrink-0 text-slate-500 group-hover:text-black" />
            <span>Back to Home</span>
          </div>
          <ExternalLink className="size-3.5 text-slate-400 group-hover:text-slate-600" />
        </Link>
      </div>
    </div>
  );
}

export function MobileNavToggle({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || "";

  const pageTitle = pathname
    ? pathname.replace("/", "").replace(/-/g, " ") || "Dashboard"
    : "Dashboard";

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-black transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <MenuIcon className="size-5" />
        </button>

        <div className="flex items-center gap-2 text-sm">
          <span className="font-bold text-black md:hidden">BrainWhite</span>
          <span className="text-slate-300 md:hidden">/</span>
          <span className="font-medium text-slate-600 capitalize">
            {pageTitle}
          </span>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 flex flex-col bg-white">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 z-20 p-2 rounded-lg bg-slate-100 text-slate-600 hover:text-black cursor-pointer"
              aria-label="Close navigation menu"
            >
              <X className="size-5" />
            </button>
            <div className="h-full overflow-y-auto" onClick={() => setOpen(false)}>
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
