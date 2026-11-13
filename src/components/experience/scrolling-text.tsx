"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

export function ScrollingText() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Smooth out the scroll progress using a spring for ultra-fluid physics
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001
  });

  // Calculate smooth transform values
  const x1 = useTransform(smoothProgress, [0, 1], ["5%", "-35%"]);
  const x2 = useTransform(smoothProgress, [0, 1], ["-35%", "5%"]);
  const opacity = useTransform(smoothProgress, [0, 0.15, 0.85, 1], [0.2, 1, 1, 0.2]);
  const scale = useTransform(smoothProgress, [0, 0.25], [0.97, 1]);

  return (
    <section 
      ref={containerRef}
      className="relative w-full bg-[#050505] text-white py-16 sm:py-24 md:py-36 overflow-hidden flex flex-col gap-4 sm:gap-6 md:gap-8 z-10 border-t border-white/10"
    >
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Row 1 - Moves Left with edge mask */}
      <div className="w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <motion.div 
          style={{ x: x1, opacity, scale }}
          className="whitespace-nowrap flex will-change-transform select-none"
        >
          {[0, 1].map((i) => (
            <h2 
              key={i} 
              className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.9] pr-8 sm:pr-12 text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/70"
            >
              NOT JUST A TOOL — A READINESS PLATFORM —{" "}
            </h2>
          ))}
        </motion.div>
      </div>

      {/* Row 2 - Moves Right with edge mask and glow */}
      <div className="w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <motion.div 
          style={{ x: x2, opacity, scale }}
          className="whitespace-nowrap flex will-change-transform select-none"
        >
          {[0, 1].map((i) => (
            <h2 
              key={i} 
              className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.9] pr-8 sm:pr-12 text-transparent bg-clip-text bg-gradient-to-r from-white/40 via-white/70 to-white"
            >
              DAY ONE CONTRIBUTION — ZERO INTERRUPTIONS —{" "}
            </h2>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
