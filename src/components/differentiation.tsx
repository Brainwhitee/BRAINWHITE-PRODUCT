"use client";

import * as React from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/constants";

const differentiators = [
  {
    number: "01",
    title: "REPEATABLE",
    description: "Build a process your team can run again for the next placement. Each onboarding cycle refines the playbook for the next one.",
  },
  {
    number: "02",
    title: "REVENUE-LINKED",
    description: "Shorter ramp-up means engineers become productive faster. Every week saved is a week of billable time recovered.",
  },
  {
    number: "03",
    title: "CLIENT-SPECIFIC",
    description: "Every placement has its own codebase, domain, stack, and context. Brainwhite is built for this reality — not generic employee onboarding.",
  },
];

export function Differentiation() {
  const { scrollYProgress } = useScroll({
    target: undefined,
    offset: ["start end", "end start"],
  });

  const bgParallax = useTransform(scrollYProgress, [0, 1], [0, 60]);

  return (
    <section
      id="why-this-is-different"
      className="relative py-24 md:py-32 lg:py-40 border-y border-[var(--border)] overflow-hidden"
      aria-labelledby="differentiation-heading"
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
            WHY THIS IS DIFFERENT
          </p>
          <h2 id="differentiation-heading" className="font-display font-medium text-[48px] md:text-[60px] lg:text-[72px] leading-[1.05] tracking-tight text-[var(--foreground)] text-balance">
            Not onboarding software for everyone.
          </h2>
          <p className="mt-6 text-lg md:text-xl leading-relaxed text-[var(--muted)] max-w-xl">
            Built specifically for firms that place engineers onto client projects.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {differentiators.map((item, index) => (
            <DifferentiatorCard key={index} item={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function DifferentiatorCard({ item, index }: { item: typeof differentiators[0]; index: number }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  
  const cardParallax = useTransform(scrollYProgress, [0, 1], [15, -15]);
  const cardRotate = useTransform(scrollYProgress, [0, 1], [-0.5, 0.5]);
  const cardScale = useTransform(scrollYProgress, [0, 1], [1, 1.01]);

  return (
    <motion.div
      ref={ref}
      className="p-8 border border-[var(--border)]"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease, delay: index * 0.1 }}
      style={{ y: cardParallax, rotate: cardRotate, scale: cardScale }}
    >
      <div className="flex items-baseline gap-2 mb-4">
        <span className="font-display font-medium text-[48px] text-[var(--muted)]/30">{item.number}</span>
        <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--foreground)] font-medium">{item.title}</span>
      </div>
      <p className="text-[var(--muted)] leading-relaxed">{item.description}</p>
    </motion.div>
  );
}