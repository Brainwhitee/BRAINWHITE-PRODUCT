"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const faqs = [
  {
    question: "Is this just another documentation tool?",
    answer: "No. Documentation is static and quickly goes obsolete. BrainWhite connects directly to the repository AST, extracting living architecture, symbol dependency graphs, and test execution conventions."
  },
  {
    question: "Will it work with our tech stack?",
    answer: "BrainWhite connects to your private GitHub/GitLab repositories and toolchains across Next.js, TypeScript, Python FastAPI, Go, Rust, Java, and monorepo configurations."
  },
  {
    question: "Is our proprietary code secure?",
    answer: "Zero-retention architecture. Your code is never used to train public foundation models. Customer AST and embedding indexes are isolated with tenant-scoped row-level security."
  },
  {
    question: "What does joining as a design partner involve?",
    answer: "A 30-minute architectural consultation about your onboarding pipeline, early access to private repo indexing, and custom evaluation rubric configuration."
  }
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-[#050505] py-24 md:py-40 overflow-hidden border-t border-white/10 relative">

      {/* Subtle ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(255,68,0,0.04)_0%,transparent_70%)] pointer-events-none z-0" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-10 relative z-10">

        {/* Early Access / Architecture Intake Callout */}
        <div className="relative group rounded-3xl mb-32">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-white/10 via-[#ff4400]/30 to-white/10 rounded-3xl blur-[8px] opacity-40 group-hover:opacity-75 transition duration-500" />
          <div className="relative bg-[#0c0c0c] rounded-3xl p-8 md:p-12 shadow-2xl border border-white/15 overflow-hidden">
            <div className="max-w-2xl relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-mono uppercase tracking-widest mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff4400]" />
                Private Beta Design Partner
              </div>
              <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-white mb-6">
                We're onboarding select engineering teams now
              </h2>
              <p className="text-white/60 mb-8 leading-relaxed text-base sm:text-lg">
                BrainWhite is actively deployed with leading engineering pods. Partner with us to eliminate senior developer ramp-up drag and gain full visibility into developer readiness.
              </p>

              <Link href="/book-demo">
                <button className="group inline-flex items-center gap-3 bg-[#ff4400] text-white hover:bg-[#ff5511] font-mono font-medium text-xs sm:text-sm px-6 py-3 rounded-full transition-all shadow-[0_0_20px_rgba(255,68,0,0.3)] hover:scale-105 active:scale-95 cursor-pointer">
                  <span>Schedule Consultation</span>
                  <ArrowRight className="w-4 h-4 -rotate-45 group-hover:rotate-0 transition-transform" />
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-mono uppercase tracking-widest mb-4">
            <span>// ARCHITECTURAL FAQ</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white">Frequently Asked Questions</h2>
        </div>

        {/* FAQ Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ perspective: "1000px" }}>
          {faqs.map((faq, index) => {
            const isFlipped = openIndex === index;
            return (
              <div
                key={index}
                className="relative h-[250px] w-full cursor-pointer group"
                onClick={() => setOpenIndex(isFlipped ? null : index)}
                onMouseEnter={() => setOpenIndex(index)}
                onMouseLeave={() => setOpenIndex(null)}
              >
                <motion.div
                  initial={false}
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.5, type: "spring", stiffness: 120, damping: 20 }}
                  style={{ transformStyle: "preserve-3d" }}
                  className="w-full h-full relative"
                >
                  {/* Front of Card (Question) */}
                  <div
                    className="absolute inset-0 rounded-2xl bg-[#0c0c0c] border border-white/10 group-hover:border-[#ff4400]/40 p-8 flex flex-col justify-between shadow-xl backface-hidden transition-colors"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-white/40 uppercase tracking-widest">0{index + 1}</span>
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-mono text-white/70">
                        ?
                      </div>
                    </div>
                    <h3 className="text-lg md:text-xl font-medium text-white tracking-tight">
                      {faq.question}
                    </h3>
                    <div className="text-xs font-mono text-white/30 uppercase tracking-wider">
                      Hover to view answer →
                    </div>
                  </div>

                  {/* Back of Card (Answer) */}
                  <div
                    className="absolute inset-0 rounded-2xl bg-[#121212] border border-[#ff4400]/40 p-8 flex flex-col justify-between text-left shadow-[0_0_30px_rgba(255,68,0,0.1)] backface-hidden"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  >
                    <div className="font-mono text-xs text-[#ff4400] uppercase tracking-widest">
                      // Architectural Answer
                    </div>
                    <p className="text-sm md:text-base leading-relaxed text-white/80 font-mono">
                      {faq.answer}
                    </p>
                    <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
                      Verified by BrainWhite Security Team
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
