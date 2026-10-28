"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import ContributionSkyline from "@/components/ui/contribution-skyline";

export function DeveloperMetrics() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["20%", "-20%"]);

  return (
    <section 
      ref={containerRef}
      className="relative min-h-[90vh] w-full bg-white text-black py-12 md:py-32 flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="container mx-auto px-6 md:px-12 flex flex-col items-center max-w-6xl">
        
        <div className="text-center mb-16 md:mb-24 space-y-6 relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl sm:text-5xl md:text-6xl lg:text-[6rem] leading-none font-black uppercase tracking-tighter"
          >
            Engagement<br/>Topography
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-sm sm:text-base md:text-xl font-medium tracking-tight text-neutral-500 max-w-2xl mx-auto uppercase px-2"
          >
            Visualize how engineering teams onboard. The transition from zero knowledge to high impact, mapped dimensionally.
          </motion.p>
        </div>

        <motion.div 
          style={{ y }}
          className="w-full relative z-20"
        >
          {/* We pass a custom palette to match the brutalist aesthetic */}
          <ContributionSkyline 
            palette="mono" 
            title="Developer Readiness Velocity" 
            unit="milestone"
            className="!border-neutral-200 !bg-neutral-50 !text-black shadow-2xl ring-1 ring-black/5"
          />
        </motion.div>
        
      </div>
    </section>
  );
}
