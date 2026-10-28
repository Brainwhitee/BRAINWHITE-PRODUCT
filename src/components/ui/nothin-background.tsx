"use client";

import React, { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

interface NothinBackgroundProps {
  floatingAsset?: "heart" | "ribbon" | "asterisk" | "smiley" | "foil" | "balloon";
}

export function NothinBackground({ floatingAsset = "heart" }: NothinBackgroundProps) {
  const { scrollY } = useScroll();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Parallax transforms based on scroll
  const yParallax1 = useTransform(scrollY, [0, 1000], [0, -120]);
  const yParallax2 = useTransform(scrollY, [0, 1000], [0, 160]);
  const rotateParallax = useTransform(scrollY, [0, 1000], [0, 25]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientWidth, clientHeight } = document.documentElement;
      setMousePos({
        x: (e.clientX / clientWidth - 0.5) * 30,
        y: (e.clientY / clientHeight - 0.5) * 30,
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const assetMap = {
    heart: "/assets/nothin/chrome-heart.webp",
    ribbon: "/assets/nothin/chrome-ribbon.webp",
    asterisk: "/assets/nothin/chrome-asterisk.webp",
    smiley: "/assets/nothin/chrome-smiley.webp",
    foil: "/assets/nothin/chrome-foil.webp",
    balloon: "/assets/nothin/chrome-balloon.webp",
  };

  const primarySrc = assetMap[floatingAsset] || assetMap.heart;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#000000] select-none">
      {/* 1. Subtle radial spotlight top center */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.06)_0%,_transparent_70%)]" />

      {/* 2. Architectural 1px grid backdrop */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />

      {/* 3. Primary Floating 3D Metallic Chrome Object (Top-Right) */}
      <motion.div
        className="absolute top-24 right-8 sm:right-20 w-44 sm:w-64 h-44 sm:h-64 opacity-40 mix-blend-screen filter drop-shadow-[0_20px_40px_rgba(255,255,255,0.12)]"
        style={{
          y: yParallax1,
          rotate: rotateParallax,
          x: mousePos.x * 0.7,
        }}
        animate={{
          y: [0, -18, 0],
          rotate: [0, 4, 0],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Image
          src={primarySrc}
          alt="Chrome Sculpture"
          width={280}
          height={280}
          priority
          className="w-full h-full object-contain filter contrast-125 brightness-110"
        />
      </motion.div>

      {/* 4. Secondary Chrome Foil Fragment (Bottom-Left) */}
      <motion.div
        className="absolute bottom-20 left-6 sm:left-16 w-36 sm:w-52 h-36 sm:h-52 opacity-25 mix-blend-screen filter drop-shadow-[0_15px_30px_rgba(255,255,255,0.08)]"
        style={{
          y: yParallax2,
          x: -mousePos.x * 0.5,
        }}
        animate={{
          y: [0, 15, 0],
          rotate: [0, -6, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Image
          src="/assets/nothin/chrome-foil.webp"
          alt="Chrome Foil"
          width={220}
          height={220}
          className="w-full h-full object-contain filter contrast-125"
        />
      </motion.div>

      {/* 5. Minimalist Vertical Registration Guide Lines */}
      <div className="absolute inset-y-0 left-8 sm:left-16 w-[1px] bg-white/[0.04]" />
      <div className="absolute inset-y-0 right-8 sm:right-16 w-[1px] bg-white/[0.04]" />

      {/* 6. Subtle Vignette Border */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_50%,_rgba(0,0,0,0.6)_100%)]" />
    </div>
  );
}
