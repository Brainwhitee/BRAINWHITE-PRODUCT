"use client";

import React, { useRef, useState } from "react";
import { useScroll, motion, useTransform, useMotionValueEvent } from "framer-motion";
import { cn } from "@/lib/utils";

interface ContentItem {
  title: string;
  description: string;
  content: React.ReactNode;
}

interface StickyScrollProps {
  content: ContentItem[];
  className?: string;
}

export const StickyScroll = ({ content, className }: StickyScrollProps) => {
  const [activeCard, setActiveCard] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const cardLength = content.length;

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const cardsBreakpoints = content.map((_, index) => index / cardLength);
    const closestBreakpointIndex = cardsBreakpoints.reduce(
      (acc, breakpoint, index) => {
        const distance = Math.abs(latest - breakpoint);
        if (distance < Math.abs(latest - cardsBreakpoints[acc])) {
          return index;
        }
        return acc;
      },
      0
    );
    setActiveCard(closestBreakpointIndex);
  });

  const backgroundColors = [
    "var(--white)",
    "var(--neutral-50)",
    "var(--neutral-100)",
  ];

  return (
    <motion.div
      className={cn(
        "h-[250vh] w-full relative flex justify-center", // Extremely tall container for scrolling
        className
      )}
      ref={ref}
    >
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden px-4 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 max-w-7xl w-full h-[80vh] items-center">
          
          {/* Left Side: Sticky Text */}
          <div className="flex flex-col justify-center gap-12 lg:gap-16 h-full py-10">
            {content.map((item, index) => (
              <div key={item.title + index}>
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: activeCard === index ? 1 : 0.3,
                  }}
                  transition={{ duration: 0.5 }}
                  className="text-2xl md:text-3xl lg:text-4xl font-semibold text-white tracking-tight"
                >
                  {item.title}
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: activeCard === index ? 1 : 0.3,
                  }}
                  transition={{ duration: 0.5 }}
                  className="text-base md:text-lg text-neutral-400 max-w-sm mt-4 font-sans leading-relaxed"
                >
                  {item.description}
                </motion.p>
              </div>
            ))}
          </div>

          {/* Right Side: Sticky Visuals */}
          <div className="hidden md:flex h-full w-full items-center justify-center relative">
            <div className="w-full h-[400px] md:h-[500px] lg:h-[600px] rounded-3xl overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-neutral-100 bg-black">
              {content.map((item, index) => (
                <motion.div
                  key={"visual-" + index}
                  className="absolute inset-0 w-full h-full flex items-center justify-center bg-[#050505]"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{
                    opacity: activeCard === index ? 1 : 0,
                    scale: activeCard === index ? 1 : 0.95,
                    pointerEvents: activeCard === index ? "auto" : "none",
                  }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  {item.content}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
