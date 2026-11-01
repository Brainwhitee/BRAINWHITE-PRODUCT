"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, Sparkles } from "lucide-react";

export function PricingSection() {
  const [annual, setAnnual] = useState(true);

  const tiers = [
    {
      name: "Starter Trial",
      badge: "14 Days Free",
      monthlyPrice: "$0",
      annualPrice: "$0",
      period: "for 14 days",
      desc: "Experience automated AST knowledge graphs and test candidate onboarding on your first repo.",
      features: [
        "1 Connected GitHub Repository",
        "Up to 3 Active Engineers",
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
      badge: "Most Popular",
      monthlyPrice: "$59",
      annualPrice: "$47",
      period: "per engineer / month",
      desc: "For engineering teams actively hiring and scaling developer velocity with full telemetry.",
      features: [
        "Unlimited GitHub Repositories",
        "Up to 25 Active Engineers",
        "Real-time 7-Pillar Developer Telemetry",
        "Automated Weekly Executive Reports",
        "Live Pull Request & Git Webhook Sync",
        "Sub-second AI Inference & PR Validation",
        "Priority Email & Slack Support",
      ],
      cta: "Start 14-Day Free Trial",
      href: "/signup",
      popular: true,
    },
    {
      name: "Enterprise",
      badge: "Custom Scale",
      monthlyPrice: "Custom",
      annualPrice: "Custom",
      period: "annual agreements",
      desc: "For engineering organizations with strict security requirements, monorepos, and SSO.",
      features: [
        "Unlimited Repositories & Monorepo Support",
        "Unlimited Engineers & Team Workspaces",
        "Dedicated PostgreSQL Instance / VPC",
        "Custom Fine-Tuned AI Models on Private Nodes",
        "SAML / Okta SSO & Directory Sync",
        "Dedicated Solutions Architect & SLA",
        "SOC 2 Type II & Security Review Assistance",
      ],
      cta: "Book Architecture Demo",
      href: "/book-demo",
      popular: false,
    },
  ];

  return (
    <div className="w-full">
      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 mb-16">
        <span className={`text-xs font-semibold ${!annual ? "text-neutral-950" : "text-neutral-400"}`}>
          Monthly Billing
        </span>
        <button
          type="button"
          onClick={() => setAnnual(!annual)}
          className="relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-neutral-200 transition-colors duration-200 ease-in-out focus:outline-none"
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-neutral-950 shadow-md ring-0 transition duration-200 ease-in-out ${
              annual ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </button>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${annual ? "text-neutral-950" : "text-neutral-400"}`}>
            Annual Billing
          </span>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-300">
            Save 20%
          </span>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`relative rounded-3xl p-8 sm:p-10 flex flex-col justify-between transition-all duration-300 ${
              tier.popular
                ? "bg-neutral-950 text-white border-2 border-neutral-950 shadow-xl scale-102 lg:-translate-y-2"
                : "bg-white text-neutral-900 border border-neutral-200 shadow-xs hover:border-neutral-400 hover:bg-neutral-50/50"
            }`}
          >
            {tier.popular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-white text-neutral-950 font-bold text-[10px] uppercase tracking-widest shadow-md flex items-center gap-1.5 border border-neutral-200">
                <Sparkles className="w-3 h-3 text-neutral-950" />
                <span>{tier.badge}</span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-bold tracking-tight ${tier.popular ? "text-white" : "text-neutral-950"}`}>
                  {tier.name}
                </h3>
                {!tier.popular && (
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200 font-medium">
                    {tier.badge}
                  </span>
                )}
              </div>

              <p className={`text-xs leading-relaxed font-sans mb-6 ${tier.popular ? "text-neutral-300" : "text-neutral-600"}`}>
                {tier.desc}
              </p>

              <div className={`flex items-baseline gap-2 mb-6 pb-6 border-b ${tier.popular ? "border-white/15" : "border-neutral-200"}`}>
                <span className={`text-4xl sm:text-5xl font-black font-mono tracking-tight ${tier.popular ? "text-white" : "text-neutral-950"}`}>
                  {annual ? tier.annualPrice : tier.monthlyPrice}
                </span>
                <span className={`text-xs font-mono ${tier.popular ? "text-neutral-400" : "text-neutral-500"}`}>
                  {tier.period}
                </span>
              </div>

              <div className="space-y-3">
                <span className={`text-[10px] font-mono uppercase tracking-widest block mb-2 font-medium ${tier.popular ? "text-neutral-400" : "text-neutral-400"}`}>
                  What is included:
                </span>
                {tier.features.map((feat) => (
                  <div key={feat} className={`flex items-start gap-2.5 text-xs ${tier.popular ? "text-neutral-200" : "text-neutral-700"}`}>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      tier.popular ? "bg-white/10 text-white" : "bg-neutral-100 text-neutral-900 border border-neutral-200"
                    }`}>
                      <Check className="w-2.5 h-2.5" />
                    </div>
                    <span className="leading-relaxed">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`pt-8 mt-8 border-t ${tier.popular ? "border-white/15" : "border-neutral-200"}`}>
              <Link href={tier.href}>
                <button
                  type="button"
                  className={`w-full py-3.5 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                    tier.popular
                      ? "bg-white text-neutral-950 hover:bg-neutral-200"
                      : "bg-neutral-950 text-white hover:bg-neutral-800"
                  }`}
                >
                  <span>{tier.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
