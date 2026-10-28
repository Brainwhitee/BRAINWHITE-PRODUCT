"use client";

import { motion, useInView } from "framer-motion";
import { ArrowRight, Terminal } from "lucide-react";
import { useRef } from "react";
import Link from "next/link";
import { EightBitText } from "./eight-bit-text";

/* ---------------- WordsPullUp ---------------- */
interface WordsPullUpProps {
  text: string;
  className?: string;
  showAsterisk?: boolean;
  style?: React.CSSProperties;
}

export const WordsPullUp = ({ text, className = "", showAsterisk = false, style }: WordsPullUpProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const words = text.split(" ");

  return (
    <div ref={ref} className={`inline-flex flex-wrap ${className}`} style={style}>
      {words.map((word, i) => {
        const isLast = i === words.length - 1;
        return (
          <motion.span
            key={i}
            initial={{ y: 20, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block relative"
            style={{ marginRight: isLast ? 0 : "0.25em" }}
          >
            {word}
            {showAsterisk && isLast && (
              <span className="absolute top-[0.65em] -right-[0.3em] text-[0.31em] text-blue-500">*</span>
            )}
          </motion.span>
        );
      })}
    </div>
  );
};

/* ---------------- Hero ---------------- */
const PrismaHero = () => {
  return (
    <section className="h-screen w-full bg-black relative">
      <div className="relative h-full w-full overflow-hidden md:rounded-[2rem]">
        
        {/* Background video - Keeping it for now but overlaying it heavily */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-30"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4"
        />

        {/* Tech Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none"></div>

        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black" />

        {/* Glowing Orb */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />

        {/* Subtitle and Button */}
        <div className="absolute inset-0 flex flex-col items-start justify-start px-4 sm:px-6 md:px-10 z-10 pointer-events-none pt-[25vh] sm:pt-[30vh]">
          <div className="pointer-events-auto flex flex-col items-start max-w-3xl">
            
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium text-white tracking-tight text-left drop-shadow-md mb-10"
              style={{ lineHeight: 1.2 }}
            >
              <EightBitText 
                text="New developers shouldn't need six weeks and three mentors just to understand your codebase." 
                delay={0.5}
              />
            </motion.h2>
          </div>
        </div>

        {/* Call to Action Button */}
        <div className="absolute bottom-16 sm:bottom-24 md:bottom-32 right-4 sm:right-6 md:right-10 z-20 pointer-events-auto flex justify-end">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link href="#how-it-works">
              <button className="relative inline-flex h-12 sm:h-14 items-center justify-center rounded-lg bg-blue-600 px-8 text-sm font-medium text-white sm:text-base font-sans cursor-pointer shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] transition-all overflow-hidden group border border-blue-400/30">
                <span className="relative z-10 flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-white" />
                  See How It Works
                  <ArrowRight className="h-4 w-4 text-white/70 transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            </Link>
          </motion.div>
        </div>

        {/* Hero title */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-2 sm:px-6 md:px-10 z-10 pointer-events-none">
          <h1
            className="font-bold leading-[0.85] tracking-[-0.07em] text-[26vw] sm:text-[24vw] md:text-[22vw] lg:text-[20vw] xl:text-[19vw] 2xl:text-[20vw]"
            style={{ color: "#ffffff" }}
          >
            <WordsPullUp text="Brainwhite" showAsterisk />
          </h1>
        </div>
      </div>
    </section>
  );
};

export {PrismaHero}

