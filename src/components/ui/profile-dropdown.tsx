"use client";

import React, { useState, useRef, useEffect } from "react";
import { Avatar } from "@/components/ui/avatar";
import {
  Building2,
  Check,
  ChevronDown,
  ExternalLink,
  HelpCircle,
  KeyRound,
  LogOut,
  Moon,
  Settings,
  Shield,
  Sparkles,
  Sun,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileDropdownProps {
  name?: string;
  userName?: string;
  email?: string;
  userEmail?: string;
  role?: string;
  orgName?: string;
  onLogout?: () => void;
  className?: string;
}

export function ProfileDropdown({
  name,
  userName,
  email,
  userEmail,
  role = "Senior Architect",
  orgName = "Kite Health",
  onLogout,
  className,
}: ProfileDropdownProps) {
  const displayName = userName || name || "Jane Doe";
  const displayEmail = userEmail || email || "dev1@kite.com";
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<"online" | "away" | "busy">("online");
  const menuRef = useRef<HTMLDivElement>(null);

  const fallback = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase() || "JD";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className={cn("relative", className)}>
      {/* Profile Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-white/10 transition-colors w-full text-left group border border-white/15 hover:border-white/30 bg-[#0a0a0a]"
        aria-expanded={isOpen}
      >
        <Avatar
          fallback={fallback}
          size="sm"
          status={status}
          className="border-white/20 bg-white/10 text-white"
        />
        <div className="flex-1 min-w-0 hidden sm:block">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-white truncate">
              {displayName}
            </span>
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-white/10 text-white font-bold border border-white/20 uppercase">
              PRO
            </span>
          </div>
          <span className="text-[10px] text-white/50 font-mono truncate block">
            {role}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-white/40 group-hover:text-white transition-transform hidden sm:block",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-[#0a0a0a] border border-white/15 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-white/90 space-y-3 font-sans">
          {/* Header Card */}
          <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-3">
            <Avatar fallback={fallback} size="md" status={status} className="border-white/20 bg-white/10 text-white" />
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-white block truncate">
                {displayName}
              </span>
              <span className="text-[11px] text-white/50 font-mono block truncate">
                {displayEmail}
              </span>
              <span className="text-[10px] font-mono text-white/70 font-semibold block mt-0.5">
                ● Active Tenant: {orgName}
              </span>
            </div>
          </div>

          {/* Status Picker */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 px-2 block">
              Availability Status
            </span>
            <div className="grid grid-cols-3 gap-1 px-1">
              {[
                { id: "online", label: "Online", color: "bg-white" },
                { id: "busy", label: "In Focus", color: "bg-white/60" },
                { id: "away", label: "Away", color: "bg-white/40" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStatus(s.id as any)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-1 px-1.5 rounded-lg text-[10px] font-mono transition-all border",
                    status === s.id
                      ? "bg-white text-black font-bold border-white shadow-sm"
                      : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full", s.color)} />
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 pt-2 space-y-1 text-xs">
            <div className="px-2 py-1.5 text-white/80 hover:bg-white/5 rounded-lg flex items-center justify-between cursor-pointer transition">
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-white/40" />
                <span>Organization</span>
              </span>
              <span className="text-[10px] font-mono font-semibold text-white/60">
                {orgName}
              </span>
            </div>

            <div className="px-2 py-1.5 text-white/80 hover:bg-white/5 rounded-lg flex items-center justify-between cursor-pointer transition">
              <span className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-white/40" />
                <span>API Keys & Tokens</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-white border border-white/20">
                Active
              </span>
            </div>

            <div className="px-2 py-1.5 text-white/80 hover:bg-white/5 rounded-lg flex items-center justify-between cursor-pointer transition">
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-white/40" />
                <span>Documentation</span>
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-white/40" />
            </div>
          </div>

          {/* Sign Out Button */}
          <div className="border-t border-white/10 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onLogout?.();
              }}
              className="w-full px-2 py-1.5 text-xs text-white/80 hover:text-white hover:bg-white/10 rounded-lg flex items-center gap-2 transition font-medium"
            >
              <LogOut className="w-4 h-4 text-white/60" />
              <span>Sign Out of BrainWhite</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
