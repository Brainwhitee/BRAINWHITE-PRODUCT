"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function StudioVideo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Parallax the background
  const yBg = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
  // Scale the video display as we scroll into it
  const scaleArtwork = useTransform(scrollYProgress, [0.25, 0.65], [0.85, 1.05]);

  return (
    <section ref={containerRef} className="relative w-full h-[140vh] md:h-[160vh] bg-[#050505] overflow-hidden">
      
      {/* Background with subtle ambient darkening */}
      <motion.div style={{ y: yBg }} className="absolute inset-0 w-full h-[120%] -top-[10%] z-0">
        <img 
          src="https://noth-in.b-cdn.net/freepik__photography-frontal-shot-of-a-huge-large-169-white__495122.webp" 
          alt="Architectural wall" 
          className="w-full h-full object-cover opacity-70 filter brightness-[0.7] contrast-[1.1]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]" />
        <div className="absolute inset-0 bg-black/40" />
      </motion.div>

      {/* Sticky Video in Frame */}
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center z-10 overflow-hidden px-4">
        
        {/* Caption Header */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-6 z-20"
        >
          <h3 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-white drop-shadow-md">
            Architectural Mapping & Assessment
          </h3>
        </motion.div>

        {/* The Video Screen Display */}
        <motion.div 
          style={{ scale: scaleArtwork }}
          className="relative w-[92vw] sm:w-[85vw] md:w-[65vw] max-w-5xl aspect-video rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.8)] border border-white/20 bg-black cursor-pointer group"
        >
          {/* Main Product Video: Brainwhitev2 */}
          <video 
            src="/Brainwhitev2.mp4" 
            autoPlay 
            loop 
            muted 
            playsInline 
            preload="auto"
            className="w-full h-full object-cover"
          />

          {/* Sleek edge vignette and glass reflection */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />
          <div className="absolute inset-0 rounded-xl sm:rounded-2xl ring-1 ring-inset ring-white/10 pointer-events-none" />
        </motion.div>
      </div>
    </section>
  );
}
