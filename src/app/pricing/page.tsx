import type { Metadata } from "next";
import Link from "next/link";
import { Check, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";
import { ExperienceFooter } from "@/components/experience/footer";
import { PricingSection } from "@/components/pricing/pricing-section";

export const metadata: Metadata = {
  title: "Pricing — Transparent Plans for Modern Engineering Teams",
  description: "Invest in developer onboarding velocity. Reduce time-to-first-PR by 75% with automated codebase knowledge graphs and 7-pillar telemetry.",
  openGraph: {
    title: "BrainWhite Pricing — Cut Developer Ramp Time",
    description: "Predictable pricing for engineering teams from high-growth startups to global enterprises.",
    url: "https://brainwhite.com/pricing",
    siteName: "BrainWhite",
    type: "website",
  },
};

const faqs = [
  {
    q: "How does the 14-day trial work?",
    a: "Connect a repository in 1 click via our native GitHub App. You get full access to automated AST knowledge graphs, learning paths, and PR evaluation for up to 3 engineers without entering a credit card.",
  },
  {
    q: "Is customer source code stored permanently on BrainWhite servers?",
    a: "Never. We employ an ephemeral analysis architecture: repository tarballs are loaded into isolated temporary containers for AST parsing and immediately purged. We never train public AI models on your IP.",
  },
  {
    q: "Can I connect private repositories?",
    a: "Yes. Our native GitHub App automatically issues fine-grained, short-lived tokens per organization with least-privilege read access. Organizations can also supply their own encrypted Personal Access Tokens.",
  },
  {
    q: "What programming languages and frameworks are supported?",
    a: "BrainWhite provides first-class deep AST symbol resolution for TypeScript, JavaScript, Python, Go, Rust, Java, and C++, with automatic framework detection for Next.js, FastAPI, Django, React, Express, and more.",
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black">
      {/* Hero Section */}
      <section className="relative pt-32 sm:pt-40 pb-20 px-6 sm:px-10 md:px-16 max-w-7xl mx-auto overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-white/10 via-emerald-500/10 to-transparent blur-[140px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-xs font-mono uppercase tracking-widest text-emerald-400 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Developer Ramp ROI Guarantee</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tighter leading-[0.95] mb-6">
            Predictable Pricing for <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/40">
              High-Velocity Teams
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-white/60 font-light max-w-2xl leading-relaxed">
            Onboarding an engineer traditionally costs over $25,000 in lost senior engineering time. BrainWhite reduces this overhead by 75% from day one.
          </p>
        </div>

        {/* Interactive Pricing Section with Billing Toggle */}
        <PricingSection />

        {/* Enterprise Security Callout Banner */}
        <div className="mt-20 max-w-5xl mx-auto rounded-3xl border border-white/10 bg-white/[0.02] p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white mb-1">SOC 2 & Enterprise Security Ready</h4>
              <p className="text-xs text-white/60 font-sans max-w-xl">
                Dedicated VPC deployments, self-hosted LLM inference, encrypted database keys, and continuous audit trails are standard for enterprise tiers.
              </p>
            </div>
          </div>
          <Link
            href="/security"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/20 text-xs font-semibold text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <span>Review Security Whitepaper</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Frequently Asked Questions */}
        <div className="mt-24 max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-bold uppercase tracking-tight text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, i) => (
              <div key={i} className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                <h3 className="text-sm font-bold text-white mb-2">{faq.q}</h3>
                <p className="text-xs text-white/60 leading-relaxed font-sans">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <ExperienceFooter />
    </main>
  );
}
