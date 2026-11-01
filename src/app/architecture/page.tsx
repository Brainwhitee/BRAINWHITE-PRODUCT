import type { Metadata } from "next";
import Link from "next/link";
import { 
  Binary, 
  Workflow, 
  Database, 
  Zap, 
  ShieldCheck, 
  GitBranch, 
  ArrowRight, 
  Check, 
  Terminal, 
  Cpu 
} from "lucide-react";
import { ExperienceFooter } from "@/components/experience/footer";

export const metadata: Metadata = {
  title: "Architecture — BrainWhite Technical Specifications",
  description: "Deep dive into BrainWhite's AST symbol resolution, bi-directional dependency graphs, hybrid RAG embeddings, and multi-tier LLM gateway with instant failover.",
  openGraph: {
    title: "BrainWhite Engine Architecture",
    description: "Deterministic AST Graph Processing Meets Sub-Second Generative Inference.",
    url: "https://brainwhite.com/architecture",
    siteName: "BrainWhite",
    type: "website",
  },
};

const pipelineStages = [
  {
    step: "01",
    title: "Source Ingestion & POSIX Normalization",
    desc: "Traverses project repositories, filters binaries and lockfiles, and normalizes file paths across operating systems into POSIX format for deterministic lookups.",
    tags: ["POSIX Paths", "Tar Stream", "Ignore Rules"],
  },
  {
    step: "02",
    title: "Lexical & AST Symbol Extraction",
    desc: "Parses source files into Abstract Syntax Trees. Extracts exported types, functions, classes, HTTP routes, and maps entry points into discrete database symbols.",
    tags: ["TypeScript AST", "Babel Core", "Regex Fallbacks"],
  },
  {
    step: "03",
    title: "Bi-Directional Graph Assembly",
    desc: "Resolves dependency relationships between files and symbols. Populates GraphEdge entities (IMPORTS, CALLS, INHERITS) to construct a traversable knowledge web.",
    tags: ["Prisma GraphEdge", "Foreign Keys", "Topological Sort"],
  },
  {
    step: "04",
    title: "Semantic Chunking & Embedding Index",
    desc: "Splits file bodies into semantic chunks with context headers. Chunks retain symbol provenance so AI models can locate the exact line ranges for any implementation.",
    tags: ["Semantic Windows", "Symbol Anchors", "Vector Alignment"],
  },
  {
    step: "05",
    title: "Multi-Model AI Gateway & Failover",
    desc: "Routes queries across high-throughput Groq inference with automated 5000ms AbortSignal failover to Google Gemini 3.8 Flash & 2.5 Pro.",
    tags: ["Groq LPU", "Gemini 3.8 Flash", "5s Auto-Timeout"],
  },
];

const technicalSpecs = [
  { label: "AST Parsing Speed", value: "~1,200 files/min" },
  { label: "AI Gateway Latency", value: "< 850ms (Primary)" },
  { label: "Failover Threshold", value: "5,000ms circuit breaker" },
  { label: "Database Engine", value: "PostgreSQL via Supabase Pooler" },
  { label: "Token Encryption", value: "AES-256-GCM authenticated" },
  { label: "Memory Isolation", value: "Ephemeral memory containers" },
];

export default function ArchitecturePage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black">
      {/* Header */}
      <section className="relative pt-32 sm:pt-40 pb-20 px-6 sm:px-10 md:px-16 max-w-7xl mx-auto overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-white/10 via-cyan-500/10 to-transparent blur-[140px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-xs font-mono uppercase tracking-widest text-cyan-400 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Technical Architecture</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tighter leading-[0.95] mb-6">
            Deterministic Graph Processing <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/40">
              Meets Generative Reasoning
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-white/60 font-light max-w-2xl leading-relaxed mb-10">
            A deep dive into how BrainWhite indexes millions of lines of code into actionable symbol graphs, verifies student PRs, and routes inference across multi-tier LLM providers with sub-second failover.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-3 w-full sm:w-auto bg-white text-black font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-full hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            >
              <span>Explore Engine Live</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/book-demo"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto border border-white/20 bg-white/5 hover:border-white/50 text-white font-semibold text-xs uppercase tracking-wider px-8 py-4 rounded-full transition-colors backdrop-blur-sm"
            >
              <span>Book Technical Walkthrough</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Pipeline Progression */}
      <section className="py-20 px-6 sm:px-10 md:px-16 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2">Deterministic Processing</div>
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight mb-4">
            The Ingestion & Synthesis Pipeline
          </h2>
          <p className="text-sm sm:text-base text-white/60">
            From raw Git commit to an interactive curriculum in five deterministic stages.
          </p>
        </div>

        <div className="space-y-6">
          {pipelineStages.map((stage) => (
            <div
              key={stage.step}
              className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 hover:border-white/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-start gap-6">
                <span className="text-3xl sm:text-4xl font-mono font-black text-cyan-400/80">
                  {stage.step}
                </span>
                <div className="max-w-2xl">
                  <h3 className="text-lg sm:text-xl font-bold mb-2 tracking-tight">
                    {stage.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/60 leading-relaxed font-sans">
                    {stage.desc}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 md:justify-end">
                {stage.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-mono text-white/70 bg-white/5 border border-white/10 px-3 py-1 rounded-full whitespace-nowrap"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Technical Specs Matrix */}
      <section className="py-20 px-6 sm:px-10 md:px-16 max-w-7xl mx-auto border-t border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <div className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2">Runtime Benchmarks</div>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight mb-6">
              Engineered for Enterprise Scale
            </h2>
            <p className="text-sm sm:text-base text-white/60 leading-relaxed mb-6 font-sans">
              Built on PostgreSQL connection pooling, asynchronous worker queues, and hardware-accelerated Groq inference pipelines. Designed to handle monorepos with hundreds of thousands of lines of code.
            </p>
            <div className="flex items-center gap-2 font-mono text-xs text-emerald-400">
              <Check className="w-4 h-4" />
              <span>Production tested against repositories up to 500k LOC</span>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {technicalSpecs.map((spec) => (
              <div
                key={spec.label}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 hover:border-white/30 transition-colors"
              >
                <div className="text-xs font-mono text-white/40 uppercase tracking-widest mb-2">
                  {spec.label}
                </div>
                <div className="text-lg sm:text-xl font-mono font-bold text-white">
                  {spec.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Multi-Model AI Gateway Breakdown */}
      <section className="py-20 px-6 sm:px-10 md:px-16 max-w-7xl mx-auto border-t border-white/10">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 sm:p-12 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-white/10">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-purple-400 mb-1">Failover Architecture</div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight">Multi-Provider Intelligent Gateway</h3>
            </div>
            <span className="text-xs font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1.5 rounded-full w-fit">
              High Availability Architecture
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-mono text-xs">
            <div className="rounded-2xl border border-white/10 bg-black/50 p-6">
              <div className="text-emerald-400 font-bold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Primary Inference (Groq LPU)
              </div>
              <p className="text-white/60 mb-4 leading-relaxed font-sans text-sm">
                Fast conversational pair-programming and code snippet explanations. Instant response times under 900ms.
              </p>
              <div className="space-y-1.5 text-white/50 font-sans text-xs">
                <div>• High-context code reasoning & symbol lookups</div>
                <div>• Ultra-fast micro completions for interactive terminal tasks</div>
                <div>• Hardware LPU execution for sub-second latency</div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/50 p-6">
              <div className="text-cyan-400 font-bold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Secondary Inference (Google Gemini)
              </div>
              <p className="text-white/60 mb-4 leading-relaxed font-sans text-sm">
                Deep architectural analysis, multi-week progress report generation, and automated fallback if primary encounters limits.
              </p>
              <div className="space-y-1.5 text-white/50 font-sans text-xs">
                <div>• 1M+ token repository window for full repo AST context</div>
                <div>• Deep synthesis and executive cohort report generation</div>
                <div>• 5,000ms automated circuit breaker and failover trigger</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-6 sm:px-10 md:px-16 max-w-5xl mx-auto text-center border-t border-white/10">
        <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter mb-6">
          Architected for Production Teams
        </h2>
        <p className="text-sm sm:text-base text-white/60 max-w-xl mx-auto mb-8 font-sans font-light">
          Deploy BrainWhite across your engineering organization with enterprise security and seamless GitHub integration.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-3 w-full sm:w-auto bg-white text-black font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-full hover:scale-105 transition-transform"
          >
            <span>Start Free Trial</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/book-demo"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto border border-white/20 hover:border-white/50 text-white font-semibold text-xs uppercase tracking-wider px-8 py-4 rounded-full transition-colors"
          >
            <span>Schedule Demo</span>
          </Link>
        </div>
      </section>

      <ExperienceFooter />
    </main>
  );
}
