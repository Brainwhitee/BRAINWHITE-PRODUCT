"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, CheckCircle2, Sparkles, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Doodle Crew avatars and metadata (inspired by doodle-crew-footer)
const CREW = [
  { name: "Dev Pair AI", role: "AST Copilot", avatar: "🤖", color: "from-blue-500 to-indigo-600" },
  { name: "Graph Engine", role: "AST Parser", avatar: "⚡", color: "from-emerald-500 to-teal-600" },
  { name: "PR Scorer", role: "7 Pillars", avatar: "🎯", color: "from-amber-500 to-orange-600" },
  { name: "Security Guard", role: "IP Isolation", avatar: "🛡️", color: "from-purple-500 to-pink-600" },
];

export function ExperienceFooter() {
  return (
    <footer className="relative w-full bg-[#050505] text-white pt-24 sm:pt-32 pb-12 px-6 sm:px-10 md:px-16 z-20 overflow-hidden border-t border-white/10">
      
      {/* Background ambient gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-b from-white/5 to-transparent blur-[120px] pointer-events-none" />

      {/* Unique Award-Winning Call to Action */}
      <div className="relative z-10 flex flex-col items-center justify-center mb-24 sm:mb-32 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono uppercase tracking-widest text-emerald-400 mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Next-Gen Engineering Onboarding</span>
        </div>

        <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.9] mb-8 text-white">
          Turn Codebases <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/40">
            Into Classrooms
          </span>
        </h2>
        
        <p className="text-sm sm:text-base md:text-lg text-white/60 max-w-xl mx-auto mb-10 leading-relaxed font-sans">
          Eliminate weeks of developer ramp-up time. Connect your repositories and synthesize day-one learning journeys.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link 
            href="/signup" 
            className="group relative inline-flex items-center justify-center gap-3 bg-white text-black hover:bg-neutral-200 px-8 py-4 rounded-full font-bold text-xs uppercase tracking-widest transition-all shadow-[0_0_40px_rgba(255,255,255,0.25)] hover:scale-105 w-full sm:w-auto"
          >
            <span>Start Free Trial</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
          
          <a 
            href="mailto:contact@brainwhite.com" 
            className="group inline-flex items-center justify-center gap-2 border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 text-white px-7 py-4 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors w-full sm:w-auto"
          >
            <span>contact@brainwhite.com</span>
          </a>
        </div>
      </div>

      {/* Doodle Crew Avatar Rail (Reference: doodle-crew-footer) */}
      <div className="relative z-10 max-w-6xl mx-auto mb-20 p-6 sm:p-8 rounded-3xl bg-neutral-950/80 border border-white/10 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">
                BrainWhite Autonomous Engine Crew
              </span>
            </div>
            <p className="text-xs text-white/60 mt-1">
              Four specialized agents operating continuously to index, evaluate, and mentor engineering cohorts.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-400 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>ALL SYSTEMS OPERATIONAL</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          {CREW.map((member, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -4 }}
              className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/30 transition-all flex items-center gap-3 group"
            >
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${member.color} flex items-center justify-center text-xl shadow-lg shrink-0 group-hover:scale-110 transition-transform`}>
                {member.avatar}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {member.name}
                </div>
                <div className="text-[10px] font-mono text-white/50 truncate">
                  {member.role}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer Navigation & Sitemap */}
      <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 pb-16 text-xs">
        <div>
          <h4 className="font-mono uppercase tracking-widest text-white/40 mb-4">Product</h4>
          <ul className="space-y-2.5">
            <li><Link href="/product" className="text-white/70 hover:text-white transition-colors">Overview</Link></li>
            <li><Link href="/architecture" className="text-white/70 hover:text-white transition-colors">Architecture Graph</Link></li>
            <li><Link href="/how-it-works" className="text-white/70 hover:text-white transition-colors">How It Works</Link></li>
            <li><Link href="/pricing" className="text-white/70 hover:text-white transition-colors">Pricing & Plans</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-mono uppercase tracking-widest text-white/40 mb-4">Enterprise</h4>
          <ul className="space-y-2.5">
            <li><Link href="/security" className="text-white/70 hover:text-white transition-colors">Security & Isolation</Link></li>
            <li><Link href="/projects" className="text-white/70 hover:text-white transition-colors">GitHub App Connect</Link></li>
            <li><Link href="/book-demo" className="text-white/70 hover:text-white transition-colors">Book Architecture Demo</Link></li>
            <li><Link href="/dashboard" className="text-white/70 hover:text-white transition-colors">Manager HQ</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-mono uppercase tracking-widest text-white/40 mb-4">Connect</h4>
          <ul className="space-y-2.5">
            <li>
              <a 
                href="https://www.linkedin.com/company/brain-white/posts/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-white/70 hover:text-white transition-colors flex items-center gap-1"
              >
                <span>LinkedIn</span>
                <ArrowUpRight className="w-3 h-3 text-white/40" />
              </a>
            </li>
            <li>
              <a 
                href="https://github.com/Brainwhitee/BRAINWHITE-PRODUCT" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-white/70 hover:text-white transition-colors flex items-center gap-1"
              >
                <span>GitHub</span>
                <ArrowUpRight className="w-3 h-3 text-white/40" />
              </a>
            </li>
            <li>
              <span className="text-white/40 italic">X.COM (Elon Seed Fund Pending)</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-mono uppercase tracking-widest text-white/40 mb-4">Legal</h4>
          <ul className="space-y-2.5">
            <li><Link href="/privacy" className="text-white/70 hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link href="/terms" className="text-white/70 hover:text-white transition-colors">Terms of Service</Link></li>
            <li><span className="text-white/40">Zero Model Training on Customer IP</span></li>
          </ul>
        </div>
      </div>

      {/* Footer Bottom Meta */}
      <div className="relative z-10 max-w-6xl mx-auto pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-white/50">
        <div className="flex items-center gap-3">
          <Image
            src="/Brainwhitelogo-transparent.png"
            alt="BrainWhite"
            width={120}
            height={32}
            className="h-5 w-auto object-contain opacity-80"
          />
          <span>© {new Date().getFullYear()} BrainWhite Inc. All rights reserved.</span>
        </div>

        <div className="flex items-center gap-2">
          <span>Engineered for mission-critical software teams</span>
        </div>
      </div>

    </footer>
  );
}
