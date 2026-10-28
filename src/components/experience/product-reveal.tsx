"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function ProductReveal() {
  const targetRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-66.66%"]);

  return (
    <section ref={targetRef} className="relative h-[300vh]">
      <div className="sticky top-0 h-screen flex items-center overflow-hidden bg-[#0a0a0a]">
        <motion.div style={{ x }} className="flex w-[300vw] h-full">
          
          {/* Panel 1 */}
          <div className="w-[100vw] h-full flex flex-col justify-center px-12 md:px-32 border-r border-white/5 relative">
            <p className="text-meta text-accent mb-8 absolute top-32">01 / CLIENT ONBOARDING</p>
            <h3 className="text-display-medium mb-8 max-w-4xl leading-tight">
              Onboarding is different when your engineers move between clients.
            </h3>
            <p className="text-body text-muted max-w-xl">
              Product companies may onboard an engineer once. Staffing and consulting firms do it again and again. New client, new codebase, new stack.
            </p>
            
            <div className="absolute right-0 bottom-0 w-1/2 h-1/2 opacity-20 pointer-events-none">
              {/* Abstract Graphic */}
              <svg viewBox="0 0 100 100" className="w-full h-full fill-white">
                <circle cx="100" cy="100" r="80" />
              </svg>
            </div>
          </div>

          {/* Panel 2 */}
          <div className="w-[100vw] h-full flex flex-col justify-center px-12 md:px-32 border-r border-white/5 relative bg-[#0d0d0d]">
            <p className="text-meta text-accent mb-8 absolute top-32">02 / FRESHER ONBOARDING</p>
            <h3 className="text-display-medium mb-8 max-w-4xl leading-tight">
              Guided context that scales.
            </h3>
            <p className="text-body text-muted max-w-xl">
              From environment setup in Week 1, to feature development in Month 1. The first hard question doesn't have to go to a Slack DM.
            </p>
            
            <div className="absolute right-32 top-1/2 -translate-y-1/2 w-96 h-96 border border-white/10 rounded-full flex items-center justify-center">
              <div className="w-64 h-64 border border-white/20 rounded-full flex items-center justify-center">
                <div className="w-32 h-32 bg-white/5 rounded-full backdrop-blur-md" />
              </div>
            </div>
          </div>

          {/* Panel 3 */}
          <div className="w-[100vw] h-full flex flex-col justify-center px-12 md:px-32 relative bg-[#111111]">
            <p className="text-meta text-accent mb-8 absolute top-32">03 / FOR ADMINS</p>
            <h3 className="text-display-medium mb-8 max-w-4xl leading-tight">
              Control the flow of knowledge.
            </h3>
            <p className="text-body text-muted max-w-xl">
              Absolute control over which repositories, documentation, and tools are connected. Define who accesses what, and how it's secured.
            </p>
          </div>

        </motion.div>
      </div>
    </section>
  );
}
