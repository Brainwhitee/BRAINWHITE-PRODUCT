"use client";

import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Code2, Users, FolderGit2, Check, Sparkles } from "lucide-react";

const DASHBOARD_WORKSPACES = [
  {
    role: "Developer Workspace",
    tagline: "For engineers ramping up on production code from Day 1.",
    href: "/learn",
    badge: "Interactive & Gamified",
    accentColor: "#6366f1",
    gradient: "from-indigo-500/20 via-blue-500/10 to-transparent",
    icon: Code2,
    features: [
      "4-Level onboarding modules with concrete line-by-line milestones",
      "Interactive AST symbol inspector & live call graph hierarchies",
      "Hands-on sandbox tasks verified against repository test suites",
      "Codebase Pair Copilot grounded strictly in your repository",
    ],
    cta: "Launch Developer Portal",
  },
  {
    role: "Engineering Manager HQ",
    tagline: "For engineering directors, leads & managers overseeing cohorts.",
    href: "/dashboard",
    badge: "Team Governance & ROI",
    accentColor: "#a855f7",
    gradient: "from-purple-500/20 via-pink-500/10 to-transparent",
    icon: Users,
    features: [
      "Cohort readiness velocity tracking and time-to-first-PR analytics",
      "Interactive engineer roster with evidence-backed production sign-off",
      "Automated skill gap matrix across core architectural domains",
      "Objective 7-pillar PR scoring with automated feedback dispatch",
    ],
    cta: "Launch Manager Dashboard",
  },
  {
    role: "Codebase & Repositories",
    tagline: "For platform engineers, DevOps & security administrators.",
    href: "/projects",
    badge: "Native GitHub App",
    accentColor: "#10b981",
    gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
    icon: FolderGit2,
    features: [
      "1-Click multi-tenant GitHub App installation & private repo access",
      "Automated AST architecture graphs and modular chunk extraction",
      "Ephemeral sandbox execution with zero IP code retention",
      "Multi-tenant role-based permissions and cryptographic audit logs",
    ],
    cta: "Launch Repository Console",
  },
];

export function Works() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 25,
    restDelta: 0.001,
  });

  // 3D tilt effect: gently rotates into perspective on entry and flattens out smoothly
  const rotateX = useTransform(smoothProgress, [0, 0.45, 0.55, 1], [12, 0, 0, -12]);
  const scale = useTransform(smoothProgress, [0, 0.5, 1], [0.96, 1, 0.96]);
  const letterY = useTransform(smoothProgress, [0, 1], [60, -60]);

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-[#050505] text-white py-24 sm:py-32 px-6 md:px-12 z-10 overflow-hidden [perspective:1200px]"
    >
      {/* Background massive "PLATFORM" watermark */}
      <div className="absolute top-0 left-0 w-full overflow-hidden pointer-events-none opacity-[0.025] select-none flex justify-between px-6 pt-10">
        {"PLATFORM".split("").map((letter, i) => (
          <motion.span
            key={i}
            style={{ y: letterY }}
            className="text-[18vw] leading-[0.8] font-black uppercase text-white"
          >
            {letter}
          </motion.span>
        ))}
      </div>

      {/* Editorial Header */}
      <div className="relative z-10 max-w-5xl mx-auto mb-16 sm:mb-20">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">
            ( Three Dedicated Workspaces )
          </span>
        </div>

        <h2 className="text-3xl sm:text-5xl md:text-6xl font-light tracking-tight leading-[1.05]">
          Good platforms organize. <br />
          <span className="font-serif italic text-white/80">Great platforms accelerate.</span>
        </h2>
        <p className="mt-4 text-sm sm:text-base text-white/60 max-w-2xl leading-relaxed font-sans">
          Engineers need hands-on quests. Managers need cohort audit signals. Platform teams need
          real GitHub ingestion and tenant isolation. BrainWhite delivers three specialized
          dashboards built for their exact workflows.
        </p>
      </div>

      {/* 3 Dedicated Dashboard Cards with 3D Tilt Physics (OdysseyUI Pricing-6 Style) */}
      <motion.div 
        style={{ 
          rotateX,
          scale,
          transformStyle: "preserve-3d"
        }}
        className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 will-change-transform"
      >
        {DASHBOARD_WORKSPACES.map((ws, i) => {
          const Icon = ws.icon;
          return (
            <div
              key={ws.role}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="group relative rounded-3xl p-6 sm:p-8 bg-[#0a0a0a] border border-white/10 hover:border-white/30 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-2xl"
            >
              {/* Top ambient orb glow (OdysseyUI style) */}
              <div
                className="absolute -top-24 -right-24 w-52 h-52 rounded-full blur-3xl opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity"
                style={{ backgroundColor: ws.accentColor }}
              />

              <div className="relative z-10 space-y-5">
                {/* Header Badge & Index */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                      style={{ backgroundColor: `${ws.accentColor}30`, border: `1px solid ${ws.accentColor}50` }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/80 font-semibold">
                      {ws.badge}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-white/30">0{i + 1}</span>
                </div>

                {/* Title & Tagline */}
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-white group-hover:text-white transition-colors">
                    {ws.role}
                  </h3>
                  <p className="text-xs text-white/60 mt-1.5 leading-relaxed font-sans">
                    {ws.tagline}
                  </p>
                </div>

                {/* Capabilities Feature Checklist */}
                <div className="pt-4 border-t border-white/10 space-y-2.5">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 block">
                    Core Capabilities:
                  </span>
                  {ws.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-white/70">
                      <div 
                        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: `${ws.accentColor}25` }}
                      >
                        <Check className="w-2.5 h-2.5" style={{ color: ws.accentColor }} />
                      </div>
                      <span className="leading-relaxed">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Solid CTA Button */}
              <div className="relative z-10 pt-6 mt-6 border-t border-white/10">
                <Link href={ws.href}>
                  <button
                    type="button"
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-white text-black hover:bg-neutral-200 group-hover:scale-102 shadow-lg cursor-pointer"
                  >
                    <span>{ws.cta}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>
            </div>
          );
        })}
      </motion.div>
    </section>
  );
}
