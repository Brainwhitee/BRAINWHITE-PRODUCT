"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

export function ExperienceFooter() {
  return (
    <footer className="relative w-full bg-[#050505] text-white pt-20 sm:pt-28 md:pt-32 pb-8 sm:pb-12 px-4 sm:px-6 md:px-10 z-20 overflow-hidden border-t border-white/10">
      
      {/* Massive Call to Action */}
      <div className="flex flex-col items-center justify-center mb-20 sm:mb-32 text-center">
        <h2 className="text-3xl sm:text-5xl md:text-7xl lg:text-[7.5vw] font-medium tracking-tighter uppercase leading-[0.9] mb-8 sm:mb-12 hover:scale-105 transition-transform duration-700 cursor-pointer">
          Let's Build <br/> The Future
        </h2>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto px-4">
          <a href="/early-access" className="group relative inline-flex items-center justify-center gap-4 bg-transparent border border-white hover:border-white transition-colors duration-500 rounded-full px-6 sm:px-8 py-3.5 sm:py-4 overflow-hidden w-full sm:w-auto">
            <div className="absolute inset-0 bg-white translate-y-[101%] group-hover:translate-y-0 transition-transform duration-500 ease-[0.16,1,0.3,1] rounded-full z-0" />
            <span className="relative z-10 text-xs sm:text-sm uppercase tracking-widest font-mono group-hover:text-black transition-colors duration-500">
              Request Access
            </span>
            <div className="relative z-10 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-black group-hover:bg-black group-hover:text-white transition-colors duration-500">
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 -rotate-45 group-hover:rotate-0 transition-transform duration-500" />
            </div>
          </a>
          
          <a href="mailto:contact@brainwhite.com" className="group relative inline-flex items-center justify-center gap-4 bg-white text-black hover:bg-transparent hover:text-white border border-white transition-colors duration-500 rounded-full px-6 sm:px-8 py-3.5 sm:py-4 overflow-hidden w-full sm:w-auto">
            <span className="relative z-10 text-xs sm:text-sm uppercase tracking-widest font-mono">
              contact@brainwhite.com
            </span>
          </a>
        </div>
      </div>

      {/* Footer Bottom Meta */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between w-full pt-12 border-t border-white/10 text-xs font-mono uppercase tracking-widest opacity-60">
        <div className="flex gap-12 mb-8 md:mb-0">
          <div className="flex flex-col gap-2">
            <a href="#" className="hover:opacity-100 transition-opacity">LKDN</a>
            <a href="#" className="hover:opacity-100 transition-opacity">X.COM</a>
            <a href="#" className="hover:opacity-100 transition-opacity">GITHUB</a>
          </div>
          <div className="flex flex-col gap-2">
            <a href="#" className="hover:opacity-100 transition-opacity">Privacy</a>
            <a href="#" className="hover:opacity-100 transition-opacity">Terms</a>
            <a href="#" className="hover:opacity-100 transition-opacity">Cookies</a>
          </div>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2 text-left md:text-right">
          <Image
            src="/Brainwhitelogo-transparent.png"
            alt="BrainWhite"
            width={140}
            height={36}
            className="h-6 sm:h-7 w-auto object-contain opacity-80 mb-1"
          />
          <p>© {new Date().getFullYear()} BrainWhite Inc.</p>
          <p className="text-[10px] text-white/40">All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
