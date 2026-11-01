import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ExperienceFooter } from "@/components/experience/footer";
import { SonarGrid } from "@/components/ui/sonar-grid";
import { GradientCard } from "@/components/ui/gradient-card";

export const metadata: Metadata = {
  title: "Security & Compliance — Enterprise Code Protection",
  description: "Explore BrainWhite's security architecture: zero persistent code storage, AES-256-GCM encryption, strict RBAC, and SOC2/GDPR alignment.",
  openGraph: {
    title: "BrainWhite Security — Enterprise Code Protection",
    description: "Your Intellectual Property Stays Yours. Zero persistent storage and zero AI model training.",
    url: "https://brainwhite.com/security",
    siteName: "BrainWhite",
    type: "website",
  },
};

const securityPillars = [
  {
    iconName: "eye",
    title: "Ephemeral Code Indexing",
    desc: "Codebases are ingested inside ephemeral sandbox memory containers. Once the Abstract Syntax Tree symbols and dependency graph are generated, all source code checkouts are immediately destroyed.",
  },
  {
    iconName: "shield",
    title: "Zero Model Training Guarantee",
    desc: "Your proprietary software code is never stored in public databases or used to train, fine-tune, or improve any foundational AI models. Strict enterprise zero-data-retention agreements apply.",
  },
  {
    iconName: "lock",
    title: "AES-256-GCM Authenticated Encryption",
    desc: "All GitHub OAuth tokens, access credentials, and database secrets are encrypted at rest using AES-256-GCM with unique cryptographic nonces.",
  },
  {
    iconName: "key",
    title: "Strict Role-Based Access Control",
    desc: "Granular separation of duties across Owner, Admin, Manager, and Candidate roles. Candidates only access their assigned learning paths and cannot inspect unauthorized repositories.",
  },
  {
    iconName: "server",
    title: "Database Isolation & Connection Pooling",
    desc: "Hosted on enterprise PostgreSQL instances with enforced SSL TLS 1.3 transport security, strict connection timeouts, and isolated tenant org boundaries.",
  },
  {
    iconName: "filecheck",
    title: "Rate Limiting & Brute-Force Lockout",
    desc: "Database-backed rate limiting protects authentication endpoints against credential stuffing and brute-force attacks (5 failed attempts trigger a 15-minute lockout).",
  },
];

const faqs = [
  {
    q: "Does BrainWhite store our proprietary source code?",
    a: "No. BrainWhite only retains extracted metadata: AST symbol signatures (e.g. function names, exported interfaces), dependency graph edges, and file paths. Raw file contents are processed ephemerally and discarded.",
  },
  {
    q: "Are my repositories used to train AI models?",
    a: "Never. All AI calls route through enterprise inference agreements with zero-data-retention policies. Your code is never fed into public training datasets.",
  },
  {
    q: "What permissions does the GitHub integration require?",
    a: "BrainWhite only requires read-only repository contents and metadata permissions. We never request write access to your production branches, code pushes, or organization settings.",
  },
  {
    q: "How does BrainWhite comply with SOC2 and GDPR?",
    a: "We maintain end-to-end data encryption in transit (TLS 1.3) and at rest (AES-256), continuous vulnerability scanning, automated audit logs, and support full data erasure upon request.",
  },
];

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-white text-neutral-900 selection:bg-neutral-900 selection:text-white">
      {/* Hero Section - Solid White with Strict Executive Minimalism & Sonar Grid */}
      <section className="relative pt-32 sm:pt-40 pb-20 px-6 sm:px-10 md:px-16 max-w-7xl mx-auto overflow-hidden">
        {/* Interactive Sonar Grid Canvas Background */}
        <SonarGrid className="absolute inset-0 z-0" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Heading - Pure Black & White, No Badges */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold uppercase tracking-tight text-neutral-950 mb-6">
            Your Intellectual Property Stays Yours
          </h1>

          {/* Subheading - Single Clean Line, No Subheading 2 */}
          <p className="text-base sm:text-lg md:text-xl text-neutral-600 font-sans max-w-2xl leading-relaxed mb-10">
            Engineered from the ground up with an ephemeral analysis architecture: zero persistent code storage, cryptographic token encryption, and zero AI model training.
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
              <span>Request Security Whitepaper</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 6 Security Pillars Grid - Replaced with GradientCards without micro badges */}
      <section className="py-24 sm:py-32 px-6 sm:px-10 md:px-16 max-w-7xl mx-auto border-t border-neutral-200">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-neutral-500 block mb-2 font-medium">
            Enterprise Protection
          </span>
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-neutral-950 mb-4">
            Six Guarantees for Enterprise Code
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 font-sans">
            How we protect proprietary algorithms and enterprise assets at every layer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {securityPillars.map((p, idx) => (
            <GradientCard
              key={p.title}
              iconName={p.iconName}
              title={p.title}
              description={p.desc}
              gradient={idx % 2 === 0 ? "mesh" : "subtle-slate"}
            />
          ))}
        </div>
      </section>

      {/* Security FAQs */}
      <section className="py-24 sm:py-32 px-6 sm:px-10 md:px-16 max-w-5xl mx-auto border-t border-neutral-200">
        <div className="text-center mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-neutral-500 block mb-2 font-medium">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-neutral-950 mb-4">
            Security Questions Answered
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {faqs.map((faq, i) => (
            <div key={i} className="p-8 rounded-3xl border border-neutral-200 bg-neutral-50/60 shadow-xs hover:border-neutral-900 transition-colors">
              <h3 className="text-base font-bold text-neutral-950 mb-3">{faq.q}</h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-sans font-light">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-6 sm:px-10 md:px-16 max-w-5xl mx-auto text-center border-t border-neutral-200">
        <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-neutral-950 mb-6">
          Ready for Enterprise Deployment
        </h2>
        <p className="text-sm sm:text-base text-neutral-600 max-w-xl mx-auto mb-8 font-sans font-light">
          Request custom VPC isolation, dedicated PostgreSQL tenancy, or a security audit call with our engineering team.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/book-demo"
            className="inline-flex items-center justify-center gap-3 w-full sm:w-auto bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-full transition-transform shadow-sm"
          >
            <span>Book Security Review</span>
            <ArrowRight className="w-4 h-4" />
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
