"use client";

import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useRef } from "react";
import ContributionSkyline from "@/components/ui/contribution-skyline";

export function DeveloperMetrics() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 25,
    restDelta: 0.001,
  });

  // Dynamic 3D perspective tilt that tilts dynamically as you scroll and flattens out smoothly
  const rotateX = useTransform(smoothProgress, [0, 0.45, 0.55, 1], [16, 0, 0, -16]);
  const scale = useTransform(smoothProgress, [0, 0.5, 1], [0.94, 1, 0.94]);
  const y = useTransform(smoothProgress, [0, 1], ["10%", "-10%"]);

  return (
    <section 
      ref={containerRef}
      className="relative min-h-[90vh] w-full bg-white text-black py-16 md:py-32 flex flex-col items-center justify-center overflow-hidden [perspective:1200px]"
    >
      <div className="container mx-auto px-6 md:px-12 flex flex-col items-center max-w-6xl">
        
        <div className="text-center mb-14 md:mb-20 space-y-5 relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl sm:text-5xl md:text-6xl lg:text-[5.5rem] leading-none font-black uppercase tracking-tighter text-slate-950"
          >
            Engagement<br/>Topography
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-sm sm:text-base md:text-lg font-medium tracking-tight text-slate-500 max-w-2xl mx-auto uppercase px-2"
          >
            Visualize how engineering teams onboard. The transition from zero knowledge to high impact, mapped dimensionally.
          </motion.p>
        </div>

        {/* 3D Dynamic Tilt Container */}
        <motion.div 
          style={{ 
            y,
            rotateX,
            scale,
            transformStyle: "preserve-3d"
          }}
          className="w-full relative z-20 transition-all duration-300 will-change-transform"
        >
          <ContributionSkyline 
            palette="mono" 
            title="Developer Readiness Velocity" 
            unit="milestone"
            className="!border-slate-200 !bg-slate-50 !text-black shadow-2xl ring-1 ring-black/5 rounded-3xl"
          />
        </motion.div>
        
      </div>
    </section>
  );
}
