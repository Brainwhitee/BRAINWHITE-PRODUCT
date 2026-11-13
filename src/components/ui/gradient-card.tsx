"use client";

import React, { useRef, useState, useCallback } from "react";
import Link from "next/link";
import { 
  Workflow,
  Cpu,
  Network,
  Layers,
  Share2,
  GitBranch,
  Terminal,
  CheckCircle2,
  Briefcase,
  Users,
  Code2,
  ShieldCheck,
  Lock,
  KeyRound,
  EyeOff,
  FileCheck2,
  Server,
  BarChart3,
  Sparkles,
  GitPullRequest,
  HelpCircle,
  ArrowUpRight,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  workflow: Workflow,
  cpu: Cpu,
  network: Network,
  layers: Layers,
  share: Share2,
  branch: GitBranch,
  gitbranch: GitBranch,
  terminal: Terminal,
  check: CheckCircle2,
  checkcircle: CheckCircle2,
  briefcase: Briefcase,
  users: Users,
  code: Code2,
  shield: ShieldCheck,
  shieldcheck: ShieldCheck,
  lock: Lock,
  key: KeyRound,
  keyround: KeyRound,
  eye: EyeOff,
  eyeoff: EyeOff,
  filecheck: FileCheck2,
  server: Server,
  barchart: BarChart3,
  sparkles: Sparkles,
  gitpr: GitPullRequest,
};

export interface GradientCardProps {
  iconName?: string;
  icon?: React.ReactNode;
  title: string;
  description: string;
  metric?: string;
  metricLabel?: string;
  ctaText?: string;
  ctaHref?: string;
  gradient?: "subtle-slate" | "charcoal" | "iridescent" | "mesh";
  className?: string;
}

export function GradientCard({
  iconName,
  icon,
  title,
  description,
  metric,
  metricLabel,
  ctaText,
  ctaHref,
  gradient = "mesh",
  className,
}: GradientCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const gradientStyles = {
    "subtle-slate": "from-neutral-100/80 via-white to-neutral-50/60",
    "charcoal": "from-neutral-900 to-neutral-950 text-white",
    "iridescent": "from-neutral-100/60 via-neutral-50/40 to-white",
    "mesh": "from-white via-neutral-50/70 to-neutral-100/50",
  }[gradient];

  const ResolvedIcon = iconName ? (ICON_MAP[iconName.toLowerCase()] || HelpCircle) : null;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-neutral-200 bg-white p-7 sm:p-8 transition-all duration-300",
        "hover:border-neutral-900 hover:shadow-[0_20px_45px_-15px_rgba(0,0,0,0.08)]",
        className
      )}
    >
      {/* Interactive Cursor Spotlight Glow */}
      <div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(0, 0, 0, 0.05), transparent 70%)`,
        }}
      />

      {/* Subtle Mesh Ambient Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-80 transition-opacity duration-300 group-hover:opacity-100",
          gradientStyles
        )}
      />

      <div className="relative z-10 flex flex-col justify-between h-full">
        <div>
          {/* Top row: Icon + Action */}
          <div className="flex items-center justify-between mb-6">
            {(ResolvedIcon || icon) && (
              <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-950 shadow-2xs group-hover:scale-105 group-hover:border-neutral-900 transition-all">
                {ResolvedIcon ? (
                  <ResolvedIcon className="w-5 h-5 text-neutral-950" />
                ) : (
                  icon
                )}
              </div>
            )}

            {ctaHref && (
              <Link
                href={ctaHref}
                className="w-9 h-9 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-600 hover:text-neutral-950 hover:border-neutral-900 transition-all"
              >
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Title - Pure typography, NO micro-badges */}
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 mb-3 group-hover:text-black transition-colors">
            {title}
          </h3>

          {/* Description */}
          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-sans font-light">
            {description}
          </p>
        </div>

        {/* Bottom Section: Metric or CTA Link */}
        {(metric || ctaText) && (
          <div className="pt-6 mt-6 border-t border-neutral-200/70 flex items-end justify-between">
            {metric && (
              <div>
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-neutral-950">
                  {metric}
                </div>
                {metricLabel && (
                  <div className="text-xs font-mono text-neutral-500 mt-0.5">
                    {metricLabel}
                  </div>
                )}
              </div>
            )}

            {ctaText && ctaHref && (
              <Link
                href={ctaHref}
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-950 hover:underline"
              >
                <span>{ctaText}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
