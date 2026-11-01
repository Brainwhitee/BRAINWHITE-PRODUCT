"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Terminal, 
  Cpu, 
  Send, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  ArrowLeft,
  Activity,
  Layers,
  ArrowRight
} from "lucide-react";
import { ExperienceFooter } from "@/components/experience/footer";

export default function BookDemoPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    teamSize: "10-50",
    repoUrl: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate telemetry submission & feedback
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black">
      {/* Top Navigation */}
      <div className="fixed top-6 left-6 z-50">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/80 hover:bg-white hover:text-black backdrop-blur-md px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all shadow-lg hover:scale-105"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      <section className="relative pt-32 sm:pt-40 pb-24 px-6 sm:px-10 md:px-16 max-w-6xl mx-auto overflow-hidden">
        {/* Ambient backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-cyan-500/10 via-emerald-500/10 to-transparent blur-[140px] rounded-full pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Context & Architectural Guarantees */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-xs font-mono uppercase tracking-widest text-emerald-400 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Architecture Walkthrough</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-tight">
                Schedule a Private Codebase Ingestion Demo
              </h1>
              <p className="mt-4 text-sm sm:text-base text-white/60 leading-relaxed font-sans font-light">
                See BrainWhite construct an AST graph, synthesize personalized onboarding paths, and test PR telemetry on real production repositories.
              </p>
            </div>

            {/* Cloud Watch Telemetry Status Monitor */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs font-mono">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Activity className="w-4 h-4" />
                  <span>DEMO GATEWAY TELEMETRY</span>
                </div>
                <span className="text-white/40">ONLINE</span>
              </div>

              <div className="space-y-2.5 text-xs font-mono text-white/70">
                <div className="flex items-center justify-between">
                  <span>Engine Version:</span>
                  <span className="text-white">v2.0 AST Engine</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Inference Latency:</span>
                  <span className="text-emerald-400">&lt; 850ms Groq LPU</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>IP Retention:</span>
                  <span className="text-white">0% Ephemeral Memory</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>GitHub App:</span>
                  <span className="text-cyan-400">1-Click Multi-Tenant</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs text-white/60 font-sans">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Strict mutual NDA and zero model training on customer IP</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Live AST parser walkthrough tailored to your tech stack</span>
              </div>
            </div>
          </div>

          {/* Right Column: Cloud Watch Style Terminal Form (21st.dev reference) */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-white/15 bg-neutral-950 p-7 sm:p-10 shadow-2xl relative overflow-hidden">
              
              {submitted ? (
                <div className="py-12 text-center space-y-5">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">
                    Demo Request Scheduled
                  </h3>
                  <p className="text-sm text-white/70 max-w-md mx-auto leading-relaxed font-sans">
                    Our solutions engineering team will reach out to <strong className="text-white">{formData.email}</strong> within 4 business hours to confirm your private architecture session.
                  </p>
                  <div className="pt-4">
                    <Link
                      href="/"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-neutral-200 transition-colors"
                    >
                      <span>Return to Home</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-2">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-mono uppercase tracking-widest text-white/80">
                        Cloud Watch Form // Demo Dispatch
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-white/40">TLS 1.3 ENCRYPTED</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-white/60 mb-1.5">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Alex Rivera"
                        className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-xs text-white placeholder-white/30 focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-white/60 mb-1.5">
                        Work Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="alex@company.com"
                        className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-xs text-white placeholder-white/30 focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-white/60 mb-1.5">
                        Organization Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="e.g. Stripe, Linear"
                        className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-xs text-white placeholder-white/30 focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-white/60 mb-1.5">
                        Engineering Team Size
                      </label>
                      <select
                        value={formData.teamSize}
                        onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                        className="w-full bg-neutral-900 border border-white/15 rounded-xl px-4 py-3 text-xs text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-colors"
                      >
                        <option value="1-10">1 - 10 engineers</option>
                        <option value="10-50">10 - 50 engineers</option>
                        <option value="50-250">50 - 250 engineers</option>
                        <option value="250+">250+ enterprise developers</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-white/60 mb-1.5">
                      GitHub Org or Primary Repo (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.repoUrl}
                      onChange={(e) => setFormData({ ...formData, repoUrl: e.target.value })}
                      placeholder="e.g. github.com/organization/core-platform"
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-xs text-white placeholder-white/30 focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-white/60 mb-1.5">
                      Current Onboarding Challenges / Questions
                    </label>
                    <textarea
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="e.g. We have a TypeScript + Python monorepo and freshers take 4 months to understand architecture..."
                      className="w-full bg-white/5 border border-white/15 rounded-xl p-4 text-xs text-white placeholder-white/30 focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 px-6 rounded-2xl bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 shadow-xl cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Synthesizing Telemetry...</span>
                    ) : (
                      <>
                        <span>Submit Architecture Request</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}

            </div>
          </div>

        </div>
      </section>

      <ExperienceFooter />
    </main>
  );
}
