"use client";

import { WorksWheel, type WorksWheelItem } from "@/components/ui/works-wheel";

// Generate beautiful, production-ready SVG Data URIs with gradients and topic-specific icons
const generateIconSvg = (pathData: string, color1: string, color2: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#grad)"/>
  <svg x="300" y="200" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    ${pathData}
  </svg>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const ICONS = {
  ai: '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>',
  route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
  code: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><polyline points="10 13 8 15 10 17"/><polyline points="14 13 16 15 14 17"/>',
  chart: '<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>',
  health: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  pr: '<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" x2="6" y1="9" y2="21"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
  docs: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>'
};

const WORKS: WorksWheelItem[] = [
  {
    title: "AI Readiness",
    image: generateIconSvg(ICONS.ai, "#0f172a", "#3b82f6"), // Slate to Blue
    href: "#ai-readiness",
  },
  {
    title: "Onboarding Flows",
    image: generateIconSvg(ICONS.route, "#1e1b4b", "#8b5cf6"), // Violet deep to Purple
    href: "#onboarding-flows",
  },
  {
    title: "Code Context",
    image: generateIconSvg(ICONS.code, "#064e3b", "#10b981"), // Emerald deep to Emerald
    href: "#code-context",
  },
  {
    title: "Team Metrics",
    image: generateIconSvg(ICONS.chart, "#450a0a", "#ef4444"), // Red deep to Red
    href: "#team-metrics",
  },
  {
    title: "Developer Health",
    image: generateIconSvg(ICONS.health, "#4c1d95", "#d946ef"), // Purple deep to Fuchsia
    href: "#developer-health",
  },
  { 
    title: "Security Audits", 
    image: generateIconSvg(ICONS.shield, "#171717", "#64748b"), // Black to Slate
    href: "#security-audits" 
  },
  {
    title: "PR Analysis",
    image: generateIconSvg(ICONS.pr, "#0c4a6e", "#0ea5e9"), // Sky deep to Sky
    href: "#pr-analysis",
  },
  {
    title: "Golden Evals",
    image: generateIconSvg(ICONS.award, "#422006", "#eab308"), // Yellow deep to Yellow
    href: "#golden-evals",
  },
  {
    title: "Documentation",
    image: generateIconSvg(ICONS.docs, "#14532d", "#22c55e"), // Green deep to Green
    href: "#documentation",
  },
];

import { useRef } from "react";
import { useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { useState } from "react";

export default function WorksWheelDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setProgress(latest);
  });

  return (
    <div ref={containerRef} className="relative w-full h-[300vh] bg-[#050505]">
      <div className="sticky top-0 w-full h-screen flex items-center justify-center border-y border-white/10 overflow-hidden">
        <div className="absolute top-10 left-10 z-10 hidden md:block">
          <p className="text-sm font-mono tracking-widest uppercase opacity-60">
            Interactive Capabilities Wheel (Scroll Down)
          </p>
        </div>
        <WorksWheel 
          items={WORKS} 
          label="BrainWhite" 
          action="Explore" 
          progress={progress} 
        />
      </div>
    </div>
  );
}
