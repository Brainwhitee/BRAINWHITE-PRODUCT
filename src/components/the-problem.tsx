"use client";

import { StickyScroll } from "./ui/sticky-scroll";
import { motion } from "framer-motion";
import { AuroraBackground } from "./ui/aurora-background";

const problemContent = [
  {
    title: "Scattered documentation",
    description:
      "Spread across repos, wikis, tickets, and chat, with no single place to start. Most of it assumes the reader already knows what's going on.",
    content: (
      <div className="h-full w-full flex items-center justify-center bg-[#0a0a0a] p-10 relative overflow-hidden">
        {/* Abstract Dev21 Style Aurora Background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
            }}
            transition={{ duration: 15, ease: "linear", repeat: Infinity }}
            className="absolute -inset-[10%] opacity-40 blur-[60px]"
            style={{
              background: `radial-gradient(circle at 50% 50%, rgba(255, 100, 0, 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 0, 0, 0.4) 0%, transparent 50%)`,
              backgroundSize: "200% 200%",
            }}
          />
        </div>
        
        {/* Subtle glass overlay (Chroma Theme Window) */}
        <div className="relative z-10 w-4/5 max-w-sm border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden flex flex-col font-mono text-xs">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 bg-white/5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
            <span className="ml-2 text-white/30 text-[10px]">architecture.md</span>
          </div>
          <div className="p-4 space-y-2">
            <p className="text-white/40">// Last updated: 2022</p>
            <p><span className="text-purple-400">import</span> {"{ core }"} <span className="text-purple-400">from</span> <span className="text-green-400">'@legacy/v1'</span></p>
            <p className="text-red-400 mt-2">Error: Module not found.</p>
            <p className="text-white/60">The architecture has moved to v2, but these docs were never updated...</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Repetitive mentor time",
    description:
      "Senior developers re-explain the same architecture to every new joiner. So new developers ask, and your senior engineers answer. Then the next hire joins, and it happens again.",
    content: (
      <div className="h-full w-full flex items-center justify-center bg-[#050505] p-10 relative overflow-hidden">
        {/* Abstract Dev21 Style Sparkles/Stars */}
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.8)]"
              style={{
                top: `${(i * 17) % 100}%`,
                left: `${(i * 23) % 100}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 2 + (i % 3),
                repeat: Infinity,
                delay: (i % 5) * 0.4,
              }}
            />
          ))}
        </div>
        
        {/* Chroma Theme Window */}
        <div className="relative z-10 w-4/5 max-w-sm border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden flex flex-col font-mono text-xs">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 bg-white/5">
            <span className="text-white/70">Slack — #engineering</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex gap-2">
              <div className="w-5 h-5 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">N</div>
              <p className="text-white/80"><span className="text-blue-400 font-semibold">New Hire</span><br/>Where do I find the auth flow?</p>
            </div>
            <div className="flex gap-2">
              <div className="w-5 h-5 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">S</div>
              <p className="text-white/80"><span className="text-amber-400 font-semibold">Senior Eng</span><br/>Ah, let me hop on a call. It's split across 3 repos...</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Slow time to first commit",
    description:
      "New hires need weeks to go from “I have access” to “I can actually contribute.” Onboarding shouldn't run on your best engineer's patience.",
    content: (
      <div className="h-full w-full flex items-center justify-center bg-[#050505] p-10 relative overflow-hidden">
        {/* Abstract Dev21 Style Retro Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
        
        {/* Glowing orb */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-64 h-64 bg-emerald-500/20 blur-[80px] rounded-full"
        />

        {/* Chroma Theme Window */}
        <div className="relative z-10 w-4/5 max-w-sm border border-emerald-500/30 bg-[#0a0a0a]/80 backdrop-blur-xl rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.1)] overflow-hidden flex flex-col font-mono text-xs">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 bg-white/5">
            <span className="text-emerald-400 font-semibold tracking-widest uppercase text-[10px]">Terminal</span>
          </div>
          <div className="p-4 space-y-2">
            <p className="text-white/60">$ git push origin feat/first-ticket</p>
            <p className="text-emerald-400">Enumerating objects: 14, done.</p>
            <p className="text-emerald-400">Writing objects: 100% (10/10), 2.34 KiB, done.</p>
            <p className="text-white mt-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              PR merged successfully.
            </p>
          </div>
        </div>
      </div>
    ),
  },
];

export function TheProblem() {
  return (
    <section className="py-24 md:py-32 w-full relative z-20 overflow-hidden bg-black/40 border-y border-white/5">
      <div className="absolute inset-0 z-0 opacity-40"><AuroraBackground showRadialGradient={true} className="h-full bg-transparent" /></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 mb-16 md:mb-24 relative z-10">
        <div className="max-w-3xl">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 mb-6" style={{ lineHeight: 1.15 }}>
            Onboarding shouldn't run on your best engineer's patience
          </h2>
          <p className="text-lg md:text-xl text-zinc-400 font-light leading-relaxed">
            Every developer who joins your team — or moves onto a new project — has to learn two things at once: how the company works, and how this specific codebase works.
          </p>
        </div>
      </div>

      <div className="relative z-10">
        <StickyScroll content={problemContent} />
      </div>
    </section>
  );
}
