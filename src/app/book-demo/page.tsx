"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExperienceFooter } from "@/components/experience/footer";
import { SonarGrid } from "@/components/ui/sonar-grid";

export default function BookDemoPage() {
  const [isTyping, setIsTyping] = useState(false);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [eyePos, setEyePos] = useState({ x: 0, y: 0 });
  const [blink, setBlink] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    teamSize: "10-50",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => setCursor({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  useEffect(() => {
    const offsetX = ((cursor.x / (typeof window !== "undefined" ? window.innerWidth : 1000)) - 0.5) * 36;
    const offsetY = ((cursor.y / (typeof window !== "undefined" ? window.innerHeight : 800)) - 0.5) * 16;
    setEyePos({ x: offsetX, y: offsetY });
  }, [cursor]);

  // Natural blinking every 3.2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 200);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/book-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to schedule demo.");
      }

      setSubmitted(true);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-neutral-900 selection:bg-neutral-900 selection:text-white flex flex-col justify-between">
      {/* Main Centered Minimal Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-24 sm:py-28 relative overflow-hidden">
        {/* Interactive Sonar Grid Canvas Background */}
        <SonarGrid className="absolute inset-0 z-0" />

        <div className="relative z-10 w-full max-w-md">
          {/* Header - Black and White, Single Heading and Subheading, No Subheading 2 */}
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-neutral-950">
              Book Architecture Demo
            </h1>
            <p className="mt-2 text-sm sm:text-base text-neutral-600 font-sans">
              Private codebase walkthrough &amp; AST roadmap synthesis.
            </p>
          </div>

          {/* Form Card on Solid White */}
          <div className="bg-white rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.06)] p-6 sm:p-8 flex flex-col items-center gap-6 border border-neutral-200 w-full">
            
            {/* Animated Character with Cursor Eye Tracking */}
            <div className="relative w-[280px] h-[160px] select-none pointer-events-none">
              <img
                src="/cloud-watch-face.jpg"
                alt="Cloud Character"
                className="w-full h-full object-contain"
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
                      ? 4 // fully closed when typing
                      : blink
                      ? 6 // temporary blink
                      : 40, // open eye
                    borderRadius: isTyping || blink ? "2px" : "50% / 60%",
                    backgroundColor: isTyping ? "#111111" : "#ffffff",
                    transition: "all 0.15s ease",
                    boxShadow: isTyping ? "none" : "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                >
                  {!isTyping && (
                    <div
                      className="bg-black"
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        marginBottom: 4,
                        transform: `translate(${eyePos.x}px, ${eyePos.y}px)`,
                        transition: "transform 0.08s ease-out",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            {submitted ? (
              <div className="w-full text-center py-6 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-neutral-950 uppercase tracking-wider">
                    Demo Request Received
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-xs mx-auto">
                    We&apos;ve routed your details directly to <span className="text-neutral-900 font-mono font-medium">partnerbrainwhite@gmail.com</span>. Our technical founders will contact you within 24 hours.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      name: "",
                      email: "",
                      company: "",
                      teamSize: "10-50",
                      message: "",
                    });
                  }}
                  className="text-xs text-neutral-800 hover:text-neutral-950 border-neutral-300 hover:border-neutral-900 mt-4 rounded-xl"
                >
                  Submit Another Request
                </Button>
              </div>
            ) : (
              /* Input Form */
              <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-mono">
                    {errorMsg}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="demo-name" className="text-xs uppercase tracking-wider text-neutral-700 font-mono font-medium">
                    Full Name *
                  </Label>
                  <Input
                    id="demo-name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    onFocus={() => setIsTyping(true)}
                    onBlur={() => setIsTyping(false)}
                    placeholder="e.g. Sarah Connor"
                    className="h-11 text-sm rounded-xl border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="demo-email" className="text-xs uppercase tracking-wider text-neutral-700 font-mono font-medium">
                    Work Email *
                  </Label>
                  <Input
                    id="demo-email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    onFocus={() => setIsTyping(true)}
                    onBlur={() => setIsTyping(false)}
                    placeholder="sarah@company.com"
                    className="h-11 text-sm rounded-xl border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="demo-company" className="text-xs uppercase tracking-wider text-neutral-700 font-mono font-medium">
                    Company / Organization *
                  </Label>
                  <Input
                    id="demo-company"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    onFocus={() => setIsTyping(true)}
                    onBlur={() => setIsTyping(false)}
                    placeholder="Acme Corp"
                    className="h-11 text-sm rounded-xl border border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="demo-team" className="text-xs uppercase tracking-wider text-neutral-700 font-mono font-medium">
                    Engineering Team Size
                  </Label>
                  <select
                    id="demo-team"
                    value={formData.teamSize}
                    onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                    onFocus={() => setIsTyping(true)}
                    onBlur={() => setIsTyping(false)}
                    className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 text-sm text-neutral-900 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all cursor-pointer"
                  >
                    <option value="1-10">1 – 10 engineers</option>
                    <option value="10-50">10 – 50 engineers</option>
                    <option value="50-250">50 – 250 engineers</option>
                    <option value="250+">250+ enterprise developers</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="demo-message" className="text-xs uppercase tracking-wider text-neutral-700 font-mono font-medium">
                    Codebase Details / Questions
                  </Label>
                  <textarea
                    id="demo-message"
                    rows={3}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    onFocus={() => setIsTyping(true)}
                    onBlur={() => setIsTyping(false)}
                    placeholder="e.g. Next.js + Go monorepo, 30+ microservices..."
                    className="w-full rounded-xl border border-neutral-300 bg-white p-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full h-11 bg-neutral-950 hover:bg-neutral-800 text-white font-bold uppercase tracking-wider text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Request...</span>
                    </>
                  ) : (
                    <>
                      <span>Schedule Demo</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              </form>
            )}

          </div>
        </div>
      </div>

      <ExperienceFooter 
        preset="paper" 
        palette={{ background: "#ffffff", ink: "#0a0a0a", accent: "#0a0a0a" }} 
      />
    </main>
  );
}
