"use client";

import * as React from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ConstellationGrid from "@/components/ui/constellation-grid";

const ease = [0.25, 0.1, 0.25, 1] as const;

const heroVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease, delay: 0.15 + i * 0.08 },
  }),
};

const pipelineSteps = [
  { label: "ORIENTATION", detail: "Basics & Culture" },
  { label: "CODEBASE\nCONTEXT", detail: "Architecture & systems" },
  { label: "STACK\nREADINESS", detail: "Tools & workflows" },
  { label: "GUIDED\nTASKS", detail: "Hands-on exercises" },
  { label: "CORE\nCONTRIBUTOR", detail: "Production Commits" },
];

export function Hero() {
  const { scrollYProgress } = useScroll({
    target: undefined,
    offset: ["start start", "end start"],
  });

  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const fadeOut = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scaleUp = useTransform(scrollYProgress, [0, 1], [1, 1.05]);
  return (
    <section className="relative w-full min-h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden bg-transparent">
      <div className="absolute inset-0 z-0">
        <ConstellationGrid />
      </div>
      <motion.div
        className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.02)_100%)] pointer-events-none z-0"
        style={{ y: parallaxY, scale: scaleUp }}
      />
      
      <motion.div
        className="mx-auto max-w-7xl px-6 md:px-8 py-8 md:py-12 relative z-10"
        initial="hidden"
        animate="visible"
        variants={heroVariants}
        style={{ opacity: fadeOut }}
      >
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <motion.div
            className="space-y-8"
            variants={heroVariants}
          >
            <motion.p
              className="text-xs font-semibold uppercase tracking-widest text-[#ff6600]"
              style={{ letterSpacing: "0.2em" }}
              variants={itemVariants}
            >
              TECHNICAL ONBOARDING FOR ENGINEERING TEAMS
            </motion.p>

            <motion.h1
              className="font-display font-medium text-5xl sm:text-[64px] md:text-[84px] lg:text-[96px] leading-[1.02] tracking-tight text-[var(--foreground)] text-balance"
              variants={itemVariants}
            >
              Ramp up new engineers
              <br />
              <span className="font-normal text-[var(--muted)]">faster and better.</span>
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl leading-relaxed text-[var(--muted)] max-w-xl"
              variants={itemVariants}
            >
              Every new hire means teaching the codebase, tools, and context from scratch. Brainwhite gives your engineering teams a structured way to onboard freshers and track their progress seamlessly.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 pt-4"
              variants={itemVariants}
            >
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full rounded-sm">
                  Start Onboarding →
                </Button>
              </Link>
              <Button size="lg" variant="secondary" className="w-full sm:w-auto rounded-sm">
                See how it works ↓
              </Button>
            </motion.div>

            <motion.p
              className="text-sm text-[var(--muted)] pt-6 border-t border-[var(--border)] w-fit"
              variants={itemVariants}
            >
              Built for companies that want productive freshers.
            </motion.p>
          </motion.div>

          <motion.div
            className="relative hidden lg:block"
            variants={itemVariants}
            style={{ transitionDelay: "0.3s" }}
          >
            <LensRevealAnimation />
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-12 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        aria-hidden="true"
      >
        <p className="text-xs uppercase tracking-widest text-[var(--muted)]">Scroll</p>
        <motion.div
          className="w-[1px] h-10 bg-[var(--border)] relative overflow-hidden"
          animate={{ scaleY: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div
            className="absolute top-0 left-0 w-full h-1/3 bg-[var(--foreground)]"
            animate={{ y: ["-100%", "300%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

function LensRevealAnimation() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);

  // Smooth springs for the lens position
  const mouseX = useSpring(240, { stiffness: 100, damping: 20 });
  const mouseY = useSpring(200, { stiffness: 100, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Return lens to center when mouse leaves
    mouseX.set(240);
    mouseY.set(200);
  };

  // Create a template string for the clip path
  const clipPath = useTransform(
    [mouseX, mouseY],
    ([x, y]) => `circle(${isHovered ? 140 : 100}px at ${x}px ${y}px)`
  );

  return (
    <div 
      className="relative w-full h-[420px] md:h-[480px] p-8 flex items-center justify-center"
    >
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        className="relative w-full h-full rounded-2xl bg-[#fafafa] border border-gray-200 shadow-sm overflow-hidden cursor-crosshair"
      >
        {/* ========================================= */}
        {/* BASE LAYER: The Chaotic, Messy Codebase */}
        {/* ========================================= */}
        <div className="absolute inset-0 p-6 flex flex-col justify-center opacity-40">
          <p className="font-mono text-[9px] sm:text-[10px] text-gray-400 leading-[1.8] select-none whitespace-pre opacity-50">
            {`// legacy_auth_v4_final_FINAL.ts
function resolveDependencyGraph(ctx: any, _opt: any) {
  if(!ctx.ready) return setTimeout(() => resolveDependencyGraph(ctx), 100);
  let refs = global.__refs__ || [];
  try {
    for(var i=0; i < refs.length; i++) {
      if(refs[i].id === ctx.target) {
        // FIXME: Rahul said this breaks on staging but works locally
        return Object.assign({}, refs[i], { _hydrated: true });
      }
    }
    throw new Error("Missing cyclic ref");
  } catch (e) {
    console.error("Oops", e);
    // just swallow error and hope for the best
    return null;
  }
}
// TODO: refactor this 3 years ago
const _globalState = {
  mutated: true,
  why: "because"
};`}
          </p>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#fafafa_100%)]" />
        </div>

        {/* ========================================= */}
        {/* TOP LAYER: The Organized Brainwhite Clarity */}
        {/* ========================================= */}
        <motion.div 
          className="absolute inset-0 bg-white z-10"
          style={{ clipPath }}
        >
          {/* Subtle grid background for the 'structured' view */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:20px_20px] opacity-30" />
          
          <div className="absolute inset-0 flex flex-col justify-center items-center p-8">
            <h3 className="font-display font-medium text-2xl text-black mb-6">Structured Ramp-Up</h3>
            
            <div className="w-full max-w-sm space-y-3">
              {[
                { step: "01", title: "Architecture Map", active: true },
                { step: "02", title: "Guided Sandbox", active: false },
                { step: "03", title: "First Production PR", active: false }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                  <span className={`font-mono text-[10px] font-bold ${item.active ? 'text-[#ff6600]' : 'text-gray-300'}`}>
                    {item.step}
                  </span>
                  <span className="font-medium text-sm text-gray-800">{item.title}</span>
                  {item.active && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-[#ff6600] shadow-[0_0_8px_rgba(255,102,0,0.6)]" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ========================================= */}
        {/* LENS RING: The Physical Glass Effect */}
        {/* ========================================= */}
        <motion.div
          className="absolute top-0 left-0 rounded-full border border-gray-200/50 shadow-[0_8px_32px_rgba(255,102,0,0.15)] pointer-events-none z-20 flex items-center justify-center"
          style={{
            width: isHovered ? 280 : 200,
            height: isHovered ? 280 : 200,
            x: useTransform(mouseX, (x) => x - (isHovered ? 140 : 100)),
            y: useTransform(mouseY, (y) => y - (isHovered ? 140 : 100)),
          }}
        >
          {/* Inner ring for glass thickness */}
          <div className="absolute inset-2 rounded-full border border-white/50 opacity-50" />
          {/* The orange crosshair/indicator */}
          <div className="w-1 h-1 bg-[#ff6600] rounded-full absolute opacity-30" />
        </motion.div>
      </div>
    </div>
  );
}