"use client";

import * as React from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/constants";
import { FlickeringGrid } from "@/components/ui/flickering-grid";

const clientNodes = [
  { name: "CLIENT A", domain: "Fintech", stack: "Java / Spring", color: "hsl(210, 80%, 45%)" },
  { name: "CLIENT B", domain: "Healthcare", stack: "React / Node", color: "hsl(150, 70%, 40%)" },
  { name: "CLIENT C", domain: "E-commerce", stack: ".NET / Azure", color: "hsl(30, 85%, 50%)" },
  { name: "CLIENT D", domain: "Logistics", stack: "Go / Postgres", color: "hsl(280, 65%, 50%)" },
];

export function ClientOnboarding() {
  const { scrollYProgress } = useScroll({
    target: undefined,
    offset: ["start end", "end start"],
  });

  const bgParallax = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <section
      id="why-different"
      className="relative py-24 md:py-32 lg:py-40 border-y border-white/10 overflow-hidden"
      aria-labelledby="client-onboarding-heading"
    >
      <motion.div
        className="absolute inset-0 overflow-hidden"
        style={{ y: bgParallax }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_10%,_black_80%)] z-10" />
        <FlickeringGrid
          className="absolute inset-0 z-0 opacity-40"
          squareSize={4}
          gridGap={6}
          color="rgb(255, 102, 0)"
          maxOpacity={0.2}
          flickerChance={0.05}
        />
      </motion.div>

      <div className="mx-auto max-w-7xl px-6 md:px-8 relative z-10">
        <motion.div
          className="max-w-2xl mb-16 md:mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease }}
        >
          <p className="text-xs font-medium uppercase tracking-widest text-white/60 mb-4" style={{ letterSpacing: "0.2em" }}>
            WHY THIS IS DIFFERENT
          </p>
          <h2 id="client-onboarding-heading" className="font-display font-medium text-[48px] md:text-[60px] lg:text-[72px] leading-[1.05] tracking-tight text-white text-balance">
            Onboarding is different when your engineers move between clients.
          </h2>
          <p className="mt-6 text-lg md:text-xl leading-relaxed text-white/60 max-w-xl">
            Product companies may onboard an engineer once. Staffing and consulting firms do it again and again.
          </p>
        </motion.div>

        <motion.div
          className="relative"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease }}
        >
          <ClientJourneyVisualization clients={clientNodes} />
        </motion.div>

        <motion.div
          className="mt-16 md:mt-24 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease, delay: 0.3 }}
        >
          {[
            { title: "New client", detail: "New business domain, stakeholders, expectations" },
            { title: "New codebase", detail: "Unfamiliar architecture, patterns, technical debt" },
            { title: "New stack", detail: "Different tools, frameworks, workflows, conventions" },
          ].map((item, index) => (
            <FeatureCard key={index} item={item} index={index} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function FeatureCard({ item, index }: { item: { title: string; detail: string }; index: number }) {
  const { scrollYProgress } = useScroll({
    target: undefined,
    offset: ["start end", "end start"],
  });

  const cardParallax = useTransform(scrollYProgress, [0, 1], [20, -20]);
  const cardScale = useTransform(scrollYProgress, [0, 1], [1, 1.02]);

  return (
    <motion.div
      className="p-6 border border-white/10"
      style={{ y: cardParallax, scale: cardScale }}
      transition={{ duration: 0.3, ease }}
    >
      <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-white/60 mb-2">
        {item.title.toUpperCase()}
      </p>
      <p className="text-white leading-relaxed">{item.detail}</p>
    </motion.div>
  );
}

function ClientJourneyVisualization({ clients }: { clients: typeof clientNodes }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const interval = setInterval(() => {
            setActiveIndex((i) => (i + 1) % clients.length);
          }, 2500);
          return () => clearInterval(interval);
        }
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, [clients.length]);

  return (
    <div ref={containerRef} className="relative h-[360px] md:h-[420px]">
      <svg className="absolute top-1/2 left-10 right-10 -translate-y-1/2" viewBox="0 0 800 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <marker id="arrow-client" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 Z" fill="currentColor" opacity="0.3" />
          </marker>
        </defs>
        <path
          d="M0,50 C100,50 200,50 400,50 C600,50 700,50 800,50"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          opacity="0.15"
          className="text-white"
          markerEnd="url(#arrow-client)"
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-between px-10">
        {clients.map((client, index) => (
          <motion.div
            key={index}
            className="flex flex-col items-center relative z-10"
            style={{ left: `${(index / (clients.length - 1)) * 100}%` }}
          >
            <motion.div
              className="relative w-16 h-16 md:w-20 md:h-20 rounded-full border-2 flex items-center justify-center bg-transparent"
              style={{
                borderColor: activeIndex === index ? client.color : "var(--border)",
                boxShadow: activeIndex === index ? `0 0 0 4px ${client.color}20, 0 0 20px ${client.color}30` : "none",
              }}
              animate={{
                scale: activeIndex === index ? 1.15 : 1,
                borderColor: activeIndex === index ? client.color : "var(--border)",
              }}
              transition={{ duration: 0.5, ease }}
            >
              <span className="font-mono text-[10px] md:text-[11px] font-medium uppercase tracking-wider" style={{ color: client.color }}>
                ENGINEER
              </span>
            </motion.div>

            <motion.div
              className="mt-4 text-center w-32"
              animate={{
                opacity: activeIndex === index ? 1 : 0.5,
                y: activeIndex === index ? -8 : 0,
              }}
              transition={{ duration: 0.3 }}
            >
              <p className="font-mono text-[10px] font-medium uppercase tracking-wider text-white mb-1">
                {client.name}
              </p>
              <p className="font-mono text-[9px] text-white/60 mb-1">{client.domain}</p>
              <p className="font-mono text-[8px] text-white/60">{client.stack}</p>
            </motion.div>

            {index < clients.length - 1 && (
              <motion.div
                className="absolute top-[38px] left-[calc(50%+8px)] right-[calc(50%+8px)] h-[1px] bg-gradient-to-r"
                style={{
                  background: `linear-gradient(90deg, var(--border), ${client.color}40, ${clients[index + 1].color}40, var(--border))`,
                }}
                animate={{
                  opacity: [0.3, activeIndex === index || activeIndex === index + 1 ? 1 : 0.3, 0.3],
                }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
            )}
          </motion.div>
        ))}
      </div>

      <div className="absolute bottom-0 left-0 right-0 pt-8 px-10">
        <div className="flex items-center justify-between">
          {clients.map((client, index) => (
            <motion.div
              key={index}
              className="flex flex-col items-center w-32"
              style={{ left: `${(index / (clients.length - 1)) * 100}%` }}
            >
              <div className="relative w-full h-16 rounded-lg border p-3 text-center" style={{ borderColor: `color-mix(in srgb, ${client.color} 30%, var(--border))` }}>
                <p className="font-mono text-[9px] font-medium uppercase tracking-wider mb-1" style={{ color: client.color }}>
                  PLACEMENT {String(index + 1).padStart(2, "0")}
                </p>
                <p className="font-mono text-[10px] text-white mb-1">{client.domain}</p>
                <p className="font-mono text-[8px] text-white/60">{client.stack}</p>
              </div>
              {activeIndex >= index && (
                <motion.div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 w-[1px] h-3"
                  style={{ backgroundColor: client.color }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: index * 0.2, duration: 0.3 }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center text-xs uppercase tracking-widest text-white/60">
        Each placement has its own onboarding cycle
      </p>
    </div>
  );
}
