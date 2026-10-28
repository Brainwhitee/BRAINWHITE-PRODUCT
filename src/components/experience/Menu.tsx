"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export function Menu() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    // Prevent focus from reaching page content behind the overlay
    const mainElement = document.querySelector("main");
    if (mainElement) {
      const children = Array.from(mainElement.children);
      if (isOpen) {
        children.forEach((child) => {
          if (child.id !== "menu-button" && child.id !== "menu-overlay-container") {
            child.setAttribute("inert", "true");
          }
        });
      } else {
        children.forEach((child) => {
          child.removeAttribute("inert");
        });
      }
    }
  }, [isOpen]);

  const links = [
    { label: "PRODUCT & ARCHITECTURE", href: "/product" },
    { label: "HOW IT WORKS", href: "/how-it-works" },
    { label: "BOOK A DEMO", href: "/book-demo" },
    { label: "SECURITY & COMPLIANCE", href: "/security" },
    { label: "SIGN IN", href: "/login" },
    { label: "GET STARTED", href: "/signup" },
  ];

  return (
    <>
      <motion.button
        id="menu-button"
        aria-expanded={isOpen}
        aria-controls="menu-overlay"
        className="fixed top-6 right-6 md:top-8 md:right-8 z-[100] text-xs sm:text-sm md:text-base font-bold uppercase tracking-widest mix-blend-difference text-white h-7 md:h-8 px-3 py-1 rounded-full border border-white/20 backdrop-blur-md hover:border-white/60 transition-colors cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full transition-colors ${isOpen ? "bg-red-500 animate-pulse" : "bg-emerald-400"}`} />
          <span>{isOpen ? "CLOSE" : "MENU"}</span>
        </span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <div id="menu-overlay-container" className="contents">
            <motion.div
              id="menu-overlay"
              initial={{ clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)" }}
              animate={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
              exit={{ clipPath: "polygon(0 100%, 100% 100%, 100% 100%, 0 100%)" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-0 z-[90] bg-[#050505] text-white flex flex-col justify-between p-6 sm:p-10 md:p-16 pointer-events-auto overflow-y-auto"
            >
              {/* Header with Logo */}
              <div className="flex items-center justify-between w-full pt-2">
                <Link href="/" onClick={() => setIsOpen(false)} className="inline-block">
                  <Image
                    src="/Brainwhitelogo-transparent.png"
                    alt="BrainWhite"
                    width={180}
                    height={44}
                    className="h-8 sm:h-10 w-auto object-contain"
                  />
                </Link>
                <div className="text-xs font-mono uppercase tracking-widest text-white/50 hidden sm:block">
                  Developer Readiness Engine
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col items-center justify-center gap-3 sm:gap-6 my-auto py-8">
                {links.map((link, i) => (
                  <div key={link.label} className="overflow-hidden">
                    <motion.div
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      exit={{ y: "-100%" }}
                      transition={{
                        delay: 0.15 + i * 0.08,
                        duration: 0.7,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className="block text-3xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter text-white/90 hover:text-white hover:tracking-tight transition-all duration-300"
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  </div>
                ))}

                {/* Primary CTA in Menu */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="mt-6 sm:mt-10"
                >
                  <Link
                    href="/book-demo"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex items-center gap-3 bg-white text-black font-semibold text-sm sm:text-base px-8 py-3.5 rounded-full hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                  >
                    <span>Book a Technical Demo</span>
                    <span className="text-xs font-mono opacity-60">→</span>
                  </Link>
                </motion.div>
              </nav>

              {/* Footer Meta */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono tracking-widest uppercase text-white/40 border-t border-white/10 pt-6"
              >
                <div className="flex gap-6">
                  <a href="#" className="hover:text-white transition-colors">Twitter</a>
                  <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
                  <a href="#" className="hover:text-white transition-colors">GitHub</a>
                </div>
                <div>© {new Date().getFullYear()} BRAINWHITE INC.</div>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
