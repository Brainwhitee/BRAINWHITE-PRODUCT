"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Bot, ShieldCheck, Zap } from "lucide-react";

export function VideoScrubSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Scale down from full size (1) to picture-in-picture size (0.35 on desktop, 0.55 on mobile)
  const scale = useTransform(scrollYProgress, [0, 0.85], [1, 0.36]);
  const borderRadius = useTransform(scrollYProgress, [0, 0.85], ["0px", "20px"]);

  // Animate text opacity and motion so it reveals smoothly as video shrinks
  const textOpacity = useTransform(scrollYProgress, [0.15, 0.45], [0, 1]);
  const textY = useTransform(scrollYProgress, [0.15, 0.45], [40, 0]);

  const features = [
    {
      icon: <Bot className="w-4 h-4 text-blue-400" />,
      title: "AST-Aware Repository RAG",
      desc: "Instant answers with exact code citations, file links, and architectural context."
    },
    {
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      title: "Verifiable Readiness Score",
      desc: "Measure developer comprehension with sandbox challenges before production access."
    },
    {
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      title: "4-Day Time to First PR",
      desc: "Replace weeks of passive wiki reading with targeted, active codebase walkthroughs."
    }
  ];

  return (
    <section ref={containerRef} className="relative h-[180vh] md:h-[260vh] w-full bg-white text-black">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-white">
        
        {/* Background Content (revealed on the left as video shrinks into bottom-right) */}
        <div className="absolute inset-0 flex flex-col justify-center p-6 sm:p-10 md:p-16 lg:p-20 z-0">
          <motion.div 
            style={{ opacity: textOpacity, y: textY }}
            className="max-w-xl md:max-w-2xl lg:max-w-3xl flex flex-col gap-4 sm:gap-6"
          >
            {/* Pill Badge (21st.dev style) */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/5 text-black/70 text-xs font-mono uppercase tracking-wider w-fit">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>Next-Gen Engineering Readiness</span>
            </div>

            {/* Main Headline */}
            <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.9]">
              Your Codebase.<br />
              <span className="text-black/40">Their Day-One Classroom.</span>
            </h2>

            {/* Explanation */}
            <p className="text-sm sm:text-base md:text-lg font-medium text-neutral-600 leading-relaxed max-w-xl">
              BrainWhite connects directly to your repositories, translating dense architectures into personalized learning paths — so every developer contributes safely from Day 1.
            </p>

            {/* Feature Cards Grid (21st.dev style) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {features.map((feat, idx) => (
                <div 
                  key={idx}
                  className="p-3.5 rounded-xl border border-black/10 bg-black/[0.02] hover:bg-black/[0.04] transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    {feat.icon}
                    <h4 className="text-xs font-bold uppercase tracking-tight text-neutral-900">{feat.title}</h4>
                  </div>
                  <p className="text-[11px] text-neutral-600 leading-snug">{feat.desc}</p>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link 
                href="/early-access"
                className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-colors shadow-lg shadow-black/10"
              >
                <span>Request Early Access</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link 
                href="/how-it-works"
                className="inline-flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold uppercase tracking-wider transition-colors"
              >
                <span>How It Works</span>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Video Wrapper (Smoothly scales down to bottom-right corner) */}
        <div className="absolute inset-0 z-10 p-4 md:p-8 pointer-events-none flex items-start md:items-end justify-center md:justify-end">
          <motion.div 
            className="w-full aspect-video md:aspect-auto md:h-full overflow-hidden shadow-2xl bg-black md:origin-bottom-right origin-top border border-black/10 relative"
            style={{ 
              scale,
              borderRadius
            }}
          >
            <video
              ref={videoRef}
              src="/Brainwhitev1.mp4" 
              className="w-full h-full object-cover scale-[1.15] md:scale-[1.1] translate-y-2 pointer-events-auto"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
            />

            {/* Dark vignette patch covering bottom-right corner to eliminate watermark */}
            <div className="absolute bottom-0 right-0 w-64 h-32 bg-gradient-to-tl from-black via-black/90 to-transparent pointer-events-none z-10" />

            {/* Bottom Right Gemini Watermark Cover with Prominent Large BrainWhite Logo */}
            <div className="absolute bottom-3 right-3 sm:bottom-6 sm:right-6 z-20 flex items-center gap-3 bg-black/95 backdrop-blur-xl px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-full border border-white/25 shadow-[0_10px_40px_rgba(0,0,0,0.95)] pointer-events-none">
              <Image
                src="/Brainwhitelogo-transparent.png"
                alt="BrainWhite"
                width={200}
                height={54}
                className="h-6 sm:h-8 md:h-10 w-auto object-contain"
              />
              <span className="text-xs sm:text-sm font-mono uppercase tracking-widest text-emerald-400 border-l border-white/20 pl-3 font-semibold">
                Platform v1
              </span>
            </div>
          </motion.div>
        </div>
        
      </div>
    </section>
  );
}
