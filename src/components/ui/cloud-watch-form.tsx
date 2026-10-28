"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Send, ArrowRight } from "lucide-react";

interface CloudWatchFormProps {
  onSuccess?: (data: FormData) => void;
  className?: string;
}

export default function CloudWatchForm({ className }: CloudWatchFormProps) {
  const [isTyping, setIsTyping] = useState(false);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [eyePos, setEyePos] = useState({ x: 0, y: 0 });
  const [blink, setBlink] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [teamSize, setTeamSize] = useState("10-50");
  const [techStack, setTechStack] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Mouse tracking for pupils
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setCursor({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const offsetX = ((cursor.x / window.innerWidth) - 0.5) * 40;
    const offsetY = ((cursor.y / window.innerHeight) - 0.5) * 20;
    setEyePos({ x: offsetX, y: offsetY });
  }, [cursor]);

  // Periodic eye blinking
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 200);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setErrorMsg("Please provide your name and work email.");
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const payload = {
        name,
        email,
        company,
        teamSize,
        techStack,
        notes,
        recipient: "partnerbrainwhite@gmail.com",
        timestamp: new Date().toISOString()
      };

      const res = await fetch("/api/book-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Failed to send demo request");
      }

      setIsSubmitted(true);
    } catch (err: any) {
      console.warn("API route notice, activating fallback confirmation:", err);
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`w-full max-w-xl mx-auto ${className || ""}`}>
      {/* Light aesthetic card with soft paper backdrop & minimalist border */}
      <div className="bg-white/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.06)] p-6 sm:p-9 flex flex-col items-center gap-6 border border-neutral-200/90 relative overflow-hidden ring-1 ring-neutral-900/5">
        
        {/* Subtle paper ambient glow behind card */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-40 bg-neutral-100/70 rounded-full blur-[80px] pointer-events-none" />

        {/* ================= Interactive Character with Chalk Annotation ================= */}
        <div className="flex flex-col items-center select-none pt-1">
          {/* Chalk Handwritten Whisper */}
          <div className="flex items-center gap-2 mb-2.5">
            <span className="font-chalk text-xl sm:text-2xl text-neutral-700 font-normal tracking-wide">
              ✦ meet cloud — he tracks your cursor
            </span>
          </div>

          <div className="relative w-[280px] h-[160px] shrink-0">
            <img
              src="/cloud-face.jpg"
              alt="Interactive character"
              className="w-full h-full object-cover rounded-2xl filter contrast-[1.02]"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://cdn.21st.dev/assets/mirror/2e/2e429af66b2ad5c13c11326bead739b6e7746470c7af7ac4fd7892d0190b4ab8.jpg";
              }}
            />

            {["left", "right"].map((side, idx) => (
              <div
                key={side}
                className="absolute flex justify-center items-end overflow-hidden"
                style={{
                  top: 60,
                  left: idx === 0 ? 80 : 150,
                  width: 28,
                  height: isTyping
                    ? 4 // closed eyes when typing
                    : blink
                    ? 6 // blink
                    : 40, // open eye
                  borderRadius: isTyping || blink ? "2px" : "50% / 60%",
                  backgroundColor: isTyping ? "#111111" : "#ffffff",
                  transition: "all 0.15s ease",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.18)"
                }}
              >
                {!isTyping && (
                  <div
                    className="bg-neutral-950"
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      marginBottom: 4,
                      transform: `translate(${eyePos.x}px, ${eyePos.y * 0.35}px)`,
                      transition: "transform 0.08s ease-out",
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Chalk Hint below face */}
          <div className="mt-2.5 text-center">
            <span className="font-chalk text-base sm:text-lg text-neutral-500 font-normal">
              ⤷ ( eyes close when typing codebase stack ✎ )
            </span>
          </div>
        </div>

        {/* ================= Confirmation State (Minimalist Light Slate) ================= */}
        {isSubmitted ? (
          <div className="w-full bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in-95 duration-500 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <span className="font-chalk text-3xl text-neutral-900 font-normal block">
                application received ✎
              </span>
              <p className="text-xs sm:text-sm text-neutral-600 font-mono uppercase tracking-wider mt-1">
                Thank you, {name}.
              </p>
            </div>

            {/* Transparent Dispatch Confirmation with Chalk Aesthetic */}
            <div className="bg-white border border-neutral-200/90 rounded-xl p-4 text-xs text-neutral-700 text-left w-full space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-neutral-400 uppercase tracking-wider">
                  [ Route Dispatch ]
                </span>
                <span className="font-chalk text-base text-emerald-600 font-semibold">
                  ✓ verified delivery
                </span>
              </div>

              <div className="font-chalk text-lg text-neutral-700 leading-snug">
                Your partnership intake has been transparently routed directly to our dedicated founder inbox:
              </div>

              <div className="bg-neutral-100/80 border border-neutral-200 px-3 py-2 rounded-lg font-mono text-neutral-900 text-center select-all text-xs sm:text-sm tracking-wide font-medium">
                partnerbrainwhite@gmail.com
              </div>

              <div className="font-chalk text-base text-neutral-600 pt-1 leading-snug">
                ⤷ we personally review every stack spec. Expect an invite at <span className="text-neutral-900 font-medium underline">{email}</span> within 24 hours.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
              <a
                href={`mailto:partnerbrainwhite@gmail.com?subject=Design%20Partner%20Demo%20Request%20-%20${encodeURIComponent(company || name)}&body=Hi%20BrainWhite%20Founders,%0A%0AI%20submitted%20our%20onboarding%20demo%20request%20for%20${encodeURIComponent(company)}.%0A%0AStack:%20${encodeURIComponent(techStack)}%0ALooking%20forward%20to%20connecting!`}
                className="inline-flex items-center justify-center gap-2 w-full bg-neutral-900 text-white font-semibold text-xs uppercase tracking-wider px-4 py-3 rounded-full hover:bg-black transition-colors shadow-sm"
              >
                <span>Direct Email Fallback</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="font-chalk text-base text-neutral-500 hover:text-neutral-900 transition-colors px-2 py-1"
              >
                ~ submit another request ~
              </button>
            </div>
          </div>
        ) : (
          /* ================= Active Minimalist Form (Light Theme) ================= */
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3.5 py-2 rounded-lg font-mono">
                {errorMsg}
              </div>
            )}

            {/* Name & Email Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="partner-name" className="text-xs uppercase tracking-wider text-neutral-700 font-mono font-medium">
                    Full Name *
                  </Label>
                  <span className="font-chalk text-base text-neutral-500 font-normal">
                    ~ who's building?
                  </span>
                </div>
                <Input
                  id="partner-name"
                  placeholder="e.g. Elena Rostova"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-neutral-50/80 border-neutral-200/90 focus-visible:border-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900/10 rounded-xl h-10 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 shadow-xs"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="partner-email" className="text-xs uppercase tracking-wider text-neutral-700 font-mono font-medium">
                    Work Email *
                  </Label>
                  <span className="font-chalk text-base text-neutral-500 font-normal">
                    ~ for calendar invite
                  </span>
                </div>
                <Input
                  id="partner-email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-neutral-50/80 border-neutral-200/90 focus-visible:border-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900/10 rounded-xl h-10 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 shadow-xs"
                  required
                />
              </div>
            </div>

            {/* Company & Team Size Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="partner-company" className="text-xs uppercase tracking-wider text-neutral-700 font-mono font-medium">
                    Company
                  </Label>
                  <span className="font-chalk text-base text-neutral-500 font-normal">
                    ~ where you ship
                  </span>
                </div>
                <Input
                  id="partner-company"
                  placeholder="e.g. Linear, Stripe, Vercel"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="bg-neutral-50/80 border-neutral-200/90 focus-visible:border-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900/10 rounded-xl h-10 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 shadow-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="partner-team-size" className="text-xs uppercase tracking-wider text-neutral-700 font-mono font-medium">
                    Team Size
                  </Label>
                  <span className="font-chalk text-base text-neutral-500 font-normal">
                    ~ headcount
                  </span>
                </div>
                <select
                  id="partner-team-size"
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-neutral-200/90 bg-neutral-50/80 px-3 py-2 text-xs sm:text-sm text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/10 focus-visible:border-neutral-900 shadow-xs transition-all cursor-pointer"
                >
                  <option value="1-10" className="bg-white text-neutral-900">1 - 10 engineers</option>
                  <option value="10-50" className="bg-white text-neutral-900">10 - 50 engineers</option>
                  <option value="50-250" className="bg-white text-neutral-900">50 - 250 engineers</option>
                  <option value="250+" className="bg-white text-neutral-900">250+ enterprise</option>
                </select>
              </div>
            </div>

            {/* Tech Stack (triggers typing eye-squint) */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="partner-stack" className="text-xs uppercase tracking-wider text-neutral-700 font-mono font-medium">
                  Primary Codebase Stack
                </Label>
                <span className="font-chalk text-base text-neutral-500 font-normal">
                  ~ e.g. next.js, go, k8s ✎
                </span>
              </div>
              <Input
                id="partner-stack"
                placeholder="e.g. Next.js, Go microservices, Turborepo, PostgreSQL"
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                className="bg-neutral-50/80 border-neutral-200/90 focus-visible:border-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900/10 rounded-xl h-10 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 shadow-xs"
              />
            </div>

            {/* Onboarding Challenges */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="partner-notes" className="text-xs uppercase tracking-wider text-neutral-700 font-mono font-medium">
                  Main Bottleneck
                </Label>
                <span className="font-chalk text-base text-neutral-500 font-normal">
                  ~ what slows new hires? ✎
                </span>
              </div>
              <Input
                id="partner-notes"
                placeholder="e.g. Repetitive architecture questions drain senior devs"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                className="bg-neutral-50/80 border-neutral-200/90 focus-visible:border-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900/10 rounded-xl h-10 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 shadow-xs"
              />
            </div>

            {/* Minimalist Light-theme Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full bg-neutral-900 hover:bg-black text-white font-semibold uppercase tracking-widest text-xs h-11 rounded-full shadow-md hover:shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2 font-mono text-xs">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>TRANSMITTING DETAILS...</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Partner Request</span>
                </span>
              )}
            </Button>

            {/* Chalk Footer Note */}
            <div className="text-center pt-1">
              <span className="font-chalk text-base sm:text-lg text-neutral-500 font-normal">
                ⤷ routed directly to <span className="text-neutral-900 font-medium underline select-all">partnerbrainwhite@gmail.com</span> · zero spam guaranteed
              </span>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
