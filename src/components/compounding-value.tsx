"use client";

import * as React from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/constants";

const placements = [
  {
    number: "01",
    label: "PLACEMENT 01",
    domain: "Fintech",
    stack: "Java + Spring",
    insight: "Core patterns established",
    reusable: ["Domain modeling", "Security patterns", "Testing conventions"],
  },
  {
    number: "02",
    label: "PLACEMENT 02",
    domain: "Healthcare",
    stack: "Java + Spring",
    insight: "Stack knowledge transfers",
    reusable: ["Spring patterns", "CI/CD workflows", "Architecture decisions"],
  },
  {
    number: "03",
    label: "PLACEMENT 03",
    domain: "Fintech",
    stack: ".NET + Azure",
    insight: "Domain knowledge transfers",
    reusable: ["Payment flows", "Compliance reqs", "Data models"],
  },
  {
    number: "04",
    label: "PLACEMENT 04",
    domain: "Logistics",
    stack: "Go + Postgres",
    insight: "Faster setup. Better onboarding. More repeatability.",
    reusable: ["All of the above", "Cross-stack patterns", "Meta-playbooks"],
  },
];

export function CompoundingValue() {
  const { scrollYProgress } = useScroll({
    target: undefined,
    offset: ["start end", "end start"],
  });

  const bgParallax = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <section
      id="compounding"
      className="relative py-24 md:py-32 lg:py-40 overflow-hidden"
      aria-labelledby="compounding-heading"
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
            COMPOUNDING VALUE
          </p>
          <h2 id="compounding-heading" className="font-display font-medium text-[48px] md:text-[60px] lg:text-[72px] leading-[1.05] tracking-tight text-[var(--foreground)] text-balance">
            Every placement makes the next one easier.
          </h2>
          <p className="mt-6 text-lg md:text-xl leading-relaxed text-[var(--muted)] max-w-xl">
            The knowledge from each onboarding cycle compounds into reusable patterns, faster setups, and better processes.
          </p>
        </motion.div>

        <motion.div
          className="space-y-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease, delay: 0.1 }}
        >
          {placements.map((placement, index) => (
            <CompoundingCard key={index} placement={placement} index={index} isLast={index === placements.length - 1} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function CompoundingCard({ placement, index, isLast }: { placement: typeof placements[0]; index: number; isLast: boolean }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  
  const cardParallax = useTransform(scrollYProgress, [0, 1], index % 2 === 0 ? [20, -20] : [-20, 20]);
  const cardRotate = useTransform(scrollYProgress, [0, 1], index % 2 === 0 ? [-0.5, 0.5] : [0.5, -0.5]);
  const cardScale = useTransform(scrollYProgress, [0, 1], [1, 1.01]);

  return (
    <motion.div
      ref={ref}
      className="relative flex gap-8 md:gap-12 p-6 md:p-8 border border-[var(--border)]"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      style={{ y: cardParallax, rotate: cardRotate, scale: cardScale }}
    >
      {!isLast && (
        <div className="absolute left-[35px] top-[80px] bottom-[80px] w-[1px] bg-[var(--border)]" aria-hidden="true" />
      )}
      
      <div className="flex-shrink-0 w-14 md:w-20 text-center relative z-10">
        <div className="relative">
          <span className="font-display font-medium text-[36px] md:text-[48px] text-[var(--muted)]/20">{placement.number}</span>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[var(--border)] bg-white" />
        </div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)] mt-2">{placement.label}</p>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-4">
          <span className="font-mono text-[11px] px-3 py-1 border border-[var(--border)] text-[var(--muted)]">{placement.domain}</span>
          <span className="font-mono text-[11px] px-3 py-1 border border-[var(--border)] text-[var(--muted)]">{placement.stack}</span>
        </div>
        
        <p className="text-[var(--foreground)] font-medium mb-4">{placement.insight}</p>
        
        <div className="flex flex-wrap gap-2">
          {placement.reusable.map((item, i) => (
            <span key={i} className="font-mono text-[10px] px-2.5 py-1 bg-[var(--background)] border border-[var(--border)] text-[var(--muted)]">
              {item}
            </span>
          ))}
        </div>
      </div>

      {index < placements.length - 1 && (
        <motion.div
          className="absolute left-[calc(35px+1px)] top-full -translate-y-1/2 w-6 h-6 flex items-center justify-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 + 0.3 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted)]">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </motion.div>
      )}
    </motion.div>
  );
}