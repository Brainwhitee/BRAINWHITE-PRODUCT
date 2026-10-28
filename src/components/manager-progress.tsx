"use client";

import * as React from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/constants";

export function ManagerProgress() {
  const { scrollYProgress } = useScroll({
    target: undefined,
    offset: ["start end", "end start"],
  });

  const bgParallax = useTransform(scrollYProgress, [0, 1], [0, 60]);

  return (
    <section
      id="manager-visibility"
      className="relative py-24 md:py-32 lg:py-40 overflow-hidden"
      aria-labelledby="manager-heading"
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
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--muted)] mb-4" style={{ letterSpacing: "0.2em" }}>
            BUILT FOR DELIVERY TEAMS
          </p>
          <h2 id="manager-heading" className="font-display font-medium text-[48px] md:text-[60px] lg:text-[72px] leading-[1.05] tracking-tight text-[var(--foreground)] text-balance">
            Know how ramp-up is going before it becomes a problem.
          </h2>
          <p className="mt-6 text-lg md:text-xl leading-relaxed text-[var(--muted)] max-w-xl">
            No more asking &quot;How is it going?&quot; and getting &quot;I&apos;m still reading the docs&quot; in return. See exactly where they are.
          </p>
        </motion.div>

        <motion.div
          className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease, delay: 0.1 }}
        >
          <ManagerDashboard />
          <ManagerInsights />
        </motion.div>
      </div>
    </section>
  );
}

function ManagerDashboard() {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  
  const dashboardParallax = useTransform(scrollYProgress, [0, 1], [20, -20]);
  const dashboardRotate = useTransform(scrollYProgress, [0, 1], [-0.5, 0.5]);
  
  const [readiness, setReadiness] = React.useState(0);

  React.useEffect(() => {
    if (isInView) {
      const duration = 1000;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setReadiness(Math.floor(64 * eased));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setReadiness(64);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [isInView]);

  return (
    <motion.div
      ref={ref}
      className="border border-[var(--border)] overflow-hidden bg-white"
      style={{ y: dashboardParallax, rotate: dashboardRotate }}
      transition={{ duration: 0.3, ease }}
    >
      <div className="border-b border-[var(--border)] px-6 py-4 bg-[var(--background)]/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded border border-[var(--border)] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted)]">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">ENGINEER / AM-042</p>
            <p className="font-medium text-[var(--foreground)]">Alex Morgan</p>
          </div>
        </div>
        <span className="font-mono text-[10px] px-2 py-1 border border-[var(--border)] text-[var(--muted)]">CONCEPTUAL UI</span>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <ManagerStat label="CLIENT" value="Acme Financial" />
          <ManagerStat label="ENGAGEMENT" value="Payments Platform" />
          <ManagerStat label="START DATE" value="2026-01-15" />
        </div>

        <div className="border-t border-[var(--border)] pt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--muted)]">OVERALL READINESS</p>
              <p className="font-display font-medium text-[48px] text-[var(--foreground)] tabular-nums">{readiness}%</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">CURRENT STAGE</p>
              <p className="font-medium text-[var(--foreground)]">Hands-on Tasks</p>
            </div>
          </div>

          <div className="relative h-3 bg-[var(--border)] overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 h-full bg-[var(--foreground)]"
              initial={{ width: 0 }}
              animate={{ width: `${readiness}%` }}
              transition={{ duration: 1, ease }}
            />
            <div className="absolute top-0 left-0 right-0 h-full flex items-center justify-between px-1 pointer-events-none">
              {["Client Context", "Codebase", "Stack", "Tasks", "Ready"].map((stage, i) => (
                <span key={i} className="font-mono text-[8px] text-[var(--muted)]" style={{ left: `${i * 25}%` }}>
                  {stage}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--border)] pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">BLOCKED ON</p>
              <p className="font-medium text-[var(--foreground)]">Local environment setup</p>
            </div>
            <span className="font-mono text-[10px] px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200">
              NEEDS HELP
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">MANAGER STATUS</p>
              <p className="font-medium text-[var(--foreground)]">On track</p>
            </div>
            <span className="font-mono text-[10px] px-2 py-1 bg-green-50 text-green-700 border border-green-200">
              HEALTHY
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">EST. PRODUCTIVE</p>
              <p className="font-medium text-[var(--foreground)]">Week of Feb 12</p>
            </div>
            <span className="font-mono text-[10px] text-[var(--muted)]">~28 days total</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ManagerStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 border border-[var(--border)]">
      <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--muted)] mb-1">{label}</p>
      <p className="font-medium text-[var(--foreground)] text-sm">{value}</p>
    </div>
  );
}

function ManagerInsights() {
  const { scrollYProgress } = useScroll({
    target: undefined,
    offset: ["start end", "end start"],
  });

  const insightsParallax = useTransform(scrollYProgress, [0, 1], [-20, 20]);
  const insightsRotate = useTransform(scrollYProgress, [0, 1], [0.5, -0.5]);

  return (
    <motion.div
      className="space-y-4"
      style={{ y: insightsParallax, rotate: insightsRotate }}
      transition={{ duration: 0.3, ease }}
    >
      <div className="p-6 border border-[var(--border)]">
        <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--muted)] mb-4">THE SHIFT</p>
        <div className="space-y-4">
          <InsightRow 
            before={'"Is the engineer onboarded yet?"'}
            after={'"Client context: 100%. Codebase: 82%. Stack: 71%. Blocked on local env."'}
          />
          <InsightRow 
            before={'"How much longer?"'}
            after={'"Estimated productive: Week of Feb 12 (28 days total)"'}
          />
          <InsightRow 
            before={'"What\'s blocking them?"'}
            after={'"Environment setup — needs DevOps access. Escalated."'}
          />
        </div>
      </div>

      <div className="p-6 border border-[var(--border)]">
        <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--muted)] mb-4">WHY IT MATTERS</p>
        <ul className="space-y-3" role="list">
          {[
            "Delivery leaders see real progress, not status updates",
            "Blockers are identified before they impact client delivery",
            "Ramp-up becomes predictable across all placements",
            "Engineers get unblocked faster with structured guidance",
            "Historical data improves future onboarding cycles",
          ].map((item, index) => (
            <li key={index} className="flex items-start gap-3 text-sm text-[var(--muted)] leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--border)] mt-1.5 flex-shrink-0" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="p-6 border border-[var(--border)] bg-[var(--background)]/50">
        <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--muted)] mb-3">KEY INSIGHT</p>
        <p className="text-[var(--foreground)] leading-relaxed">
          When delivery teams can see exactly where an engineer is in their ramp-up, they can intervene early, reallocate resources, and manage client expectations proactively.
        </p>
      </div>
    </motion.div>
  );
}

function InsightRow({ before, after }: { before: string; after: string }) {
  return (
    <div className="space-y-2 p-4 bg-[var(--background)]/50 rounded-none border border-[var(--border)]">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">BEFORE</span>
        <span className="text-[var(--muted)] italic">{before}</span>
      </div>
      <div className="flex items-center gap-2 text-sm pl-9">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--foreground)]">AFTER</span>
        <span className="font-medium text-[var(--foreground)]">{after}</span>
      </div>
    </div>
  );
}