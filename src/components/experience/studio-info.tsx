"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function StudioInfo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 100]);

  return (
    <section ref={containerRef} className="relative w-full bg-[#050505] text-white py-32 md:py-48 px-6 md:px-10 z-20">
      
      {/* Top Text Block */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 max-w-7xl mx-auto">
        <div className="md:col-span-3 text-sm font-mono uppercase tracking-widest opacity-50">
          ( The Platform )
        </div>
        <div className="md:col-span-9 text-2xl md:text-5xl font-light leading-tight">
          We built BrainWhite because onboarding started as a paradox: 
          an empty space open enough to become anything—a wiki, a bootcamp, a checklist—
          <span className="italic font-serif opacity-70">but rarely what the engineer actually needed.</span>
        </div>
      </div>

      {/* Floating Images Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-32 max-w-6xl mx-auto">
        <motion.div style={{ y: y1 }} className="flex flex-col gap-6 pt-24">
          <div className="w-full aspect-[4/5] overflow-hidden bg-[#111]">
            <img 
              src="https://cdn.prod.website-files.com/6a0c501c42b9751b78a9d1a7/6a3171d9fb2a39d8054e9252_beton-plastic-V2.webp" 
              alt="Texture 1" 
              className="w-full h-full object-cover grayscale opacity-80"
            />
          </div>
          <div className="text-xl font-light leading-snug">
            or something <br/> unexpected.
          </div>
        </motion.div>
        
        <motion.div style={{ y: y2 }} className="w-full aspect-[4/5] overflow-hidden bg-[#111]">
          <img 
            src="https://cdn.prod.website-files.com/6a0c501c42b9751b78a9d1a7/6a317205d7b275b2d2985000_boule-chelou-coline-V2.webp" 
            alt="Texture 2" 
            className="w-full h-full object-cover grayscale opacity-80"
          />
        </motion.div>
      </div>

      <div className="mt-24 sm:mt-36 md:mt-48 mb-16 md:mb-24 max-w-7xl mx-auto">
        <h2 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-medium tracking-tighter uppercase leading-[0.9]">
          Forms follow <br/> architecture.
        </h2>
      </div>

      {/* Capabilities List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 max-w-7xl mx-auto border-t border-white/10 pt-16 md:pt-24">
        <div className="md:col-span-5 flex flex-col justify-between">
          <div className="text-xl sm:text-2xl font-light mb-8 md:mb-0">
            We deliver :
          </div>
          <div className="text-sm sm:text-base md:text-lg font-light opacity-60 hidden md:block">
            Architecture is where strategy <br/> meets engineering culture.
          </div>
        </div>
        
        <div className="md:col-span-7">
          <ul className="flex flex-col w-full">
            {["Tenant Isolation", "Role-Based Access", "AI Query Routing", "Readiness Analytics", "Custom Workflows"].map((item, i) => (
              <li key={i} className="group flex items-center gap-4 sm:gap-6 py-4 sm:py-6 border-b border-white/10 text-xl sm:text-3xl md:text-4xl lg:text-5xl font-light tracking-tight hover:pl-4 transition-all duration-300 cursor-default">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

    </section>
  );
}
