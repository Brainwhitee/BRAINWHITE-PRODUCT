"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Menu({ isDashboard: isDashboardProp }: { isDashboard?: boolean } = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const isDashboard =
    isDashboardProp ??
    (pathname
      ? [
          "/dashboard",
          "/learn",
          "/paths",
          "/tasks",
          "/projects",
          "/team",
          "/audit",
          "/people",
          "/reports",
          "/slides",
          "/connect-github",
        ].some((prefix) => pathname.startsWith(prefix))
      : false);

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

  const links = isDashboard
    ? [
        { label: "BACK TO HOME", href: "/" },
        { label: "DASHBOARD", href: "/dashboard" },
        { label: "MY LEARNING", href: "/learn" },
        { label: "LEARNING PATHS", href: "/paths" },
        { label: "MY TASKS", href: "/tasks" },
        { label: "CODEBASE GRAPH", href: "/projects" },
        { label: "TEAM DIRECTORY", href: "/team" },
        { label: "AUDIT LOG", href: "/audit" },
      ]
    : [
        { label: "PRODUCT", href: "/product" },
        { label: "ARCHITECTURE", href: "/architecture" },
        { label: "HOW IT WORKS", href: "/how-it-works" },
        { label: "SECURITY", href: "/security" },
        { label: "PRICING", href: "/pricing" },
        { label: "BOOK DEMO", href: "/book-demo" },
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
                  {isDashboard ? "Workspace Control Center" : "Developer Readiness Engine"}
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col items-center justify-center gap-2 sm:gap-4 my-auto py-6">
                {links.map((link, i) => (
                  <div key={link.label} className="overflow-hidden">
                    <motion.div
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      exit={{ y: "-100%" }}
                      transition={{
                        delay: 0.12 + i * 0.05,
                        duration: 0.6,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className="block text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter text-white/90 hover:text-white hover:tracking-tight transition-all duration-300 py-1 text-center"
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
                  transition={{ delay: 0.55, duration: 0.5 }}
                  className="mt-4 sm:mt-6"
                >
                  {isDashboard ? (
                    <Link
                      href="/"
                      onClick={() => setIsOpen(false)}
                      className="inline-flex items-center gap-3 bg-white text-black font-semibold text-sm sm:text-base px-8 py-3.5 rounded-full hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                    >
                      <span>← Back to Home Page</span>
                    </Link>
                  ) : (
                    <Link
                      href="/book-demo"
                      onClick={() => setIsOpen(false)}
                      className="inline-flex items-center gap-3 bg-white text-black font-semibold text-sm sm:text-base px-8 py-3.5 rounded-full hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                    >
                      <span>Book a Technical Demo</span>
                      <span className="text-xs font-mono opacity-60">→</span>
                    </Link>
                  )}
                </motion.div>
              </nav>

              {/* Footer Meta */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="flex flex-col sm:flex-row items-center justify-between text-xs text-white/40 border-t border-white/10 pt-4 gap-2 font-mono"
              >
                <div>{isDashboard ? "BRAINWHITE PLATFORM DASHBOARD" : "BRAINWHITE PLATFORM © 2026"}</div>
                <div className="flex gap-4">
                  {isDashboard ? (
                    <>
                      <Link href="/dashboard" onClick={() => setIsOpen(false)} className="hover:text-white transition-colors">
                        OVERVIEW
                      </Link>
                      <Link href="/paths" onClick={() => setIsOpen(false)} className="hover:text-white transition-colors">
                        PATHS
                      </Link>
                      <Link href="/tasks" onClick={() => setIsOpen(false)} className="hover:text-white transition-colors">
                        TASKS
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/security" onClick={() => setIsOpen(false)} className="hover:text-white transition-colors">
                        SECURITY
                      </Link>
                      <Link href="/pricing" onClick={() => setIsOpen(false)} className="hover:text-white transition-colors">
                        PRICING
                      </Link>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
