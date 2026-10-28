"use client";

import React from "react";
import { motion } from "framer-motion";

interface NothinMarqueeProps {
  text?: string[];
  reverse?: boolean;
  speed?: number;
  className?: string;
}

export function NothinMarquee({
  text = [
    "BRAINWHITE PLATFORM",
    "REAL CODEBASE CARTOGRAPHY",
    "TREE-SITTER AST RESOLUTION",
    "ZERO HALLUCINATIONS",
    "VERIFIED EVIDENCE LEDGER",
    "100% CITATION ACCURACY",
    "SWISS PRECISION ARCHITECTURE",
  ],
  reverse = false,
  speed = 28,
  className = "",
}: NothinMarqueeProps) {
  const repeated = [...text, ...text, ...text, ...text];

  return (
    <div className={`relative w-full overflow-hidden border-y border-white/10 bg-[#000000] py-2.5 select-none ${className}`}>
      {/* Edge gradient masks */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

      <motion.div
        className="flex whitespace-nowrap items-center gap-6"
        animate={{
          x: reverse ? ["-50%", "0%"] : ["0%", "-50%"],
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {repeated.map((item, idx) => (
          <div key={idx} className="flex items-center gap-6">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-white/70 hover:text-white transition-colors">
              {item}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
