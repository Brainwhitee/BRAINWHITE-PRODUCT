"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, BarChart, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import ConstellationGrid from "./ui/constellation-grid";

const views = [
  {
    id: "developers",
    title: "For developers",
    icon: <Code2 className="w-4 h-4" />,
    description:
      "Guided onboarding, codebase context, and an assistant that already knows the project — so the first hard question doesn't have to go to a Slack DM.",
    content: (
      <div className="w-full h-full flex flex-col bg-zinc-950 text-zinc-300 font-mono text-sm p-4 relative overflow-hidden">
        <div className="flex gap-2 mb-4 text-xs text-zinc-500 border-b border-zinc-800 pb-2">
          <span className="text-zinc-300">app/api/auth/route.ts</span>
          <span>app/components/header.tsx</span>
        </div>
        <div className="space-y-2">
          <p><span className="text-pink-400">import</span> {"{ NextResponse }"} <span className="text-pink-400">from</span> <span className="text-green-300">'next/server'</span>;</p>
          <p className="opacity-50">...</p>
          <p><span className="text-pink-400">export async function</span> <span className="text-blue-400">POST</span>(req: Request) {"{"}</p>
          <p className="pl-4 text-zinc-500">// Brainwhite Context: We use NextAuth v5 here.</p>
          <p className="pl-4 text-zinc-500">// Check internal docs: "Authentication Flow 2026"</p>
          <p className="pl-4">{"}"}</p>
        </div>
        
        {/* Floating Assistant Widget */}
        <div className="absolute bottom-4 right-4 bg-zinc-900 border border-zinc-800 rounded-lg p-3 w-64 shadow-2xl">
          <p className="text-xs text-zinc-400 mb-2 font-sans">Brainwhite Assistant</p>
          <div className="bg-zinc-800 rounded p-2 text-xs font-sans text-zinc-200">
            It looks like you're exploring the auth flow. Our SSO integration is handled in middleware.ts. Want me to explain how it works?
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "managers",
    title: "For managers & mentors",
    icon: <BarChart className="w-4 h-4" />,
    description:
      "Visibility into where every new developer stands, what's blocking them, and where mentor time is actually needed.",
    content: (
      <div className="w-full h-full bg-[#0a0a0a] p-6 flex flex-col gap-4 font-sans relative overflow-hidden">
        <h4 className="font-semibold text-white">Onboarding Cohort - Q3</h4>
        
        <div className="bg-white/5 p-4 rounded-xl border border-white/10 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">
              JD
            </div>
            <div>
              <p className="text-sm font-medium text-white">Jane Doe</p>
              <p className="text-xs text-neutral-400">Frontend Engineer</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md">85% Complete</p>
            <p className="text-xs text-neutral-400 mt-1">Ready for first ticket</p>
          </div>
        </div>

        <div className="bg-white/5 p-4 rounded-xl border border-white/10 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-sm">
              AS
            </div>
            <div>
              <p className="text-sm font-medium text-white">Alex Smith</p>
              <p className="text-xs text-neutral-400">Backend Engineer</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-md">Stuck on DB Setup</p>
            <p className="text-xs text-neutral-400 mt-1">Mentor intervention needed</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "admins",
    title: "For admins",
    icon: <ShieldCheck className="w-4 h-4" />,
    description:
      "Control over which repositories, documentation, and tools are connected, who can access what, and how it's all secured.",
    content: (
      <div className="w-full h-full bg-[#0a0a0a] p-6 font-sans relative overflow-hidden flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h4 className="font-medium text-white">Data Sources</h4>
          <button className="text-xs bg-white text-black px-3 py-1.5 rounded-md font-medium">Add Connection</button>
        </div>
        
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">GitHub Organization</p>
                <p className="text-xs text-neutral-400">Connected • 42 Repositories</p>
              </div>
            </div>
            <div className="h-4 w-8 bg-green-500 rounded-full relative shadow-[0_0_10px_rgba(34,197,94,0.3)]">
              <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
            </div>
          </div>

          <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold font-serif text-lg">
                C
              </div>
              <div>
                <p className="text-sm font-medium text-white">Confluence Space</p>
                <p className="text-xs text-neutral-400">Connected • Engineering Wiki</p>
              </div>
            </div>
            <div className="h-4 w-8 bg-green-500 rounded-full relative shadow-[0_0_10px_rgba(34,197,94,0.3)]">
              <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

export function ThreeViews() {
  const [activeTab, setActiveTab] = useState(views[0].id);

  const activeView = views.find((v) => v.id === activeTab) || views[0];

  return (
    <section className="py-24 md:py-32 relative overflow-hidden bg-black border-y border-white/5">
      <div className="absolute inset-0 z-0 opacity-40">
        <ConstellationGrid />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 mb-6">
            One platform, three views
          </h2>
          <p className="text-lg md:text-xl text-zinc-400 font-light leading-relaxed">
            Built for everyone involved in getting a new hire up to speed.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">

          {/* Tabs Navigation (Left side on desktop) */}
          <div className="flex flex-col gap-2 w-full lg:w-1/3">
            {views.map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveTab(view.id)}
                className={cn(
                  "relative flex flex-col text-left p-6 rounded-2xl transition-all duration-300",
                  activeTab === view.id
                    ? "bg-blue-500/10 shadow-xl border border-blue-500/30 backdrop-blur-md"
                    : "hover:bg-white/5 border border-transparent"
                )}
              >
                <div
                  className={cn(
                    "flex items-center gap-3 mb-2 font-semibold",
                    activeTab === view.id ? "text-white" : "text-white/50"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg",
                    activeTab === view.id ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "bg-white/5 text-white/50"
                  )}>
                    {view.icon}
                  </div>
                  <span className="text-lg tracking-tight">{view.title}</span>
                </div>

                <AnimatePresence initial={false}>
                  {activeTab === view.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="text-sm text-zinc-400 mt-2 leading-relaxed font-light">
                        {view.description}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            ))}
          </div>

          {/* Tab Content Window (Right side on desktop) */}
          <div className="w-full lg:w-2/3">
            <div className="relative w-full h-[480px] sm:h-[500px] lg:h-[550px] rounded-2xl border border-white/10 bg-[#0f0f11] shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/5">
              
              {/* Fake Mac Title Bar */}
              <div className="h-10 w-full bg-[#1a1b1e] border-b border-white/10 flex items-center px-4 gap-2 flex-shrink-0 z-10">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]"></div>
                <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
              </div>

              {/* Content Area */}
              <div className="flex-1 relative overflow-hidden bg-[#0f0f11]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeView.id}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="absolute inset-0"
                  >
                    {activeView.content}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
