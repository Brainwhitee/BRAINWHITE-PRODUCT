import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
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
    <main className="min-h-screen bg-white text-neutral-900 selection:bg-neutral-900 selection:text-white">
      {/* Hero Section - Solid White with Strict Executive Minimalism */}
      <section className="relative pt-32 sm:pt-40 pb-20 px-6 sm:px-10 md:px-16 max-w-7xl mx-auto overflow-hidden">
        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto mb-16">
          {/* Heading - Pure Black & White, No Badges */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold uppercase tracking-tight text-neutral-950 mb-6">
            Predictable Pricing for High-Velocity Teams
          </h1>

          {/* Subheading - Single Clean Line, No Subheading 2 */}
          <p className="text-base sm:text-lg md:text-xl text-neutral-600 font-sans max-w-2xl leading-relaxed">
            Onboarding an engineer traditionally costs over $25,000 in lost senior engineering time. BrainWhite reduces this overhead by 75% from day one.
          </p>
        </div>

        {/* Interactive Pricing Section */}
        <PricingSection />

        {/* Enterprise Security Callout Banner */}
        <div className="mt-20 max-w-5xl mx-auto rounded-3xl border border-neutral-200 bg-neutral-50/70 p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldCheck className="w-6 h-6 text-neutral-900" />
            </div>
            <div>
              <h4 className="text-base font-bold text-neutral-950 mb-1">SOC 2 &amp; Enterprise Security Ready</h4>
              <p className="text-xs text-neutral-600 font-sans max-w-xl">
                Dedicated VPC deployments, self-hosted LLM inference, encrypted database keys, and continuous audit trails are standard for enterprise tiers.
              </p>
            </div>
          </div>
          <Link
            href="/security"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-300 hover:border-neutral-900 bg-white text-xs font-semibold text-neutral-900 hover:bg-neutral-50 transition-colors shrink-0 shadow-2xs"
          >
            <span>Review Security Whitepaper</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Frequently Asked Questions */}
        <div className="mt-24 max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-bold uppercase tracking-tight text-neutral-950 text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, i) => (
              <div key={i} className="p-6 rounded-2xl border border-neutral-200 bg-neutral-50/50 shadow-xs">
                <h3 className="text-sm font-bold text-neutral-950 mb-2">{faq.q}</h3>
                <p className="text-xs text-neutral-600 leading-relaxed font-sans">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <ExperienceFooter 
        preset="paper" 
        palette={{ background: "#ffffff", ink: "#0a0a0a", accent: "#0a0a0a" }} 
      />
    </main>
  );
}
