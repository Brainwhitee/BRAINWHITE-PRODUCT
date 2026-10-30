import type { Metadata } from "next";
import Link from "next/link";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { ExperienceFooter } from "@/components/experience/footer";

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

const tiers = [
  {
    name: "Starter Trial",
    badge: "14 DAYS FREE",
    price: "$0",
    period: "for 14 days",
    desc: "Experience automated AST knowledge graphs and test candidate onboarding on your first repo.",
    features: [
      "1 Connected GitHub Repository",
      "Up to 3 Active Candidates",
      "Automated AST Knowledge Graph",
      "Personalized Learning Path Generator",
      "Standard AI Pair-Programmer Tutor",
      "Community & Discord Support",
    ],
    cta: "Start Free Trial",
    href: "/signup",
    popular: false,
  },
  {
    name: "Growth Team",
    badge: "MOST POPULAR",
    price: "$49",
    period: "per candidate / month",
    desc: "For engineering teams actively hiring and scaling developer velocity with full telemetry.",
    features: [
      "Unlimited GitHub Repositories",
      "Up to 25 Active Candidates",
      "Real-time 7-Pillar Developer Telemetry",
      "Automated Weekly Executive Reports",
      "Live Pull Request & Git Webhook Sync",
      "Sub-second AI Inference (Groq + Gemini)",
      "Priority Email & Slack Support",
    ],
    cta: "Start 14-Day Free Trial",
    href: "/signup",
    popular: true,
  },
  {
    name: "Enterprise",
    badge: "CUSTOM SCALE",
    price: "Custom",
    period: "annual agreements",
    desc: "For engineering organizations with strict security requirements, monorepos, and SSO.",
    features: [
      "Unlimited Repositories & Monorepo Support",
      "Unlimited Candidates & Team Workspaces",
      "Dedicated PostgreSQL Instance / VPC",
      "Custom Fine-Tuned AI Models on Private Nodes",
      "SAML / Okta SSO & Directory Sync",
      "Dedicated Solutions Architect & SLA",
      "SOC 2 Type II & Security Review Assistance",
    ],
    cta: "Talk with Enterprise Team",
    href: "/book-demo",
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black">
      {/* Hero Section */}
      <section className="relative pt-32 sm:pt-40 pb-20 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-white/10 via-emerald-500/10 to-transparent blur-[140px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-[11px] font-mono uppercase tracking-widest text-emerald-400 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            TRANSPARENT PRICING // ROI GUARANTEE
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tighter leading-[0.95] mb-6">
            Predictable Pricing for <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/40">
              High-Velocity Teams
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-white/60 font-light max-w-2xl leading-relaxed mb-10">
            Onboarding an engineer traditionally costs over $25,000 in lost senior engineering time. BrainWhite reduces this overhead by 75% from day one.
          </p>
        </div>
      </section>

      {/* Pricing Cards Grid */}
      <section className="py-12 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-3xl p-8 sm:p-10 flex flex-col justify-between transition-all duration-300 ${
                tier.popular
                  ? "border-2 border-white bg-white/[0.05] shadow-[0_0_50px_rgba(255,255,255,0.1)] -translate-y-2"
                  : "border border-white/10 bg-white/[0.02] hover:border-white/30"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-white text-black font-mono text-[11px] font-bold uppercase tracking-widest px-4 py-1 rounded-full shadow-lg">
                  Most Popular
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">{tier.name}</h3>
                  <span className="text-[10px] font-mono tracking-widest text-white/50 border border-white/10 px-2.5 py-0.5 rounded-full">
                    {tier.badge}
                  </span>
                </div>

                <p className="text-xs text-white/60 min-h-[36px] mb-6 font-light">
                  {tier.desc}
                </p>

                <div className="flex items-baseline gap-2 mb-8 pb-6 border-b border-white/10">
                  <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight">
                    {tier.price}
                  </span>
                  <span className="text-xs font-mono text-white/50">{tier.period}</span>
                </div>

                <div className="space-y-3.5 mb-8">
                  {tier.features.map((f) => (
                    <div key={f} className="flex items-start gap-3 text-xs sm:text-sm text-white/80 font-light">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href={tier.href}
                className={`inline-flex items-center justify-center gap-2 w-full font-semibold text-sm py-3.5 rounded-full transition-all ${
                  tier.popular
                    ? "bg-white text-black hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                    : "border border-white/20 hover:border-white text-white hover:bg-white/5"
                }`}
              >
                <span>{tier.cta}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ROI Proof Section */}
      <section className="py-20 px-4 sm:px-6 md:px-12 max-w-5xl mx-auto border-t border-white/10 mt-12 text-center">
        <h3 className="text-2xl sm:text-3xl font-bold mb-4">The Real Math on Developer Ramp-up</h3>
        <p className="text-sm text-white/60 max-w-2xl mx-auto leading-relaxed mb-8">
          A senior engineer spending 15 hours/week for 2 months onboarding a single hire costs your company ~$18,000 in diverted velocity alone. BrainWhite pays for itself on day 3 of your first cohort.
        </p>
        <Link
          href="/book-demo"
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <span>Calculate custom team savings with an engineer</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      <ExperienceFooter />
    </main>
  );
}
