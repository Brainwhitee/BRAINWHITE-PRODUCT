"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

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
          }, 400); // Short pause at 100%
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 100);

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
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-[#050505] text-white"
        >
          <div className="flex flex-col items-center gap-8">
            <div className="overflow-hidden flex flex-col items-center gap-3">
              <Image
                src="/Brainwhitelogo-transparent.png"
                alt="BrainWhite"
                width={180}
                height={48}
                className="h-9 w-auto object-contain"
                priority
              />
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-[10px] tracking-[0.4em] font-mono uppercase text-white/60"
              >
                Developer Readiness Engine
              </motion.span>
            </div>
            
            <div className="text-giant font-light tabular-nums leading-none tracking-tighter">
              {progress}
              <span className="text-large opacity-50 ml-1">%</span>
            </div>
          </div>
          
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-white/20 overflow-hidden">
            <motion.div 
              className="h-full bg-white"
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
