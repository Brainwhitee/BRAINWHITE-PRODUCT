import type { Metadata } from "next";
import Link from "next/link";
import { 
  Network, 
  GitPullRequest, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  BarChart3, 
  ArrowRight, 
  Check,
  CheckCircle2,
  GitBranch,
  Terminal,
  Cpu
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
    badge: "Core Engine",
    title: "AST Knowledge Graph",
    description: "Deep AST parsing indexes your entire repository across files, symbols, modules, and import/export call hierarchies. New engineers navigate the codebase as an interactive map.",
    metric: "< 45s",
    metricLabel: "Average full-repo AST indexing",
  },
  {
    icon: Layers,
    badge: "Automated Synthesis",
    title: "Personalized Curriculum",
    description: "Tailored onboarding tracks synthesized automatically for junior, mid-level, and senior hires. Hands-on coding exercises, architectural handouts, and milestone assignments.",
    metric: "3 Tiers",
    metricLabel: "Role-adaptive path generation",
  },
  {
    icon: BarChart3,
    badge: "Telemetry",
    title: "7-Pillar Git Assessment",
    description: "Objective evaluation based on real pull requests and commit telemetry: Code Hygiene, Architectural Consistency, Velocity, Problem Solving, Security Adherence, Domain Grasp, and Git Rigor.",
    metric: "100%",
    metricLabel: "Data-driven readiness scoring",
  },
  {
    icon: Sparkles,
    badge: "AI Tutor",
    title: "Context-Grounded Pair Mentor",
    description: "An AI tutor grounded exclusively in your company's actual codebase symbols and architecture. No hallucinations—answers cite exact file paths and line numbers.",
    metric: "< 1.2s",
    metricLabel: "Sub-second inference response",
  },
  {
    icon: GitPullRequest,
    badge: "Git Sync",
    title: "Live PR Verification",
    description: "Syncs directly with GitHub webhooks. Automatically validates student pull requests against repo testing harnesses, linting rules, and architectural standards.",
    metric: "Zero",
    metricLabel: "Senior dev interruptions needed",
  },
  {
    icon: ShieldCheck,
    badge: "Enterprise",
    title: "Zero-Persistence Security",
    description: "Ephemeral index containers run isolated from public networks. Code is never stored permanently and is never used to train foundational AI models.",
    metric: "AES-256",
    metricLabel: "Authenticated token encryption",
  },
];

const pipelineStages = [
  {
    id: "01",
    title: "Codebase Ingestion",
    tag: "Native GitHub App",
    desc: "1-Click multi-tenant GitHub connection. Clones private tarballs into isolated, ephemeral memory containers.",
    icon: GitBranch,
  },
  {
    id: "02",
    title: "AST Graph Synthesis",
    tag: "Tree-Sitter Parser",
    desc: "Resolves function signatures, classes, modules, and bidirectional imports into an interactive knowledge topology.",
    icon: Cpu,
  },
  {
    id: "03",
    title: "Adaptive Learning Quests",
    tag: "Role-Tailored Track",
    desc: "Generates hands-on coding checkpoints and architectural handouts directly from your repo's live modules.",
    icon: Terminal,
  },
  {
    id: "04",
    title: "Production Readiness",
    tag: "7-Pillar Telemetry",
    desc: "Scores PR quality, conflict resolution, and iteration speed automatically before granting production access.",
    icon: CheckCircle2,
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
      
      {/* 1. HERO SECTION - STRICT EXECUTIVE MINIMALISM */}
      <section className="relative pt-32 sm:pt-40 pb-20 px-6 sm:px-10 md:px-16 max-w-7xl mx-auto overflow-hidden">
        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Heading - Black & White, No Badges */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold uppercase tracking-tight text-white mb-6">
            From Unknown Codebase to Production-Ready in Days
          </h1>

          {/* Subheading - Single Muted Neutral, No Subheading 2 */}
          <p className="text-base sm:text-lg md:text-xl text-neutral-400 font-sans max-w-2xl leading-relaxed mb-10">
            BrainWhite transforms complex enterprise software repositories into interactive AST knowledge graphs, role-tailored learning paths, and real-time pull request telemetry.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-3 w-full sm:w-auto bg-white text-black font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-full hover:scale-105 transition-all shadow-lg"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/book-demo"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto border border-white/20 bg-white/5 hover:border-white/50 text-white font-semibold text-xs uppercase tracking-wider px-8 py-4 rounded-full transition-colors backdrop-blur-sm"
            >
              <span>Schedule Architecture Demo</span>
            </Link>
          </div>
        </div>

        {/* 2. DEPLOY PIPELINE COMPONENT */}
        <div className="mt-20 rounded-3xl border border-white/10 bg-neutral-950/80 p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-8">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-neutral-400">
                End-to-End Onboarding Pipeline
              </div>
              <p className="text-xs text-white/60 mt-1">
                Automated continuous workflow running from initial repository connection to verified production contribution.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-white/70 self-start sm:self-auto">
              <span>Realtime Pipeline Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {pipelineStages.map((stage) => {
              const Icon = stage.icon;
              return (
                <div 
                  key={stage.id}
                  className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/30 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xs font-mono text-white/30">{stage.id}</span>
                    </div>

                    <div className="inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-white/5 text-white/70 mb-2 border border-white/10">
                      {stage.tag}
                    </div>

                    <h4 className="text-base font-bold text-white mb-2 tracking-tight">
                      {stage.title}
                    </h4>

                    <p className="text-xs text-white/60 leading-relaxed font-sans">
                      {stage.desc}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-white/5 flex items-center gap-2 text-[11px] font-mono text-neutral-300">
                    <Check className="w-3.5 h-3.5" />
                    <span>Automated Stage</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. DUAL-TONE CONTRAST SECTION */}
      <section className="w-full bg-white text-slate-900 py-24 sm:py-32 px-6 sm:px-10 md:px-16 transition-colors duration-500">
        <div className="max-w-7xl mx-auto">
          
          <div className="max-w-3xl mx-auto text-center mb-16 sm:mb-20">
            <span className="text-xs font-mono uppercase tracking-widest text-neutral-500 font-bold block mb-2">
              Engineering Advantage
            </span>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-slate-950 mb-4">
              Built for Modern Software Organizations
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-sans">
              Stop losing 20+ hours of senior engineering time per week per new hire. Provide structured, self-directed ramp-up backed by automated assessment.
            </p>
          </div>

          {/* Interactive Values Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {capabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <div
                  key={cap.title}
                  className="group rounded-3xl border border-slate-200/90 bg-slate-50/60 p-7 hover:border-black hover:bg-white transition-all duration-300 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 shadow-xs group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full font-semibold">
                        {cap.badge}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-950 tracking-tight mb-2 group-hover:text-black">
                      {cap.title}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed font-sans mb-6">
                      {cap.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-200/70 flex items-center justify-between">
                    <div>
                      <div className="text-lg font-black font-mono text-slate-950">
                        {cap.metric}
                      </div>
                      <div className="text-[11px] font-medium text-slate-500">
                        {cap.metricLabel}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 4. 7-PILLARS OF READINESS ASSESSMENT */}
      <section className="py-24 sm:py-32 px-6 sm:px-10 md:px-16 max-w-7xl mx-auto border-t border-white/10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-neutral-400 block mb-2">
            Verifiable Engineering Telemetry
          </span>
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white mb-4">
            Seven Pillars of Candidate Evaluation
          </h2>
          <p className="text-sm sm:text-base text-white/60 font-sans">
            Evaluated continuously across real Git commits, test coverage, PR turnaround, and architectural discipline.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pillars.map((p, idx) => (
            <div 
              key={p.title} 
              className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/30 transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-mono text-white/40 block mb-2">Pillar 0{idx + 1}</span>
                <h4 className="text-sm font-bold text-white mb-1.5">{p.title}</h4>
                <p className="text-xs text-white/60 leading-relaxed font-sans">{p.desc}</p>
              </div>
              <div className="pt-4 mt-4 border-t border-white/5 flex items-center gap-1.5 text-[10px] font-mono text-neutral-300">
                <Check className="w-3 h-3" />
                <span>Audited Automatically</span>
              </div>
            </div>
          ))}

          {/* Call to action card */}
          <div className="p-5 rounded-2xl bg-white text-black flex flex-col justify-between shadow-xl">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block mb-2">
                Deploy Now
              </span>
              <h4 className="text-base font-black uppercase tracking-tight leading-tight mb-2">
                Ready to cut onboarding ramp time by 75%?
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed font-sans">
                Connect your organization&apos;s repository and launch your first cohort in under 10 minutes.
              </p>
            </div>
            <Link 
              href="/signup" 
              className="mt-4 inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-black text-white font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 transition-colors"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <ExperienceFooter />

    </main>
  );
}
