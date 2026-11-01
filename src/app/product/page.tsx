import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { ExperienceFooter } from "@/components/experience/footer";
import { SonarGrid } from "@/components/ui/sonar-grid";
import { Icon3DHoverCard } from "@/components/ui/icon-3d-hover";
import { GradientCard } from "@/components/ui/gradient-card";

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
    iconName: "network",
    title: "AST Knowledge Graph",
    description: "Deep AST parsing indexes your entire repository across files, symbols, modules, and import/export call hierarchies. New engineers navigate the codebase as an interactive map.",
    metric: "< 45s",
    metricLabel: "Average full-repo AST indexing",
  },
  {
    iconName: "layers",
    title: "Personalized Curriculum",
    description: "Tailored onboarding tracks synthesized automatically for junior, mid-level, and senior hires. Hands-on coding exercises, architectural handouts, and milestone assignments.",
    metric: "3 Tiers",
    metricLabel: "Role-adaptive path generation",
  },
  {
    iconName: "barchart",
    title: "7-Pillar Git Assessment",
    description: "Objective evaluation based on real pull requests and commit telemetry: Code Hygiene, Architectural Consistency, Velocity, Problem Solving, Security Adherence, Domain Grasp, and Git Rigor.",
    metric: "100%",
    metricLabel: "Data-driven readiness scoring",
  },
  {
    iconName: "sparkles",
    title: "Context-Grounded Pair Mentor",
    description: "An AI tutor grounded exclusively in your company's actual codebase symbols and architecture. No hallucinations—answers cite exact file paths and line numbers.",
    metric: "< 1.2s",
    metricLabel: "Sub-second inference response",
  },
  {
    iconName: "gitpr",
    title: "Live PR Verification",
    description: "Syncs directly with GitHub webhooks. Automatically validates student pull requests against repo testing harnesses, linting rules, and architectural standards.",
    metric: "Zero",
    metricLabel: "Senior dev interruptions needed",
  },
  {
    iconName: "shield",
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
    desc: "1-Click multi-tenant GitHub connection. Ephemeral memory containers parse and index raw repository structures into AST trees.",
    iconName: "branch",
  },
  {
    id: "02",
    title: "AST Graph Synthesis",
    desc: "Resolves function signatures, classes, modules, and bidirectional imports into an interactive knowledge topology.",
    iconName: "cpu",
  },
  {
    id: "03",
    title: "Adaptive Learning Quests",
    desc: "Generates hands-on coding checkpoints and architectural handouts directly from your repo's live modules.",
    iconName: "terminal",
  },
  {
    id: "04",
    title: "Production Readiness",
    desc: "Scores PR quality, conflict resolution, and iteration speed automatically before granting production access.",
    iconName: "check",
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
    <main className="min-h-screen bg-white text-neutral-900 selection:bg-neutral-900 selection:text-white">
      
      {/* 1. HERO SECTION - SOLID WHITE WITH SONAR GRID BACKGROUND */}
      <section className="relative pt-32 sm:pt-40 pb-20 px-6 sm:px-10 md:px-16 max-w-7xl mx-auto overflow-hidden">
        {/* Interactive Sonar Grid Canvas */}
        <SonarGrid className="absolute inset-0 z-0" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Heading - Pure Black & White, No Badges */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold uppercase tracking-tight text-neutral-950 mb-6">
            From Unknown Codebase to Production-Ready in Days
          </h1>

          {/* Subheading - Single Muted Neutral, No Subheading 2 */}
          <p className="text-base sm:text-lg md:text-xl text-neutral-600 font-sans max-w-2xl leading-relaxed mb-10">
            BrainWhite transforms complex enterprise software repositories into interactive AST knowledge graphs, role-tailored learning paths, and real-time pull request telemetry.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-3 w-full sm:w-auto bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-full transition-all shadow-sm"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/book-demo"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto border border-neutral-300 hover:border-neutral-900 bg-white text-neutral-900 font-semibold text-xs uppercase tracking-wider px-8 py-4 rounded-full transition-colors"
            >
              <span>Schedule Architecture Demo</span>
            </Link>
          </div>
        </div>

        {/* 2. DEPLOY PIPELINE COMPONENT - 3D ICON HOVER INTERACTIVE CARDS */}
        <div className="mt-20 rounded-3xl border border-neutral-200 bg-neutral-50/60 p-6 sm:p-10 shadow-xs relative z-10 overflow-hidden">
          <div className="mb-8">
            <div className="text-xs font-mono uppercase tracking-widest text-neutral-500 font-medium">
              End-to-End Onboarding Pipeline
            </div>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-2xl font-sans">
              Automated continuous workflow running from initial repository connection to verified production contribution.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {pipelineStages.map((stage) => (
              <Icon3DHoverCard
                key={stage.id}
                iconName={stage.iconName}
                stepNumber={stage.id}
                title={stage.title}
                description={stage.desc}
                footerText="Automated Stage"
              />
            ))}
          </div>
        </div>
      </section>

      {/* 3. CAPABILITIES VALUES GRID - GRADIENT CARDS */}
      <section className="w-full bg-white py-24 sm:py-32 px-6 sm:px-10 md:px-16 border-t border-neutral-200">
        <div className="max-w-7xl mx-auto">
          
          <div className="max-w-3xl mx-auto text-center mb-16 sm:mb-20">
            <span className="text-xs font-mono uppercase tracking-widest text-neutral-500 font-bold block mb-2">
              Engineering Advantage
            </span>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-neutral-950 mb-4">
              Built for Modern Software Organizations
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed font-sans">
              Stop losing 20+ hours of senior engineering time per week per new hire. Provide structured, self-directed ramp-up backed by automated assessment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {capabilities.map((cap, idx) => (
              <GradientCard
                key={cap.title}
                iconName={cap.iconName}
                title={cap.title}
                description={cap.description}
                metric={cap.metric}
                metricLabel={cap.metricLabel}
                gradient={idx % 2 === 0 ? "mesh" : "subtle-slate"}
              />
            ))}
          </div>

        </div>
      </section>

      {/* 4. 7-PILLARS OF READINESS ASSESSMENT */}
      <section className="py-24 sm:py-32 px-6 sm:px-10 md:px-16 max-w-7xl mx-auto border-t border-neutral-200">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-neutral-500 block mb-2">
            Verifiable Engineering Telemetry
          </span>
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-neutral-950 mb-4">
            Seven Pillars of Candidate Evaluation
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 font-sans">
            Evaluated continuously across real Git commits, test coverage, PR turnaround, and architectural discipline.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pillars.map((p, idx) => (
            <div 
              key={p.title} 
              className="p-6 rounded-2xl bg-white border border-neutral-200 hover:border-neutral-900 transition-all flex flex-col justify-between shadow-xs group"
            >
              <div>
                <span className="text-xs font-mono text-neutral-400 block mb-2 font-medium">0{idx + 1}</span>
                <h4 className="text-base font-bold text-neutral-950 mb-2">{p.title}</h4>
                <p className="text-xs text-neutral-600 leading-relaxed font-sans font-light">{p.desc}</p>
              </div>
              <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center justify-between text-xs font-mono text-neutral-700">
                <span>Audited Automatically</span>
                <Check className="w-3.5 h-3.5 text-neutral-900" />
              </div>
            </div>
          ))}

          {/* Call to action card */}
          <div className="p-6 rounded-2xl bg-neutral-950 text-white flex flex-col justify-between shadow-lg">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-neutral-400 block mb-2">
                Deploy Now
              </span>
              <h4 className="text-base font-black uppercase tracking-tight leading-tight mb-2">
                Ready to cut onboarding ramp time by 75%?
              </h4>
              <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                Connect your organization&apos;s repository and launch your first cohort in under 10 minutes.
              </p>
            </div>
            <Link 
              href="/signup" 
              className="mt-4 inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white text-neutral-950 font-bold text-xs uppercase tracking-wider hover:bg-neutral-200 transition-colors"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <ExperienceFooter 
        preset="paper" 
        palette={{ background: "#ffffff", ink: "#0a0a0a", accent: "#0a0a0a" }} 
      />

    </main>
  );
}
