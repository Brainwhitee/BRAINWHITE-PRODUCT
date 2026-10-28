"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-[11px] font-mono uppercase tracking-[0.2em] text-white/70 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>BrainWhite Engine v2.0 In Action</span>
          </div>
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

          {/* Dark corner blackout patch to eliminate any watermark traces */}
          <div className="absolute bottom-0 right-0 w-72 h-36 bg-gradient-to-tl from-black via-black/90 to-transparent pointer-events-none z-10" />

          {/* Large prominent BrainWhite logo badge covering watermark */}
          <div className="absolute bottom-3 right-3 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 z-20 flex items-center gap-3 bg-black/95 backdrop-blur-xl px-5 sm:px-6 py-2.5 sm:py-3.5 rounded-full border border-white/25 shadow-[0_10px_40px_rgba(0,0,0,0.95)] pointer-events-none">
            <Image
              src="/Brainwhitelogo-transparent.png"
              alt="BrainWhite"
              width={220}
              height={60}
              className="h-7 sm:h-9 md:h-11 w-auto object-contain"
            />
            <span className="text-xs sm:text-sm font-mono uppercase tracking-widest text-white/80 border-l border-white/20 pl-3 font-semibold">
              Engine v2.0
            </span>
          </div>
        </motion.div>

        {/* Sub-caption below video */}
        <p className="mt-6 text-xs sm:text-sm font-mono text-white/50 uppercase tracking-widest text-center max-w-md">
          Autonomous repository analysis · Live readiness verification
        </p>
      </div>

    </section>
  );
}
