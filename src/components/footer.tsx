import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative w-full bg-[#050505] text-white pt-24 pb-12 px-4 sm:px-6 md:px-10 z-20 border-t border-white/10">
      {/* Final CTA inside the top of the footer */}
      <div className="max-w-7xl mx-auto w-full text-center mb-20 flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-mono uppercase tracking-widest mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff4400]" />
          Production Engineering Readiness
        </div>
        <h2 className="text-4xl md:text-6xl font-medium tracking-tight mb-6 max-w-3xl text-balance">
          Give new developers a faster, verifiable ramp-up.
        </h2>
        <p className="text-white/60 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
          Transform your codebase into guided, role-specific learning paths with automated PR assessments and evidence ledgers.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/book-demo">
            <button className="group relative inline-flex items-center gap-3 bg-[#ff4400] text-white hover:bg-[#ff5511] font-mono font-medium text-sm px-6 py-3 rounded-full transition-all shadow-[0_0_25px_rgba(255,68,0,0.3)] hover:scale-105 active:scale-95 cursor-pointer">
              <span>Book Architecture Demo</span>
              <ArrowRight className="w-4 h-4 -rotate-45 group-hover:rotate-0 transition-transform" />
            </button>
          </Link>
          <Link href="/login">
            <button className="text-white/80 hover:text-white font-mono text-sm px-6 py-3 rounded-full border border-white/20 hover:border-white/50 transition-colors cursor-pointer">
              Sign In to Platform →
            </button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 border-t border-white/10 pt-12">
          <div className="md:col-span-2">
            <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
              <Image
                src="/Brainwhitelogo-transparent.png"
                alt="BrainWhite"
                width={140}
                height={32}
                className="h-6 w-auto object-contain mb-3"
              />
            </Link>
            <p className="text-white/50 text-sm max-w-sm font-mono leading-relaxed">
              B2B Developer Readiness Platform. Automated codebase mapping, lesson paths, and verified PR grading.
            </p>
          </div>

          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-white/40 mb-4">Product</h4>
            <ul className="space-y-3 font-mono text-sm text-white/70">
              <li><Link href="/product" className="hover:text-white transition-colors">Architecture & AST</Link></li>
              <li><Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/security" className="hover:text-white transition-colors">Security & Isolation</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-white/40 mb-4">Company</h4>
            <ul className="space-y-3 font-mono text-sm text-white/70">
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/book-demo" className="hover:text-white transition-colors">Request Access</Link></li>
              <li><a href="mailto:contact@brainwhite.com" className="hover:text-white transition-colors">contact@brainwhite.com</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-xs font-mono text-white/40">
          <p>© {new Date().getFullYear()} BrainWhite Inc. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link href="/security" className="hover:text-white transition-colors">Security</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}