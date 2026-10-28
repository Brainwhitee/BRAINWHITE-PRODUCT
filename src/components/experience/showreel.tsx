"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function Showreel() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const scale = useTransform(scrollYProgress, [0, 0.5], [0.9, 1]);
  
  return (
    <section ref={containerRef} className="relative w-full bg-[#050505] text-white py-32 md:py-48 px-6 md:px-10 overflow-hidden">
      
      {/* Title */}
      <div className="flex justify-center mb-16 md:mb-24">
        <h2 className="text-3xl md:text-5xl lg:text-7xl font-light tracking-tight text-center leading-tight">
          Most platforms test code.<br />
          <span className="italic opacity-70 font-serif">We test readiness.</span>
        </h2>
      </div>

      {/* Video Container */}
      <motion.div 
        style={{ scale }}
        className="relative w-full aspect-video md:aspect-[21/9] rounded-sm overflow-hidden"
      >
        <video 
          src="https://noth-in.b-cdn.net/showreel-nothin_DEF.mp4" 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Decorative Overlay / Caption */}
        <div className="absolute bottom-6 right-6 flex flex-col items-end text-xs font-mono tracking-widest text-white/80 mix-blend-difference">
          <span>( THE PLATFORM IN ACTION )</span>
        </div>
      </motion.div>
      
      <div className="mt-16 md:mt-24 max-w-2xl mx-auto text-center md:text-left md:ml-auto md:mr-24">
        <p className="text-lg md:text-2xl font-light leading-relaxed opacity-80">
          In a world of infinite documentation, the rare thing is context. Codebases defend architecture, experiences shift learning curves, and BrainWhite changes how engineering teams scale.
        </p>
      </div>

    </section>
  );
}
