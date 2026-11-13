"use client";

import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useRef } from "react";

export function StudioInfo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const y1 = useTransform(smoothProgress, [0, 1], [0, -80]);
  const y2 = useTransform(smoothProgress, [0, 1], [0, 80]);

  // Zigzag kinetic typography for "ARCHITECTURE"
  // Letters move dynamically from top-left offset to aligned bottom-right position as the section scrolls into view
  const letters = "ARCHITECTURE".split("");

  return (
    <section ref={containerRef} className="relative w-full bg-[#050505] text-white py-32 md:py-48 px-6 md:px-10 z-20 overflow-hidden">
      
      {/* Top Narrative Block */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 max-w-7xl mx-auto">
        <div className="md:col-span-3 text-xs sm:text-sm font-mono uppercase tracking-widest text-emerald-400">
          ( The Platform )
        </div>
        <div className="md:col-span-9 text-2xl sm:text-3xl md:text-5xl font-light leading-tight">
          We built BrainWhite because onboarding started as a paradox: 
          an empty space open enough to become anything—a wiki, a bootcamp, a checklist—
          <span className="italic font-serif opacity-70"> but rarely what the engineer actually needed to ship code.</span>
        </div>
      </div>

      {/* Real Tech Industry Engineering Black & White Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 mt-24 md:mt-32 max-w-6xl mx-auto">
        
        {/* Real Image 1: The Codebase Onboarding Bottleneck */}
        <motion.div style={{ y: y1 }} className="flex flex-col gap-4">
          <div className="w-full aspect-[4/3] sm:aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-900 border border-white/10 group shadow-2xl relative">
            <img 
              src="https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1200&auto=format&fit=crop" 
              alt="Engineers debugging complex codebase" 
              className="w-full h-full object-cover filter grayscale contrast-125 brightness-90 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-4 right-4 text-xs font-mono text-white/80">
              <span className="text-emerald-400">Problem 01</span> · 3+ Weeks lost navigating unmapped repository architectures.
            </div>
          </div>
          <div className="text-sm sm:text-base font-light text-white/70 leading-snug">
            Without automated AST knowledge maps, new hires depend on trial-and-error guesswork.
          </div>
        </motion.div>
        
        {/* Real Image 2: Distributed Production Complexity & Senior Dev Drain */}
        <motion.div style={{ y: y2 }} className="flex flex-col gap-4 pt-12 md:pt-28">
          <div className="w-full aspect-[4/3] sm:aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-900 border border-white/10 group shadow-2xl relative">
            <img 
              src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop" 
              alt="Complex distributed engineering system" 
              className="w-full h-full object-cover filter grayscale contrast-125 brightness-90 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-4 right-4 text-xs font-mono text-white/80">
              <span className="text-emerald-400">Problem 02</span> · Senior engineers spend 20+ hrs/wk answering repetitive questions.
            </div>
          </div>
          <div className="text-sm sm:text-base font-light text-white/70 leading-snug">
            BrainWhite translates live repositories into autonomous, interactive learning paths.
          </div>
        </motion.div>
      </div>

      {/* Forms Follow Architecture with Zigzag Kinetic Typography */}
      <div ref={textContainerRef} className="mt-28 sm:mt-40 md:mt-52 mb-16 md:mb-24 max-w-7xl mx-auto">
        <h3 className="text-2xl sm:text-4xl md:text-5xl font-light text-white/60 uppercase tracking-tight mb-2">
          Forms follow
        </h3>
        
        {/* Kinetic Zigzag Animated "ARCHITECTURE" */}
        <div className="flex flex-wrap items-center overflow-visible select-none py-4">
          {letters.map((char, index) => {
            // Zigzag motion parameters: alternating vertical and diagonal trajectory
            const isEven = index % 2 === 0;
            const xOffset = isEven ? -20 * (index + 1) : 15 * (index + 1);
            const yOffset = isEven ? -40 - index * 6 : 40 + index * 6;

            return (
              <motion.span
                key={index}
                initial={{ opacity: 0, x: xOffset, y: yOffset, rotate: isEven ? -12 : 12 }}
                whileInView={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
                viewport={{ once: false, margin: "-10%" }}
                transition={{
                  delay: index * 0.045,
                  duration: 0.8,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="inline-block text-4xl sm:text-6xl md:text-8xl lg:text-[7.5rem] font-black uppercase tracking-tighter leading-[0.85] text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/60 hover:text-emerald-400 transition-colors cursor-default"
              >
                {char}
              </motion.span>
            );
          })}
          <span className="text-4xl sm:text-6xl md:text-8xl lg:text-[7.5rem] font-black text-emerald-400 leading-[0.85]">.</span>
        </div>
      </div>

      {/* Capabilities List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 max-w-7xl mx-auto border-t border-white/10 pt-16 md:pt-24">
        <div className="md:col-span-5 flex flex-col justify-between">
          <div className="text-xl sm:text-2xl font-light mb-6 md:mb-0">
            We deliver :
          </div>
          <div className="text-sm sm:text-base font-light text-white/50 hidden md:block">
            Architecture is where engineering strategy <br/> meets production readiness.
          </div>
        </div>
        
        <div className="md:col-span-7">
          <ul className="flex flex-col w-full">
            {[
              "Bi-Directional AST Knowledge Graph",
              "Role-Tailored Learning Path Synthesis",
              "Objective 7-Pillar Git Telemetry",
              "Zero-Persistence Enterprise IP Sandbox",
              "Native Multi-Tenant GitHub App Integration",
            ].map((item, i) => (
              <li 
                key={i} 
                className="group flex items-center gap-4 sm:gap-6 py-4 sm:py-6 border-b border-white/10 text-xl sm:text-3xl md:text-4xl font-light tracking-tight hover:pl-4 transition-all duration-300 cursor-default"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="group-hover:text-white transition-colors">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

    </section>
  );
}
