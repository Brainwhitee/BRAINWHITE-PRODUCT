"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef } from "react";
import Image from "next/image";
import ScanlineBloom from "@/components/ui/scanline-bloom";

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  const cursorX = useMotionValue(-1000);
  const cursorY = useMotionValue(-1000);
  
  const blob1X = useSpring(cursorX, { stiffness: 150, damping: 20, mass: 0.1 });
  const blob1Y = useSpring(cursorY, { stiffness: 150, damping: 20, mass: 0.1 });
  
  const blob2X = useSpring(cursorX, { stiffness: 100, damping: 25, mass: 0.4 });
  const blob2Y = useSpring(cursorY, { stiffness: 100, damping: 25, mass: 0.4 });
  
  const blob3X = useSpring(cursorX, { stiffness: 60, damping: 30, mass: 0.8 });
  const blob3Y = useSpring(cursorY, { stiffness: 60, damping: 30, mass: 0.8 });

  const badgeX = useMotionValue(0);
  const badgeY = useMotionValue(0);

  useEffect(() => {
    let animationFrameId: number;
    let time = 0;
    
    const isMobile = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
    
    const animate = () => {
      if (isMobile && sectionRef.current) {
        const width = sectionRef.current.clientWidth;
        const height = sectionRef.current.clientHeight;
        
        // Complex Lissajous curve for natural floating
        const cx = width / 2;
        const cy = height / 2;
        const x = cx + Math.sin(time * 0.7) * (width * 0.35);
        const y = cy + Math.cos(time * 0.5) * (height * 0.25);
        
        cursorX.set(x);
        cursorY.set(y);
        
        time += 0.015;
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    
    if (isMobile) {
      animate();
    }
    
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [cursorX, cursorY]);

  // Subtle magnetic effect for the bottom right badge
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) return;
    if (!sectionRef.current) return;
    const sectionRect = sectionRef.current.getBoundingClientRect();
    const relativeX = e.clientX - sectionRect.left;
    const relativeY = e.clientY - sectionRect.top;

    cursorX.set(relativeX);
    cursorY.set(relativeY);

    if (!badgeRef.current) return;
    const badgeRect = badgeRef.current.getBoundingClientRect();
    const centerX = badgeRect.left + badgeRect.width / 2;
    const centerY = badgeRect.top + badgeRect.height / 2;
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    
    // Max magnetic pull distance
    if (Math.abs(distanceX) < 100 && Math.abs(distanceY) < 100) {
      badgeX.set(distanceX * 0.3);
      badgeY.set(distanceY * 0.3);
    } else {
      badgeX.set(0);
      badgeY.set(0);
    }
  };

  const handleMouseLeave = () => {
    if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) return;
    badgeX.set(0);
    badgeY.set(0);
    cursorX.set(-1000);
    cursorY.set(-1000);
  };

  return (
    <section 
      ref={sectionRef}
      className="relative h-[100dvh] w-full bg-white text-black overflow-hidden flex flex-col justify-between"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* ==================== WEBGL BACKGROUND ==================== */}
      <div className="absolute inset-0 z-0 bg-black">
        <ScanlineBloom ink="#ff3333" highlight="#ff8888" background="#000000" />
      </div>

      {/* GOOEY FILTER DEFINITION */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <filter id="goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -11" result="goo" />
        </filter>
      </svg>

      {/* ==================== CONTENT LAYER (STENCIL MASK & SPOTLIGHT) ==================== */}
      {/* We use mix-blend-screen. The solid white bg hides the flowers.
          The gooey black blobs become transparent windows revealing the WebGL colors beneath. */}
      <div className="absolute inset-0 z-10 mix-blend-screen pointer-events-none">
        
        {/* Solid White Base */}
        <div className="absolute inset-0 bg-white z-0" />

        {/* Liquid Cursor Reveal Layer */}
        <div className="absolute inset-0 z-10" style={{ filter: "url(#goo)" }}>
          {/* Main Wobbling Blob */}
          <motion.div 
            className="absolute top-0 left-0"
            style={{ x: blob1X, y: blob1Y }}
          >
            <motion.div 
              className="w-48 h-40 bg-black -ml-24 -mt-20"
              style={{ borderRadius: "40% 60% 70% 30%" }}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
            />
          </motion.div>
          {/* Trailing Blob 1 */}
          <motion.div 
            className="absolute top-0 left-0"
            style={{ x: blob2X, y: blob2Y }}
          >
            <div className="w-28 h-28 bg-black rounded-full -ml-14 -mt-14" />
          </motion.div>
          {/* Trailing Blob 2 */}
          <motion.div 
            className="absolute top-0 left-0"
            style={{ x: blob3X, y: blob3Y }}
          >
            <div className="w-16 h-16 bg-black rounded-full -ml-8 -mt-8" />
          </motion.div>
        </div>

        <div className="relative z-20 flex flex-col justify-between p-6 md:p-8 h-full w-full text-black">
        
        {/* ==================== TOP BAR ==================== */}
        <div className="flex justify-between items-start w-full relative z-20">
          
          {/* Top Left: Logo & CTA */}
          <div className="flex flex-col items-start gap-6">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-3"
            >
              <Image
                src="/Brainwhitelogo-dark.png"
                alt="BrainWhite"
                width={180}
                height={48}
                className="h-8 sm:h-10 w-auto object-contain"
                priority
              />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="text-xs md:text-sm font-medium tracking-tight leading-tight text-black/70"
            >
              AI-powered developer onboarding<br/>for engineering teams.
            </motion.div>

            <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
              <motion.a 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                href="/signup" 
                className="group relative inline-flex items-center justify-center bg-black text-white px-5 py-2.5 rounded-full overflow-hidden hover:scale-105 transition-transform duration-300 ease-out shadow-lg"
              >
                <span className="relative z-10 text-[11px] sm:text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <span>Get Started</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </motion.a>

              <motion.a 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.45, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                href="/login" 
                className="group relative inline-flex items-center justify-center bg-black/10 hover:bg-black/20 text-black px-4 py-2.5 rounded-full overflow-hidden hover:scale-105 transition-all duration-300 ease-out border border-black/15"
              >
                <span className="relative z-10 text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
                  Sign In
                </span>
              </motion.a>

              <motion.a 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                href="/dashboard" 
                className="group relative inline-flex items-center justify-center bg-black/10 hover:bg-black/20 text-black px-4 py-2.5 rounded-full overflow-hidden hover:scale-105 transition-all duration-300 ease-out border border-black/15"
              >
                <span className="relative z-10 text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
                  Workspace
                </span>
              </motion.a>
            </div>
          </div>

        {/* Top Right: Menu component handles the trigger globally */}
        </div>


        {/* ==================== HERO CENTERPIECE ==================== */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <h1 
            className="font-black uppercase tracking-tighter text-black overflow-hidden leading-[0.8] text-center w-full"
            style={{ fontSize: "clamp(2.5rem, 13vw, 18rem)" }}
          >
            {"BRAINWHITE".split("").map((char, index) => (
              <motion.span
                key={index}
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{
                  delay: 0.5 + index * 0.05,
                  duration: 1.2,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="inline-block"
              >
                {char}
              </motion.span>
            ))}
          </h1>
        </div>


        {/* ==================== BOTTOM NAVIGATION ==================== */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end w-full relative z-20 pb-2 gap-8 md:gap-0">
          
          {/* Bottom Left: Tracking Text */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-xs md:text-sm font-medium tracking-tight uppercase max-w-[200px] leading-snug mb-8 md:mb-0"
          >
            Onboarding for<br/>
            Client-Facing<br/>
            Engineering Teams
          </motion.div>

          {/* Bottom Right: Links & Badge */}
          <div className="flex items-end gap-12">
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 1 }}
              className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest pointer-events-auto"
            >
              <a href="#" className="relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] after:bg-black after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left">LKDN</a>
              <span className="opacity-30">/</span>
              <a href="#" className="relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] after:bg-black after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left">X.COM</a>
              <span className="opacity-30">/</span>
              <a href="#" className="relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] after:bg-black after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left">EN</a>
            </motion.div>

            <motion.div 
              ref={badgeRef}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.4, duration: 1, type: "spring", bounce: 0.4 }}
              className="relative hidden md:flex items-center justify-center w-24 h-24 bg-black text-white rounded-full cursor-pointer hover:bg-neutral-900 transition-colors pointer-events-auto"
              style={{ 
                x: badgeX, 
                y: badgeY 
              }}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center">
                Explore
              </span>
              {/* Spinning decorative border */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                className="absolute inset-2 border border-dashed border-white/30 rounded-full pointer-events-none"
              />
            </motion.div>

          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
