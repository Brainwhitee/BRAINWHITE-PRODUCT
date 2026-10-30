"use client";

import React, { useState } from "react";
import Link from "next/link";
import { can, type Permission } from "@/lib/rbac";
import { SidebarNav, MobileNavToggle, type NavItemConfig } from "./SidebarNav";
import { Home, LogOut, Mail, Loader2, X } from "lucide-react";

export interface ShellUser {
  id?: string;
  name: string;
  role: string;
  email?: string;
  emailVerifiedAt?: string | Date | null;
  githubUsername?: string | null;
  org: { name: string; slug?: string };
}

export function Shell({
  user,
  children,
  wide,
}: {
  user: ShellUser;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const staff = user.role !== "CANDIDATE";

  // Build navigation configurations
  const navItems: NavItemConfig[] = staff
    ? [
        { label: "Dashboard", href: "/dashboard", iconName: "LayoutDashboard" },
        ...(can(user.role, "paths:manage") || can(user.role, "members:view")
          ? [{ label: "Learning Paths", href: "/paths", iconName: "GraduationCap" as const }]
          : []),
        { label: "Tasks", href: "/tasks", iconName: "CheckSquare" },
        ...(can(user.role, "codebase:view")
          ? [{ label: "Codebase", href: "/projects", iconName: "FolderGit2" as const }]
          : []),
        ...(can(user.role, "members:view")
          ? [{ label: "Team", href: "/team", iconName: "Users" as const }]
          : []),
        ...(can(user.role, "audit:view")
          ? [{ label: "Audit Log", href: "/audit", iconName: "ShieldCheck" as const }]
          : []),
        { label: "Slide Decks", href: "/slides", iconName: "Presentation" },
      ]
    : [
        { label: "My Learning", href: "/learn", iconName: "BookOpen" },
        { label: "My Tasks", href: "/tasks", iconName: "CheckSquare" },
        { label: "Codebase", href: "/projects", iconName: "FolderGit2" },
        { label: "Connect GitHub", href: "/connect-github", iconName: "GitBranch" },
      ];

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role.toUpperCase()) {
      case "OWNER":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "MANAGER":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "MENTOR":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "CANDIDATE":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  // Email verification banner for unverified users
  const isVerified = user.emailVerifiedAt !== undefined && user.emailVerifiedAt !== null;
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleResendVerification = async () => {
    setResending(true);
    setResendMessage(null);
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResendMessage("Verification email sent! Check your inbox.");
    } catch (err: unknown) {
      setResendMessage(err instanceof Error ? err.message : "Failed to resend. Try again.");
    } finally {
      setResending(false);
    }
  };

  const VerificationBanner = () => {
    if (isVerified) return null;
    return (
      <div className="mb-4 p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-100">
        <div className="flex items-start gap-3">
          <Mail className="w-5 h-5 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium">Verify your email address</p>
            <p className="text-sm mt-1">
              We sent a verification link to <strong>{user.email}</strong>. Click the link to unlock all features.
            </p>
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={handleResendVerification}
                disabled={resending}
                className="text-sm font-medium text-amber-700 dark:text-amber-300 underline hover:no-underline disabled:opacity-50 flex items-center gap-1.5"
              >
                {resending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  "Resend verification email"
                )}
              </button>
              {resendMessage && <span className="text-sm text-amber-600 dark:text-amber-400">{resendMessage}</span>}
            </div>
          </div>
          <button
            onClick={() => {}}
            className="shrink-0 text-amber-500 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  // Reusable Sidebar content markup
  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-white text-slate-900 border-r border-slate-200/90 select-none">
      {/* 1. TOP: COMPANY NAME IN DARK BLACK */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          title="Return to landing page"
        >
          <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center text-white font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
            BW
          </div>
          <div>
            <div className="text-black font-black text-xl tracking-tight leading-tight">
              BrainWhite
            </div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              {user.org.name}
            </div>
          </div>
        </Link>
      </div>

      {/* 2. USER AVATAR & NAME */}
      <div className="p-4 mx-3 my-3 rounded-2xl bg-slate-50 border border-slate-200/70 shadow-xs">
        <div className="flex items-center gap-3">
          {/* User Avatar */}
          <div className="relative shrink-0">
            {user.githubUsername ? (
              <img
                src={`https://github.com/${user.githubUsername}.png?size=80`}
                alt={user.name}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-200/80 shadow-xs"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-slate-900 to-slate-700 text-white font-bold text-sm flex items-center justify-center shadow-xs ring-2 ring-slate-200/80">
                {getInitials(user.name)}
              </div>
            )}
            {/* Online status indicator */}
            <span
              className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full ring-1 ring-emerald-600/20"
              title="Online"
            />
          </div>

          {/* User Name & Details */}
          <div className="min-w-0 flex-1">
            <div className="font-bold text-slate-900 text-sm truncate leading-tight">
              {user.name}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded border ${getRoleBadgeClass(
                  user.role
                )}`}
              >
                {user.role}
              </span>
            </div>
            {user.githubUsername ? (
              <div className="text-[11px] text-slate-500 truncate mt-0.5">
                @{user.githubUsername}
              </div>
            ) : user.email ? (
              <div className="text-[11px] text-slate-500 truncate mt-0.5">
                {user.email}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* 3. USER SPECIFIC BUTTONS & NAVIGATION */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <SidebarNav items={navItems} />
      </div>

      {/* 4. IN LAST: LOGOUT BUTTON */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60 mt-auto">
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full group flex items-center justify-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all duration-150 cursor-pointer"
          >
            <LogOut className="size-4 shrink-0 text-slate-500 group-hover:text-red-600 transition-colors" />
            <span>Log Out</span>
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex">
      {/* DESKTOP SIDEBAR (Static on Server, hydrated client links) */}
      <aside className="hidden md:flex md:w-64 lg:w-72 md:flex-col shrink-0 h-screen sticky top-0 z-30">
        {renderSidebarContent()}
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header bar for mobile drawer toggle & breadcrumb context */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3">
          <MobileNavToggle>
            {renderSidebarContent()}
          </MobileNavToggle>

          {/* Clean space for top-right MENU pill */}
          <div className="flex items-center gap-3 pr-24 md:pr-28">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{user.org.name}</span>
            </span>
          </div>
        </header>

        {/* Main page content */}
        <main className={`flex-1 ${wide ? "p-4 sm:p-6" : "mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8"}`}>
          <VerificationBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
