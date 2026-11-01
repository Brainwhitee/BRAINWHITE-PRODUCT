"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Network, ShieldCheck, Zap } from "lucide-react";
import { PullCordLamp } from "@/components/ui/pull-cord-lamp";

export function VideoScrubSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lampOn, setLampOn] = useState(true);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Track scroll direction & progress to modulate lamp state:
  // When scrolling down into the section, it dims/turns off; when scrolling up, it lights up.
  useEffect(() => {
    return scrollYProgress.on("change", (latest) => {
      if (latest > 0.55 && lampOn) {
        setLampOn(false);
      } else if (latest < 0.45 && !lampOn) {
        setLampOn(true);
      }
    });
  }, [scrollYProgress, lampOn]);

  const textOpacity = useTransform(scrollYProgress, [0.05, 0.35], [0.3, 1]);
  const textY = useTransform(scrollYProgress, [0.05, 0.35], [30, 0]);

  const features = [
    {
      icon: <Network className="w-4 h-4 text-slate-900" />,
      title: "AST-Aware Repository RAG",
      desc: "Instant answers with exact code citations, file links, and architectural call graphs."
    },
    {
      icon: <ShieldCheck className="w-4 h-4 text-slate-900" />,
      title: "Verifiable Readiness Score",
      desc: "Objective developer comprehension benchmarks evaluated directly on sandbox tasks."
    },
    {
      icon: <Zap className="w-4 h-4 text-slate-900" />,
      title: "4-Day Time to First PR",
      desc: "Replace weeks of passive wiki reading with targeted, active codebase walkthroughs."
    }
  ];

  return (
    <section ref={containerRef} className="relative min-h-[140vh] md:min-h-[180vh] w-full bg-white text-black transition-colors duration-700">
      <div className="sticky top-0 min-h-screen w-full flex flex-col justify-center overflow-hidden bg-white p-6 sm:p-10 md:p-16 lg:p-20">
        
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Headline, Narrative & Solid Cards */}
          <motion.div 
            style={{ opacity: textOpacity, y: textY }}
            className="lg:col-span-7 flex flex-col gap-6"
          >
            {/* Main Headline */}
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter leading-[0.92]">
              Your Codebase.<br />
              <span className="text-black/40">Their Day-One Classroom.</span>
            </h2>

            {/* Explanation */}
            <p className="text-sm sm:text-base md:text-lg font-medium text-neutral-600 leading-relaxed max-w-xl">
              BrainWhite connects directly to your repositories, translating dense architectures into personalized learning paths — so every developer contributes safely from Day 1.
            </p>

            {/* 3 Solid High-Contrast Cards (21st.dev style, strictly SVG icons, NO emojis) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              {features.map((feat, idx) => (
                <div 
                  key={idx}
                  className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-black transition-all shadow-xs flex flex-col justify-between"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                    {feat.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-tight text-slate-900 mb-1">
                      {feat.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link 
                href="/signup"
                className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors shadow-lg"
              >
                <span>Request Early Access</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link 
                href="/how-it-works"
                className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 px-5 py-3 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors border border-slate-200"
              >
                <span>How It Works</span>
              </Link>
            </div>
          </motion.div>

          {/* Right Column: Interactive Pull Cord Lamp Component */}
          <div className="lg:col-span-5 h-[380px] sm:h-[480px] md:h-[540px] w-full relative flex items-center justify-center">
            <div className="w-full h-full rounded-3xl border border-slate-200/80 bg-slate-50/70 p-4 shadow-sm relative overflow-hidden flex flex-col items-center justify-center">
              
              {/* Interactive Lamp */}
              <div className="w-full h-full flex items-center justify-center relative">
                <PullCordLamp
                  size="fill"
                  on={lampOn}
                  onChange={(val) => setLampOn(val)}
                  label="Architectural Illumination"
                  shade="dome"
                  bulb="clear"
                  finish="graphite"
                  warmth={2800}
                />
              </div>

              {/* Status pill under lamp */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/90 border border-slate-200/90 shadow-2xs text-[11px] font-mono text-slate-600 flex items-center gap-2 pointer-events-none select-none">
                <span className={`w-2 h-2 rounded-full ${lampOn ? "bg-amber-400 animate-pulse" : "bg-slate-300"}`} />
                <span>{lampOn ? "Codebase Illuminated" : "Pull Cord to Light Up"}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
