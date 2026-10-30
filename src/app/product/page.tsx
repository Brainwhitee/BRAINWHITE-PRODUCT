import type { Metadata } from "next";
import Link from "next/link";
import { 
  Network, 
  GitPullRequest, 
  Cpu, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  FileCode2, 
  TrendingUp, 
  BarChart3, 
  ArrowRight, 
  CheckCircle2 
} from "lucide-react";
import { ExperienceFooter } from "@/components/experience/footer";

export const metadata: Metadata = {
  title: "Product — BrainWhite AI Developer Readiness Engine",
  description: "Transform complex enterprise codebases into interactive dependency graphs, personalized onboarding curricula, and real-time candidate readiness benchmarks.",
  openGraph: {
    title: "BrainWhite Product — Codebase Ingestion to Production Engineer",
    description: "Automated AST graphs, tailored learning paths, and 7-pillar Git evaluation to cut developer onboarding time by 75%.",
    url: "https://brainwhite.com/product",
    siteName: "BrainWhite",
    type: "website",
  },
};

const capabilities = [
  {
    icon: Network,
    badge: "CORE ENGINE",
    title: "Bi-Directional Codebase Knowledge Graph",
    description: "Deep AST parsing indexes your entire repository across files, symbols, modules, and import/export call hierarchies. New engineers navigate the codebase as an interactive neural map.",
    metric: "< 45s",
    metricLabel: "Average full-repo AST indexing",
  },
  {
    icon: Layers,
    badge: "AUTOMATION",
    title: "Personalized Curriculum Synthesis",
    description: "Tailored onboarding tracks synthesized automatically for junior, mid-level, and senior hires. Hands-on coding exercises, architectural handouts, and milestone assignments.",
    metric: "3 Tiers",
    metricLabel: "Role-adaptive path generation",
  },
  {
    icon: BarChart3,
    badge: "TELEMETRY",
    title: "7-Pillar Developer Assessment",
    description: "Objective evaluation based on real pull requests and commit telemetry: Code Hygiene, Architectural Consistency, Velocity, Problem Solving, Security Adherence, Domain Grasp, and Git Rigor.",
    metric: "100%",
    metricLabel: "Data-driven readiness scoring",
  },
  {
    icon: Sparkles,
    badge: "AI TUTOR",
    title: "Context-Grounded Pair Mentor",
    description: "An AI tutor grounded exclusively in your company's actual codebase symbols and architecture. No hallucinations—answers cite exact file paths and line numbers.",
    metric: "< 1.2s",
    metricLabel: "Groq & Gemini sub-second response",
  },
  {
    icon: GitPullRequest,
    badge: "GIT SYNC",
    title: "Live Pull Request Verification",
    description: "Syncs directly with GitHub webhooks. Automatically validates student pull requests against repo testing harnesses, linting rules, and architectural standards.",
    metric: "Zero",
    metricLabel: "Senior dev interruptions needed",
  },
  {
    icon: ShieldCheck,
    badge: "ENTERPRISE",
    title: "Zero-Persistence IP Security",
    description: "Ephemeral index containers run isolated from public networks. Code is never stored permanently and is never used to train foundational AI models.",
    metric: "AES-256",
    metricLabel: "Authenticated token encryption",
  },
];

const pillars = [
  { title: "Code Hygiene", desc: "Formatting, modularity, lint compliance, and idiomatic conventions." },
  { title: "Architectural Consistency", desc: "Alignment with established repo design patterns and boundaries." },
  { title: "Delivery Velocity", desc: "Time to first merged PR and iteration speed on review feedback." },
  { title: "Problem Solving", desc: "Edge-case handling, test coverage, and algorithmic efficiency." },
  { title: "Security Adherence", desc: "Zero hardcoded secrets, input sanitization, and least-privilege logic." },
  { title: "Domain Grasp", desc: "Comprehension of business logic, database models, and service boundaries." },
  { title: "Git Rigor", desc: "Atomic commit history, descriptive PR summaries, and clean branch rebasing." },
];

export default function ProductPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black">
      {/* Hero Section */}
      <section className="relative pt-32 sm:pt-40 pb-20 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto overflow-hidden">
        {/* Ambient glow backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-white/10 via-emerald-500/10 to-transparent blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-[11px] font-mono uppercase tracking-widest text-emerald-400 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            BRAINWHITE ENGINE V2 // PRODUCT OVERVIEW
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tighter leading-[0.95] mb-6">
            From Unknown Codebase to <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/40">
              Production-Ready
            </span>{" "}
            in Days
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-white/60 font-light max-w-2xl leading-relaxed mb-10">
            BrainWhite transforms complex enterprise software repositories into interactive AST knowledge graphs, role-tailored learning paths, and real-time pull request telemetry.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-3 w-full sm:w-auto bg-white text-black font-semibold text-sm px-8 py-3.5 rounded-full hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/book-demo"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto border border-white/20 bg-white/5 hover:border-white/50 text-white font-medium text-sm px-8 py-3.5 rounded-full transition-colors backdrop-blur-sm"
            >
              <span>Schedule Architecture Demo</span>
            </Link>
          </div>
        </div>

        {/* Live Architecture Visual Banner */}
        <div className="mt-16 sm:mt-24 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-4 sm:p-8 relative overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6 text-xs font-mono text-white/50">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-white/80">brainwhite-engine://graph-inspector</span>
            </div>
            <div className="hidden sm:block">STATUS: 28 MODULES INDEXED · 100% HEALTHY</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-white/10 bg-black/60 p-5">
              <div className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 mb-2">01 // INGESTION</div>
              <h4 className="text-base font-bold mb-2">AST Symbol Resolution</h4>
              <p className="text-xs text-white/60 leading-relaxed font-mono">
                Analyzes TypeScript/Python AST, resolves function signatures, classes, and constructs bidirectional import/export call edges.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/60 p-5">
              <div className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 mb-2">02 // SYNTHESIS</div>
              <h4 className="text-base font-bold mb-2">Dynamic Path Generation</h4>
              <p className="text-xs text-white/60 leading-relaxed font-mono">
                Assembles sequential learning modules with interactive handouts, codebase checkpoints, and real feature task assignments.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/60 p-5">
              <div className="text-[11px] font-mono uppercase tracking-widest text-purple-400 mb-2">03 // BENCHMARKING</div>
              <h4 className="text-base font-bold mb-2">7-Pillar Git Telemetry</h4>
              <p className="text-xs text-white/60 leading-relaxed font-mono">
                Evaluates commits, PR diffs, and test suites automatically, outputting objective readiness scores and weekly executive reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities Grid */}
      <section className="py-20 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-3">ENGINEERING ADVANTAGE</div>
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight mb-4">
            Built for Modern Engineering Teams
          </h2>
          <p className="text-sm sm:text-base text-white/60">
            Stop losing 20+ hours of senior engineering time per week per onboarding candidate.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.title}
                className="group relative rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] p-7 transition-all duration-300 hover:border-white/30 hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono tracking-widest text-white/50 border border-white/10 px-2 py-0.5 rounded-full">
                      {cap.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold mb-3 tracking-tight group-hover:text-white transition-colors">
                    {cap.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/60 leading-relaxed mb-6 font-light">
                    {cap.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between font-mono text-xs">
                  <span className="text-white/40">{cap.metricLabel}</span>
                  <span className="text-emerald-400 font-bold">{cap.metric}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7-Pillar Assessment Framework */}
      <section className="py-20 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto border-t border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <div className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-3">EVALUATION MATRIX</div>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight mb-6">
              The 7-Pillar Developer Telemetry
            </h2>
            <p className="text-sm sm:text-base text-white/60 leading-relaxed mb-8">
              Subjective gut-feeling reviews fail to identify architectural blind spots. BrainWhite measures every commit and PR across 7 quantitative engineering dimensions.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-emerald-400 transition-colors"
            >
              <span>Explore developer scorecard metrics</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pillars.map((pillar, idx) => (
              <div
                key={pillar.title}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-5 hover:border-white/30 transition-colors"
              >
                <div className="flex items-center gap-2 font-mono text-xs text-white/40 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>PILLAR 0{idx + 1}</span>
                </div>
                <h4 className="text-sm font-bold mb-1">{pillar.title}</h4>
                <p className="text-xs text-white/60 leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Conversion Banner */}
      <section className="py-20 px-4 sm:px-6 md:px-12 max-w-5xl mx-auto text-center border-t border-white/10">
        <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter mb-6">
          Ready to Accelerate Your Engineering Onboarding?
        </h2>
        <p className="text-sm sm:text-base text-white/60 max-w-xl mx-auto mb-8 font-light">
          Connect your GitHub repository in 60 seconds and experience automated codebase graph generation firsthand.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-3 w-full sm:w-auto bg-white text-black font-semibold text-sm px-8 py-3.5 rounded-full hover:scale-105 transition-transform"
          >
            <span>Create Free Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/book-demo"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto border border-white/20 hover:border-white/50 text-white font-medium text-sm px-8 py-3.5 rounded-full transition-colors"
          >
            <span>Talk with Engineering</span>
          </Link>
        </div>
      </section>

      <ExperienceFooter />
    </main>
  );
}
