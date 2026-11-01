import type { Metadata } from "next";
import Link from "next/link";
import { 
  ArrowRight, 
  Check
} from "lucide-react";
import { ExperienceFooter } from "@/components/experience/footer";
import { SonarGrid } from "@/components/ui/sonar-grid";

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
    desc: "Routes queries across high-throughput inference engines with automated 5,000ms AbortSignal failover to secondary reasoning models.",
    tags: ["High-Throughput Inference", "Auto-Failover Circuit", "Deterministic Routing"],
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
    <main className="min-h-screen bg-white text-neutral-900 selection:bg-neutral-900 selection:text-white">
      {/* Header - Solid White with Sonar Grid Background */}
      <section className="relative pt-32 sm:pt-40 pb-20 px-6 sm:px-10 md:px-16 max-w-7xl mx-auto overflow-hidden">
        {/* Sonar Grid Interactive Canvas Background */}
        <SonarGrid className="absolute inset-0 z-0" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Heading - Pure Black & White, No Badges */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold uppercase tracking-tight text-neutral-950 mb-6">
            Deterministic Graph Processing Meets Generative Reasoning
          </h1>

          {/* Subheading - Single Clean Line, No Subheading 2 */}
          <p className="text-base sm:text-lg md:text-xl text-neutral-600 font-sans max-w-2xl leading-relaxed mb-10">
            A deep dive into how BrainWhite indexes millions of lines of code into actionable symbol graphs, verifies candidate PRs, and routes inference with automated sub-second failover.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-3 w-full sm:w-auto bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-full transition-all shadow-sm"
            >
              <span>Explore Engine Live</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/book-demo"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto border border-neutral-300 hover:border-neutral-900 bg-white text-neutral-900 font-semibold text-xs uppercase tracking-wider px-8 py-4 rounded-full transition-colors"
            >
              <span>Book Technical Walkthrough</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Pipeline Progression */}
      <section className="py-20 px-6 sm:px-10 md:px-16 max-w-7xl mx-auto border-t border-neutral-200">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-2 font-medium">Deterministic Processing</div>
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-neutral-950 mb-4">
            The Ingestion &amp; Synthesis Pipeline
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 font-sans">
            From raw Git commit to an interactive curriculum in five deterministic stages.
          </p>
        </div>

        <div className="space-y-6">
          {pipelineStages.map((stage) => (
            <div
              key={stage.step}
              className="rounded-3xl border border-neutral-200 bg-neutral-50/50 p-6 sm:p-8 hover:border-neutral-400 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-start gap-6">
                <span className="text-3xl sm:text-4xl font-mono font-black text-neutral-400">
                  {stage.step}
                </span>
                <div className="max-w-2xl">
                  <h3 className="text-lg sm:text-xl font-bold mb-2 tracking-tight text-neutral-950">
                    {stage.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-sans">
                    {stage.desc}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 md:justify-end">
                {stage.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-mono text-neutral-700 bg-white border border-neutral-200 px-3 py-1 rounded-full whitespace-nowrap shadow-2xs"
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
      <section className="py-20 px-6 sm:px-10 md:px-16 max-w-7xl mx-auto border-t border-neutral-200">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <div className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-2 font-medium">Runtime Benchmarks</div>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-neutral-950 mb-6">
              Engineered for Enterprise Scale
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed mb-6 font-sans">
              Built on PostgreSQL connection pooling, asynchronous worker queues, and hardware-accelerated high-throughput inference pipelines. Designed to handle monorepos with hundreds of thousands of lines of code.
            </p>
            <div className="flex items-center gap-2 font-mono text-xs text-neutral-800">
              <Check className="w-4 h-4 text-neutral-900" />
              <span>Production tested against repositories up to 500k LOC</span>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {technicalSpecs.map((spec) => (
              <div
                key={spec.label}
                className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs hover:border-neutral-400 transition-colors"
              >
                <div className="text-xs font-mono text-neutral-400 uppercase tracking-widest mb-2 font-medium">
                  {spec.label}
                </div>
                <div className="text-lg sm:text-xl font-mono font-bold text-neutral-950">
                  {spec.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Intelligent AI Gateway Breakdown */}
      <section className="py-20 px-6 sm:px-10 md:px-16 max-w-7xl mx-auto border-t border-neutral-200">
        <div className="rounded-3xl border border-neutral-200 bg-neutral-50/60 p-8 sm:p-12 shadow-xs relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-neutral-200">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-1 font-medium">Failover Architecture</div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-950">Multi-Provider Intelligent Gateway</h3>
            </div>
            <span className="text-xs font-mono bg-white text-neutral-800 border border-neutral-200 px-3 py-1.5 rounded-full w-fit shadow-2xs">
              High Availability Architecture
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-mono text-xs">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
              <div className="text-neutral-950 font-bold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-neutral-950" />
                Primary High-Throughput Engine
              </div>
              <p className="text-neutral-600 mb-4 leading-relaxed font-sans text-sm">
                Fast conversational pair-programming and code snippet explanations. Instant response times under 900ms.
              </p>
              <div className="space-y-1.5 text-neutral-500 font-sans text-xs">
                <div>• High-context code reasoning &amp; symbol lookups</div>
                <div>• Ultra-fast micro completions for interactive terminal tasks</div>
                <div>• Hardware-accelerated execution for sub-second latency</div>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
              <div className="text-neutral-950 font-bold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-neutral-600" />
                Deep Synthesis Reasoning Engine
              </div>
              <p className="text-neutral-600 mb-4 leading-relaxed font-sans text-sm">
                Deep architectural analysis, multi-week progress report generation, and automated fallback if primary encounters limits.
              </p>
              <div className="space-y-1.5 text-neutral-500 font-sans text-xs">
                <div>• 1M+ token repository window for full repo AST context</div>
                <div>• Deep synthesis and executive cohort report generation</div>
                <div>• 5,000ms automated circuit breaker and failover trigger</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-6 sm:px-10 md:px-16 max-w-5xl mx-auto text-center border-t border-neutral-200">
        <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-neutral-950 mb-6">
          Architected for Production Teams
        </h2>
        <p className="text-sm sm:text-base text-neutral-600 max-w-xl mx-auto mb-8 font-sans font-light">
          Deploy BrainWhite across your engineering organization with enterprise security and seamless GitHub integration.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-3 w-full sm:w-auto bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-full transition-transform shadow-sm"
          >
            <span>Start Free Trial</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/book-demo"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto border border-neutral-300 hover:border-neutral-900 bg-white text-neutral-900 font-semibold text-xs uppercase tracking-wider px-8 py-4 rounded-full transition-colors"
          >
            <span>Schedule Demo</span>
          </Link>
        </div>
      </section>

      <ExperienceFooter 
        preset="paper" 
        palette={{ background: "#ffffff", ink: "#0a0a0a", accent: "#0a0a0a" }} 
      />
    </main>
  );
}
