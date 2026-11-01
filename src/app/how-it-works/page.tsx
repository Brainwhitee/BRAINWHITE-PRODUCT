import type { Metadata } from "next";
import Link from "next/link";
import { 
  ArrowRight, 
  CheckCircle, 
  Users, 
  Briefcase, 
  Code2 
} from "lucide-react";
import { ExperienceFooter } from "@/components/experience/footer";

export const metadata: Metadata = {
  title: "How It Works — The 5-Step Developer Onboarding Engine",
  description: "Learn how BrainWhite indexes your repositories, generates personalized learning paths, and measures candidate readiness with real GitHub PRs.",
  openGraph: {
    title: "How BrainWhite Works — Zero to Production Engineer",
    description: "The 5-step automated workflow turning company repositories into interactive curricula.",
    url: "https://brainwhite.com/how-it-works",
    siteName: "BrainWhite",
    type: "website",
  },
};

const steps = [
  {
    num: "01",
    title: "Connect Your Organization & Repositories",
    subtitle: "1-Click GitHub Integration",
    desc: "Connect your GitHub organization with read-only access. Choose repositories to index, set your team's working days, and configure custom branch triggers.",
    bullets: [
      "OAuth 2.0 or GitHub App read-only permissions",
      "Per-repository branch tracking (main, master, staging)",
      "Instant organization workspace provisioning",
    ],
  },
  {
    num: "02",
    title: "Neural Codebase Ingestion & Graphing",
    subtitle: "Automated AST Architecture Mapping",
    desc: "BrainWhite parses AST symbols across all modules, files, and functions. It builds a bi-directional dependency graph capturing how services communicate.",
    bullets: [
      "Under 60-second full AST parsing",
      "Automatic detection of entry points, services, and routes",
      "Interactive graph visualization of system architecture",
    ],
  },
  {
    num: "03",
    title: "Adaptive Learning Path Synthesis",
    subtitle: "Tailored to Candidate Seniority",
    desc: "The engine synthesizes a personalized onboarding roadmap based on the candidate's target role (Frontend, Backend, Fullstack, AI) and seniority tier.",
    bullets: [
      "Interactive architectural handouts & symbol deep-dives",
      "Step-by-step reading modules grounded in real code",
      "AI chat tutor to answer codebase questions 24/7",
    ],
  },
  {
    num: "04",
    title: "Real Milestone Tasks & Pull Requests",
    subtitle: "No Toy Exercises — Real Code Only",
    desc: "Candidates write real code on feature branches. They build features, fix seeded bugs, and submit pull requests directly to GitHub.",
    bullets: [
      "Real GitHub webhook PR event tracking",
      "Automated test suite and lint validation",
      "AI feedback on architectural adherence before human review",
    ],
  },
  {
    num: "05",
    title: "7-Pillar Telemetry & Executive Reports",
    subtitle: "Objective Readiness Benchmarks",
    desc: "Engineering managers receive real-time telemetry on candidate progress, code hygiene, and readiness scores, complete with automated weekly digests and slide decks.",
    bullets: [
      "Quantitative 7-pillar developer evaluation",
      "AI-generated weekly executive report summaries",
      "Objective signal for hiring decisions and ramp-up tracking",
    ],
  },
];

const personas = [
  {
    icon: Briefcase,
    role: "Engineering Leaders (CTO / VP Eng)",
    benefit: "Shorten engineering ramp time from 6 months to 2 weeks. Cut onboarding budget and accelerate time-to-first-production PR across new hires.",
  },
  {
    icon: Users,
    role: "Engineering Managers & Leads",
    benefit: "Eliminate 20+ hours of repetitive weekly 1-on-1 walkthroughs. Get objective telemetry and weekly reports on how candidates grasp the codebase.",
  },
  {
    icon: Code2,
    role: "Software Engineers & Candidates",
    benefit: "No more stale wikis or guessing which file does what. Learn the codebase with an interactive graph and an AI mentor grounded in company code.",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black">
      {/* Hero Section - Strict Executive Minimalism */}
      <section className="relative pt-32 sm:pt-40 pb-20 px-6 sm:px-10 md:px-16 max-w-7xl mx-auto overflow-hidden">
        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Heading - Pure Black & White, No Badges */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold uppercase tracking-tight text-white mb-6">
            How BrainWhite Takes Devs From Day One to Production
          </h1>

          {/* Subheading - Single Muted Line, No Subheading 2 */}
          <p className="text-base sm:text-lg md:text-xl text-neutral-400 font-sans max-w-2xl leading-relaxed mb-10">
            A structured, automated framework that transforms complex proprietary codebases into guided onboarding journeys without draining senior engineering resources.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-3 w-full sm:w-auto bg-white text-black font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-full hover:scale-105 transition-all shadow-lg"
            >
              <span>Get Started in 60s</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/book-demo"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto border border-white/20 bg-white/5 hover:border-white/50 text-white font-semibold text-xs uppercase tracking-wider px-8 py-4 rounded-full transition-colors backdrop-blur-sm"
            >
              <span>Book Interactive Demo</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 5-Step Process */}
      <section className="py-20 px-6 sm:px-10 md:px-16 max-w-7xl mx-auto border-t border-white/10">
        <div className="space-y-8">
          {steps.map((step) => (
            <div
              key={step.num}
              className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 sm:p-12 hover:border-white/30 transition-all grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              <div className="lg:col-span-3">
                <span className="text-5xl sm:text-7xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10">
                  {step.num}
                </span>
                <div className="text-xs font-mono uppercase tracking-widest text-neutral-400 mt-2">
                  {step.subtitle}
                </div>
              </div>

              <div className="lg:col-span-9">
                <h3 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-sm sm:text-base text-white/60 leading-relaxed font-sans mb-6 max-w-3xl">
                  {step.desc}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
                  {step.bullets.map((b) => (
                    <div key={b} className="flex items-start gap-2 text-xs font-mono text-white/80">
                      <CheckCircle className="w-4 h-4 text-white/70 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Persona Benefits Section */}
      <section className="py-20 px-6 sm:px-10 md:px-16 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-mono uppercase tracking-widest text-neutral-400 mb-2">Role-Based Impact</div>
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight mb-4">
            Engineered for Every Stakeholder
          </h2>
          <p className="text-sm sm:text-base text-white/60 font-sans">
            Delivering clarity and velocity for developers, managers, and leadership alike.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {personas.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.role}
                className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 hover:border-white/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-6">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold mb-3 tracking-tight">{p.role}</h3>
                  <p className="text-xs sm:text-sm text-white/60 leading-relaxed font-sans">
                    {p.benefit}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-6 sm:px-10 md:px-16 max-w-5xl mx-auto text-center border-t border-white/10">
        <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter mb-6">
          See Your Codebase Graph in Action
        </h2>
        <p className="text-sm sm:text-base text-white/60 max-w-xl mx-auto mb-8 font-sans font-light">
          Set up in less than 2 minutes and experience automated candidate onboarding.
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
            <span>Request Demo</span>
          </Link>
        </div>
      </section>

      <ExperienceFooter />
    </main>
  );
}
