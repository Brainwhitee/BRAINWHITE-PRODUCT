"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Mail, Lock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "login" | "signup";

interface AuthSectionOneProps {
  mode?: Mode;
  onLogin?: (email: string, password: string) => Promise<void>;
  onSignup?: (orgName: string, name: string, email: string, password: string) => Promise<void>;
}

export default function AuthSectionOne({
  mode = "login",
  onLogin,
  onSignup,
}: AuthSectionOneProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [name, setName] = useState("");

  const isSignup = mode === "signup";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!isSignup && onLogin) {
        await onLogin(email, password);
      } else if (isSignup && onSignup) {
        await onSignup(orgName, name, email, password);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHubLogin = () => {
    if (typeof window !== "undefined") {
      window.location.href = `/api/auth/github/start?mode=${isSignup ? "signup" : "login"}`;
    }
  };

  return (
    <section className="min-h-screen bg-[#050505] text-white antialiased [font-synthesis:none]">
      {/* Top back bar — no navbar, just back */}
      <div className="fixed top-6 left-6 z-50">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="grid min-h-[calc(100vh-4rem)] gap-0 lg:grid-cols-[1fr_1.15fr]">
        {/* Left panel: Auth form */}
        <div className="flex min-h-[720px] items-start px-6 py-12 lg:min-h-0 lg:px-20 lg:py-28 xl:px-24 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-[500px]">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-mono text-blue-400/80 uppercase tracking-widest">
                Brainwhite Auth
              </span>
            </div>

            <h1 className="mt-6 mb-3 text-3xl font-medium tracking-[-0.04em] sm:text-4xl lg:text-[44px] xl:text-[52px]">
              {isSignup ? "Create your organisation" : "Welcome back"}
            </h1>
            <p className="mt-2 text-lg text-slate-400 sm:text-xl leading-relaxed">
              {isSignup
                ? "Join Brainwhite and start onboarding your engineering team."
                : "Sign in to your Brainwhite workspace."}
            </p>

            {error && (
              <div className="mt-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm shadow-lg">
                {error}
              </div>
            )}

            {/* GitHub OAuth */}
            <div className="mt-10">
              <Button
                variant="outline"
                size="lg"
                onClick={handleGitHubLogin}
                disabled={!process.env.GITHUB_CLIENT_ID}
                className="w-full flex items-center justify-center gap-3 border border-white/20 hover:border-blue-500/60 transition-all"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                  className="w-5 h-5"
                >
                  <path
                    fill="currentColor"
                    d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C-4.42 12.17-3.74 10.34-3.74 10.34-2.37 10.09-1.26 10.96-.4 11.79a2.77 2.77 0 0 0 1.14 1.625c1.26.784 2.36 1.105 2.36 1.105 1.08.73 1.64 1.15 2.32.792-.255.635-.41 1.42-.71 2.28-.41 1.43-1.27 2.25-2.23 2.25-1.57.1-2.67-.61-3.24-1.47-.15-.28-.2-.55-.1-.88.57-.03 1.11.1 1.43.4 1.67 1.08 2.7 1.63 3.16 1.28.44.7.62 1.66.39 2.6-.28 1-.28 2-.07 2.14.14.05.27.1.44.1.13 0 .48-.02 1.16-.02 1.16 0 1.42-.01 1.61-.22-.26-.52-.66-1.4-.44-2.28-1.3-.37-1.7-1.32-1.7-2.06 0-.42.14-.83.4-1.19-.12-.42-.3-1.19-.16-2.02.13-.17.17-.35.17-.51-.04-.25-.22-.72-.28-1.27 0 0-.65-.14-2.13.64 1.13-.26 2.37-.42 3.57-.36 1.21.06 2.47.28 3.68.36 1.2-.06 2.45-.1 3.57-.36-1.47-.78-2.13-1.17-2.13-1.17-.38-.84-.63-1.25-.9-1.71-.63-.9-1.44-1.57-2.4-1.57-.94 0-1.62.71-1.62 1.62 0 .15.06.36.17.62.31.69.99 1.16 1.73 1.39.19.05.4.07.62.07.32 0 .63-.02.94-.06 1.1-.18 2.08-.8 2.5-1.62-.36-.44-.66-.95-.95-1.55 0 0-.04-.01-.12-.02C9.54 18.42 10.44 20 11.74 20c2.36 0 3.76-1.58 3.76-3.54 0-1.92-1.42-3.54-3.76-3.54-1.13 0-2.08.72-2.34 1.73-.23.36-.34.84-.29 1.39.05.63.44 1.19.89 1.62.84.08 1.7.13 2.73.13 1.03 0 1.89-.06 2.7-.16.63-.45 1.36-1 2.14-1.19 1.17-.29 1.91-.99 1.91-2.07-.06-.68-.28-1.28-.68-1.76 0 0-.57-.28-2-.71-.54-.15-1.13-.2-1.7-.08-1.4.3-2.75.83-3.85 1.55-.26-.5-.62-.95-.97-1.35 0 0-.67-.2-1.37-.64-.41-.07-.78-.13-1.13-.17-.64-.07-1.18-.14-1.58-.19-.87-.1-1.76-.12-2.62-.14-1.64.02-2.75.08-3.62.18-1.42.05-2.87.08-4.27.17 0 0-.1-.04-.28-.14 0 0-.12-.03-.17-.07C0 13.27 0 12.72 0 12.36 0 7.02 6.03 .99 12 .99 17.97 .99 24 7.02 24 12.36c0 5.31-4.31 9.64-9.66 9.64-.72 0-1.39-.1-2-.27.34-.56.53-1.21.53-2.04 0-1.55-1.24-2.8-2.8-2.8-1.55 0-2.8 1.24-2.8 2.8 0 .83.19 1.48.53 2.04-.61.17-1.22.27-2 .27"
                  />
                </svg>
                {process.env.GITHUB_CLIENT_ID ? "Continue with GitHub" : "GitHub (coming soon)"}
              </Button>
            </div>

            <div className="mt-10 flex items-center text-slate-500 text-xs font-mono uppercase tracking-widest">
              <div className="flex-1 border-t border-slate-700"></div>
              <span className="px-4">or continue with email</span>
              <div className="flex-1 border-t border-slate-700"></div>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {isSignup ? (
                <>
                  <Input
                    label="Organisation Name"
                    type="text"
                    placeholder="e.g. Acme Corp"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    required
                    disabled={isLoading}
                    leftIcon={<Zap className="w-4 h-4 text-slate-500" />}
                  />
                  <Input
                    label="Your Name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isLoading}
                    leftIcon={<Mail className="w-4 h-4 text-slate-500" />}
                  />
                </>
              ) : null}

              <Input
                label="Work Email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                leftIcon={<Mail className="w-4 h-4 text-slate-500" />}
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={isSignup ? 8 : undefined}
                disabled={isLoading}
                leftIcon={<Lock className="w-4 h-4 text-slate-500" />}
              />
              {isSignup && (
                <p className="text-xs text-slate-500">Password must be at least 8 characters</p>
              )}

              <Button
                type="submit"
                size="lg"
                className="mt-4 w-full text-xl font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/20"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {isSignup ? "Creating workspace…" : "Signing in…"}
                  </>
                ) : (
                  <>
                    {isSignup ? "Create workspace" : "Sign in"}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-12 text-center text-sm text-slate-400">
              {isSignup ? (
                <>
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-medium text-blue-400 underline underline-offset-2 hover:text-blue-300 transition-colors"
                  >
                    Sign in
                  </Link>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <Link
                    href="/signup"
                    className="font-medium text-blue-400 underline underline-offset-2 hover:text-blue-300 transition-colors"
                  >
                    Create one
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right panel: Hero with background */}
        <div className="relative flex min-h-[720px] overflow-hidden bg-black">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/90" />
            <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_40%,rgba(59,130,246,0.15),transparent_70%)]" />
          </div>

          <div className="relative z-10 flex h-full w-full flex-col justify-between p-8 sm:p-12 lg:p-20">
            <div>
              <h2 className="max-w-[620px] text-5xl font-medium tracking-[-0.05em] text-white sm:text-6xl lg:text-[64px] lg:leading-[0.98] xl:text-[72px]">
                Think fast,<br />
                Build faster
              </h2>
              <p className="mt-6 text-lg text-slate-300 max-w-md sm:text-xl leading-relaxed">
                Onboard your engineering team with AI-powered codebase knowledge
                and tailored learning paths.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="mt-10 inline-flex h-12 max-w-full items-center justify-center gap-3 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-base font-medium text-white backdrop-blur-md hover:bg-white/20 hover:border-white/30 transition-all shadow-xl shadow-blue-900/20"
            >
              <ArrowRight className="w-5 h-5" />
              <span className="whitespace-nowrap">Open your workspace</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
