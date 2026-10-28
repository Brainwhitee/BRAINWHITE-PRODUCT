"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Code2, Users, GitBranch, Bot, Sparkles, ShieldCheck } from "lucide-react";

const DASHBOARD_WORKSPACES = [
  {
    role: "Developer Workspace",
    tagline: "For engineers & freshers ramping up on production code.",
    href: "/developer/home",
    badge: "Interactive & Gamified",
    accentColor: "#4F46E5",
    features: [
      "Gamified 4-level onboarding quests with XP progression",
      "Interactive Tree-sitter AST symbol inspector & file hierarchy",
      "Hands-on sandbox tasks with automated test verification",
      "Codebase Q&A Copilot with exact line citations",
    ],
    cta: "Enter Developer Portal",
    img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
  },
  {
    role: "Engineering Manager HQ",
    tagline: "For engineering directors, leads & managers overseeing cohorts.",
    href: "/manager/overview",
    badge: "Team Governance & ROI",
    accentColor: "#9333EA",
    features: [
      "Cohort readiness average & velocity tracking (+12.4% ramp)",
      "Interactive Developer Roster with evidence-backed production sign-off",
      "Automated Skill Gap Matrix across core architectural domains",
      "Time-to-first-PR conversion funnel & $18,400 dev savings",
    ],
    cta: "Enter Manager Dashboard",
    img: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop",
  },
  {
    role: "Infrastructure & Repositories Admin",
    tagline: "For platform engineers, DevOps & security administrators.",
    href: "/admin/repositories",
    badge: "Real GitHub Engine",
    accentColor: "#10B981",
    features: [
      "Real GitHub REST API repository connection & branch tree loading",
      "7-Stage ingestion state machine (CONNECT ➔ READY)",
      "Concrete AST symbol persistence with exact line boundaries",
      "Tenant-scoped security enforcement and ADR knowledge base",
    ],
    cta: "Enter Admin Console",
    img: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2670&auto=format&fit=crop",
  },
];

export function Works() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const letterY = useTransform(scrollYProgress, [0, 1], [80, -80]);

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-[#050505] text-white py-24 sm:py-32 px-6 md:px-12 z-10"
    >
      {/* Background massive "WORKSPACES" watermark */}
      <div className="absolute top-0 left-0 w-full overflow-hidden pointer-events-none opacity-[0.03] select-none flex justify-between px-6 pt-10">
        {"PLATFORM".split("").map((letter, i) => (
          <motion.span
            key={i}
            style={{ y: letterY }}
            className="text-[20vw] leading-[0.8] font-bold uppercase"
          >
            {letter}
          </motion.span>
        ))}
      </div>

      {/* Editorial Header */}
      <div className="relative z-10 max-w-5xl mx-auto mb-16 sm:mb-20">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono uppercase tracking-widest text-[#ff6600]">
            ( Three Dedicated Workspaces )
          </span>
          <span className="text-white/30">•</span>
          <span className="text-xs font-mono text-white/50">One Unified Codebase</span>
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

      {/* 3 Dedicated Dashboard Cards */}
      <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {DASHBOARD_WORKSPACES.map((ws, i) => (
          <div
            key={ws.role}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            className="group relative rounded-3xl p-6 sm:p-8 bg-[#0A0A0A] border border-white/10 hover:border-white/30 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-2xl"
          >
            {/* Subtle background glow */}
            <div
              className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity"
              style={{ backgroundColor: ws.accentColor }}
            />

            <div className="relative z-10 space-y-4">
              {/* Badge */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/80 font-semibold">
                  {ws.badge}
                </span>
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

              {/* Features List */}
              <div className="pt-3 border-t border-white/10 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
                  Included Capabilities:
                </span>
                {ws.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-white/70">
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: ws.accentColor }}
                    />
                    <span className="leading-relaxed">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom CTA Link */}
            <div className="relative z-10 pt-6 mt-6 border-t border-white/10">
              <Link href={ws.href}>
                <button
                  type="button"
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-white text-black hover:bg-white/90 group-hover:scale-102 shadow-lg"
                >
                  <span>{ws.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
