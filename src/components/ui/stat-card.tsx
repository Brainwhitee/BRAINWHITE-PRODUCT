"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  delta?: string;
  isPositive?: boolean;
  description?: string;
  icon?: React.ReactNode;
  sparklineData?: number[];
  sparklineColor?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  delta,
  isPositive = true,
  description,
  icon,
  sparklineData = [35, 45, 40, 55, 60, 58, 75],
  sparklineColor = "#ffffff",
  className,
}: StatCardProps) {
  // Generate simple smooth SVG sparkline path
  const width = 120;
  const height = 36;
  const max = Math.max(...sparklineData);
  const min = Math.min(...sparklineData);
  const range = max - min || 1;

  const points = sparklineData
    .map((val, i) => {
      const x = (i / (sparklineData.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div
      className={cn(
        "p-5 rounded-2xl bg-[#0a0a0a] border border-white/10 hover:border-white/25 shadow-lg transition-all duration-200 flex flex-col justify-between group",
        className
      )}
    >
      <div>
        {/* Top Header: Title + Icon */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-medium uppercase tracking-wider text-white/50">
            {title}
          </span>
          {icon && (
            <div className="p-2 rounded-xl bg-white/[0.04] border border-white/10 text-white/80 group-hover:scale-105 transition-transform">
              {icon}
            </div>
          )}
        </div>

        {/* Metric + Delta + Sparkline */}
        <div className="flex items-end justify-between gap-4 mb-2">
          <div className="space-y-1">
            <span className="text-3xl font-extrabold font-mono tracking-tight text-white block">
              {value}
            </span>
            {delta && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold",
                  isPositive
                    ? "bg-white/10 text-white border border-white/20"
                    : "bg-white/5 text-white/50 border border-white/10"
                )}
              >
                {isPositive ? (
                  <TrendingUp className="w-3 h-3 text-white" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-white/50" />
                )}
                <span>{delta}</span>
              </span>
            )}
          </div>

          {/* Mini Sparkline Chart */}
          <div className="w-24 h-9">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-full overflow-visible"
            >
              <polyline
                fill="none"
                stroke={sparklineColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
            </svg>
          </div>
        </div>
      </div>

      {description && (
        <p className="text-[11px] text-white/40 pt-3 border-t border-white/10 leading-relaxed font-sans">
          {description}
        </p>
      )}
    </div>
  );
}
