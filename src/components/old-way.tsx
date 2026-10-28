"use client";

import * as React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/constants";

const oldWaySteps = [
  { label: "Share Repo Link", detail: "'Just clone it and look around'" },
  { label: "Outdated Wiki", detail: "Reading docs from 3 years ago" },
  { label: "Ask Senior Engineer", detail: "Interrupting their flow state" },
  { label: "Senior is Busy", detail: "Waiting for guidance" },
  { label: "Ad-hoc Checklists", detail: "Inconsistent across teams" },
  { label: "Eventually Productive", detail: "Months of fragmented learning" },
];

const newWaySteps = [
  { label: "Structured Path", detail: "Day 1 to Core Contributor roadmap" },
  { label: "Codebase Context", detail: "Interactive architecture mapping" },
  { label: "Guided Workflows", detail: "Safe sandboxes for early tasks" },
  { label: "Automated Tracking", detail: "Visibility for engineering managers" },
  { label: "Productive Engineer", detail: "Confidence in weeks, not months" },
];

export function OldWay() {
  const { scrollYProgress } = useScroll({
    target: undefined,
    offset: ["start end", "end start"],
  });

  const bgParallax = useTransform(scrollYProgress, [0, 1], [0, 60]);

  return (
    <section
      id="current-way"
      className="relative py-24 md:py-32 lg:py-40 overflow-hidden bg-[#fafafa]"
      aria-labelledby="old-way-heading"
    >
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0.02)_0%,_transparent_70%)]"
        style={{ y: bgParallax }}
      />

      <div className="mx-auto max-w-7xl px-6 md:px-8 relative z-10">
        <motion.div
          className="max-w-2xl mb-16 md:mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-[#ff6600] mb-4" style={{ letterSpacing: "0.2em" }}>
            THE STATUS QUO
          </p>
          <h2 id="old-way-heading" className="font-display font-medium text-[48px] md:text-[60px] lg:text-[72px] leading-[1.05] tracking-tight text-[var(--foreground)] text-balance">
            Engineering onboarding is broken by default.
          </h2>
          <p className="mt-6 text-lg md:text-xl leading-relaxed text-[var(--muted)] max-w-xl">
            You didn&apos;t design your onboarding to be this chaotic. It just accumulated over time as the codebase grew and the team scaled.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          <OldWayColumn steps={oldWaySteps} title="THE OLD WAY" muted={true} delay={0} />
          <OldWayColumn steps={newWaySteps} title="THE BRAINWHITE WAY" muted={false} delay={0.1} />
        </div>
      </div>
    </section>
  );
}

function OldWayColumn({ steps, title, muted, delay }: { steps: typeof oldWaySteps; title: string; muted: boolean; delay: number }) {
  const { scrollYProgress } = useScroll({
    target: undefined,
    offset: ["start end", "end start"],
  });

  const columnParallax = useTransform(scrollYProgress, [0, 1], muted ? [30, -30] : [-30, 30]);

  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease, delay }}
      style={{ y: columnParallax }}
    >
      <div className="flex items-center gap-3 mb-6">
        <span className={cn(
          "font-mono text-[11px] font-semibold uppercase tracking-wider px-3 py-1 border",
          muted ? "text-[var(--muted)] border-gray-200 bg-white" : "text-white border-[#ff6600] bg-[#ff6600]"
        )}>
          {title}
        </span>
        <div className={cn("h-[1px] flex-1", muted ? "bg-gray-200" : "bg-[#ff6600]/30")} />
      </div>
      
      <div className="space-y-3" role="list" aria-label={`${title} onboarding process steps`}>
        {steps.map((step, index) => (
          <motion.div
            key={index}
            className={cn(
              "flex items-start gap-4 p-5 border relative transition-colors duration-300",
              muted 
                ? "border-gray-200 bg-white text-[var(--muted)] hover:border-gray-300" 
                : "border-gray-200 bg-white hover:border-[#ff6600]/50 hover:shadow-[0_4px_12px_rgba(255,102,0,0.05)]"
            )}
            initial={{ opacity: 0, x: muted ? -20 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
          >
            <span className={cn(
              "font-mono text-[12px] font-bold shrink-0 w-8 text-right pt-0.5",
              muted ? "text-gray-400" : "text-[#ff6600]"
            )} aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="flex-1 min-w-0">
              <p className={cn("font-medium", muted ? "text-gray-500" : "text-[var(--foreground)]")}>{step.label}</p>
              <p className={cn("text-sm mt-1", muted ? "text-gray-400" : "text-[var(--muted)]")}>{step.detail}</p>
            </div>
            {index < steps.length - 1 && (
              <div className={cn(
                "absolute left-[22px] top-[45px] bottom-[-15px] w-[2px]",
                muted ? "bg-gray-100" : "bg-[#ff6600]/20"
              )} aria-hidden="true" />
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}