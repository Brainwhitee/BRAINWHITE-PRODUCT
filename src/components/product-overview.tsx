"use client";

import * as React from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/constants";

const productSteps = [
  {
    number: "01",
    title: "Understand the client",
    items: ["Business context", "Engagement scope", "Delivery expectations", "Key stakeholders"],
  },
  {
    number: "02",
    title: "Understand the codebase",
    items: ["Repository structure", "System architecture", "Key domains & boundaries", "Critical paths"],
  },
  {
    number: "03",
    title: "Learn the stack",
    items: ["Frameworks & libraries", "Development workflows", "Testing conventions", "Deployment pipelines"],
  },
  {
    number: "04",
    title: "Build competence",
    items: ["Guided code exploration", "Hands-on exercises", "Progressive task complexity", "Real project contributions"],
  },
  {
    number: "05",
    title: "Track progress",
    items: ["Stage completion visibility", "Blocker identification", "Readiness scoring", "Delivery leader dashboard"],
  },
];

export function ProductOverview() {
  const { scrollYProgress } = useScroll({
    target: undefined,
    offset: ["start end", "end start"],
  });

  const bgParallax = useTransform(scrollYProgress, [0, 1], [0, 60]);

  return (
    <section
      id="product"
      className="relative py-24 md:py-32 lg:py-40 overflow-hidden"
      aria-labelledby="product-heading"
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
            WHAT BRAINWHITE DOES
          </p>
          <h2 id="product-heading" className="font-display font-medium text-[48px] md:text-[60px] lg:text-[72px] leading-[1.05] tracking-tight text-[var(--foreground)] text-balance">
            Turn a client placement into a repeatable ramp-up process.
          </h2>
        </motion.div>

        <div className="space-y-6 md:space-y-8">
          {productSteps.map((step, index) => (
            <ProductStepCard key={index} step={step} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductStepCard({ step, index }: { step: typeof productSteps[0]; index: number }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  
  const cardParallax = useTransform(scrollYProgress, [0, 1], [15, -15]);
  const cardRotate = useTransform(scrollYProgress, [0, 1], [-0.5, 0.5]);

  return (
    <motion.div
      ref={ref}
      className="group relative flex flex-col md:flex-row gap-8 md:gap-12 p-8 md:p-10 border border-[var(--border)]"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease, delay: index * 0.08 }}
      style={{ y: cardParallax, rotate: cardRotate }}
    >
      <div className="flex-shrink-0 w-20 md:w-24 text-right md:pt-1">
        <span className="font-display font-medium text-[48px] md:text-[60px] leading-none text-[var(--muted)]/30 group-hover:text-[var(--muted)]/60 transition-colors duration-300">
          {step.number}
        </span>
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-display font-medium text-[24px] md:text-[28px] leading-tight text-[var(--foreground)] mb-4 md:mb-6">
          {step.title}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {step.items.map((item, itemIndex) => (
            <motion.div
              key={itemIndex}
              className="flex items-center gap-2.5 p-3 md:p-4 border border-[var(--border)] hover:border-[var(--foreground)]/30 transition-colors duration-200"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 + itemIndex * 0.05 }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--border)] group-hover:bg-[var(--foreground)] transition-colors duration-200 flex-shrink-0" aria-hidden="true" />
              <p className="text-sm md:text-base text-[var(--foreground)] font-medium">{item}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[var(--border)]" aria-hidden="true" />
    </motion.div>
  );
}