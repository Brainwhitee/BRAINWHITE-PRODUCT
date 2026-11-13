"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassIconReveal } from "@/components/ui/liquid-glass-logo-reveal";

export function Preloader() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Prevent scrolling while loading
    document.body.style.overflow = "hidden";

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setLoading(false);
            document.body.style.overflow = "";
          }, 450); // Clean finish at 100%
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 6;
      });
    }, 90);

    return () => {
      clearInterval(timer);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          key="preloader"
          initial={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ duration: 0.85, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-[#050505] text-white select-none"
        >
          <div className="flex flex-col items-center gap-6">
            {/* Liquid Glass Logo Reveal Component */}
            <div className="w-56 h-36 flex items-center justify-center overflow-hidden rounded-2xl">
              <GlassIconReveal
                logo="/Brainwhitelogo-transparent.png"
                label="BrainWhite"
                look="dark"
                background="#050505"
                logoColor="#ffffff"
                tileSize={240}
                logoScale={0.75}
                finalScale={0.88}
                className="w-full h-full"
              />
            </div>

            {/* Bold White Brain Name */}
            <div className="flex flex-col items-center gap-1">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white"
              >
                BrainWhite
              </motion.h1>
            </div>

            {/* Extra Bold & Large Progress Counter */}
            <div className="text-7xl sm:text-8xl md:text-9xl font-black font-mono tabular-nums leading-none tracking-tighter text-white mt-2">
              {progress}
              <span className="text-3xl sm:text-5xl font-light text-white/40 ml-2">%</span>
            </div>
          </div>

          {/* Minimalist Progress Track */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-64 h-[2px] bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.8)]"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
