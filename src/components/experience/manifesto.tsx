"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function Manifesto() {
  const container = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start center", "end center"],
  });

  const text = "THE OLD WAY MADE SENSE. UNTIL IT DIDN'T.";
  const words = text.split(" ");

  return (
    <section ref={container} className="py-40 min-h-[150vh] relative">
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center px-6">
        <p className="text-meta text-accent mb-12">THE PROBLEM</p>
        <h2 className="text-display-large text-center flex flex-wrap justify-center gap-x-4 md:gap-x-8 max-w-6xl leading-[0.9]">
          {words.map((word, i) => {
            const start = i / words.length;
            const end = start + (1 / words.length);
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const opacity = useTransform(scrollYProgress, [start, end], [0.1, 1]);
            
            return (
              <motion.span key={i} style={{ opacity }} className="inline-block">
                {word}
              </motion.span>
            );
          })}
        </h2>
        
        <div className="mt-24 grid md:grid-cols-3 gap-12 max-w-5xl mx-auto text-body text-muted font-light px-6">
          <p>Scattered documentation across repos, wikis, tickets, and chat. Most of it assumes the reader already knows what's going on.</p>
          <p>Repetitive mentor time. Senior developers re-explain the same architecture to every new joiner.</p>
          <p>Slow time to first commit. New hires need weeks to go from "I have access" to "I can actually contribute."</p>
        </div>
      </div>
    </section>
  );
}
