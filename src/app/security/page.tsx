import type { Metadata } from "next";
import Link from "next/link";
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  EyeOff, 
  FileCheck2, 
  Server, 
  ArrowRight, 
  CheckCircle2, 
  ShieldAlert 
} from "lucide-react";
import { ExperienceFooter } from "@/components/experience/footer";

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
    icon: EyeOff,
    badge: "ZERO RETENTION",
    title: "Ephemeral Code Indexing",
    desc: "Codebases are ingested inside ephemeral sandbox memory containers. Once the Abstract Syntax Tree symbols and dependency graph are generated, all source code checkouts are immediately destroyed.",
  },
  {
    icon: ShieldCheck,
    badge: "NO MODEL TRAINING",
    title: "Zero AI Model Training Guarantee",
    desc: "Your proprietary software code is never stored in public databases or used to train, fine-tune, or improve any foundational AI models. Strict enterprise zero-data-retention agreements apply.",
  },
  {
    icon: Lock,
    badge: "CRYPTOGRAPHY",
    title: "AES-256-GCM Authenticated Encryption",
    desc: "All GitHub OAuth tokens, access credentials, and database secrets are encrypted at rest using AES-256-GCM with unique cryptographic nonces.",
  },
  {
    icon: KeyRound,
    badge: "AUTHORIZATION",
    title: "Strict Role-Based Access Control",
    desc: "Granular separation of duties across Owner, Admin, Manager, and Candidate roles. Candidates only access their assigned learning paths and cannot inspect unauthorized repositories.",
  },
  {
    icon: Server,
    badge: "INFRASTRUCTURE",
    title: "Database Isolation & Connection Pooling",
    desc: "Hosted on enterprise PostgreSQL instances with enforced SSL TLS 1.3 transport security, strict connection timeouts, and isolated tenant org boundaries.",
  },
  {
    icon: FileCheck2,
    badge: "DEFENSE IN DEPTH",
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
    a: "Never. All AI calls route through enterprise inference agreements (Groq and Google Cloud) with zero-data-retention policies. Your code is never fed into public training datasets.",
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
    <main className="min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black">
      {/* Hero Section */}
      <section className="relative pt-32 sm:pt-40 pb-20 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-white/10 via-emerald-500/10 to-transparent blur-[140px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-[11px] font-mono uppercase tracking-widest text-emerald-400 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ENTERPRISE TRUST // ZERO-PERSISTENCE
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tighter leading-[0.95] mb-6">
            Your Intellectual Property <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/40">
              Stays Yours. Period.
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-white/60 font-light max-w-2xl leading-relaxed mb-10">
            Engineered from the ground up for security-conscious software organizations. We ingest your architecture without storing your source code or exposing your secrets.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-3 w-full sm:w-auto bg-white text-black font-semibold text-sm px-8 py-3.5 rounded-full hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            >
              <span>Create Secure Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/book-demo"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto border border-white/20 bg-white/5 hover:border-white/50 text-white font-medium text-sm px-8 py-3.5 rounded-full transition-colors backdrop-blur-sm"
            >
              <span>Schedule CISO Security Review</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Security Architecture Pillars */}
      <section className="py-20 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-3">DEFENSE ARCHITECTURE</div>
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight mb-4">
            Security at Every Layer
          </h2>
          <p className="text-sm sm:text-base text-white/60">
            How we protect your intellectual property from day one.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {securityPillars.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 hover:border-white/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono tracking-widest text-emerald-400 border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                      {p.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold mb-3 tracking-tight">{p.title}</h3>
                  <p className="text-xs sm:text-sm text-white/60 leading-relaxed font-light">
                    {p.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Security FAQ */}
      <section className="py-20 px-4 sm:px-6 md:px-12 max-w-4xl mx-auto border-t border-white/10">
        <div className="text-center mb-16">
          <div className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-3">COMMON QUESTIONS</div>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight mb-4">
            Security & Privacy FAQs
          </h2>
        </div>

        <div className="space-y-6">
          {faqs.map((faq) => (
            <div
              key={faq.q}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-6 hover:border-white/20 transition-colors"
            >
              <h4 className="text-base font-bold mb-3 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{faq.q}</span>
              </h4>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed font-light pl-8">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-4 sm:px-6 md:px-12 max-w-5xl mx-auto text-center border-t border-white/10">
        <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter mb-6">
          Enterprise Security Without Compromise
        </h2>
        <p className="text-sm sm:text-base text-white/60 max-w-xl mx-auto mb-8 font-light">
          Request our complete SOC 2 report, pen test summaries, and architecture whitepaper.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/book-demo"
            className="inline-flex items-center justify-center gap-3 w-full sm:w-auto bg-white text-black font-semibold text-sm px-8 py-3.5 rounded-full hover:scale-105 transition-transform"
          >
            <span>Request Security Review</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="mailto:security@brainwhite.com"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto border border-white/20 hover:border-white/50 text-white font-medium text-sm px-8 py-3.5 rounded-full transition-colors"
          >
            <span>security@brainwhite.com</span>
          </a>
        </div>
      </section>

      <ExperienceFooter />
    </main>
  );
}
