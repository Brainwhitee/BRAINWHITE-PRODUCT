"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to send reset link");
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-white p-3 text-black antialiased [font-synthesis:none] dark:bg-[#050505] dark:text-white">
      <div className="grid min-h-[calc(100vh-1.5rem)] gap-6 lg:grid-cols-[0.94fr_1.06fr]">
        <div className="flex min-h-[760px] items-start rounded-md border border-black/20 bg-white px-6 py-12 sm:px-10 dark:border-white/10 dark:bg-[#0a0a0a] lg:min-h-0 lg:px-14 lg:py-28 xl:px-20">
          <div className="mx-auto w-full max-w-[590px]">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/20 bg-white text-sm font-medium text-black/60 hover:bg-black/5 dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign in</span>
            </Link>

            <div className="mt-8">
              <h1 className="whitespace-nowrap text-3xl font-medium tracking-[-0.04em] sm:text-4xl lg:text-[42px] lg:leading-[1.05] xl:text-[50px]">
                Reset your password
              </h1>
              <p className="mt-3 text-lg leading-snug text-black/60 dark:text-white/55 sm:text-xl lg:text-2xl xl:text-3xl">
                Enter your email and we&apos;ll send you a link to choose a new password.
              </p>
            </div>

            {error && (
              <div className="mt-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-sm" role="alert">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-6 p-4 rounded-xl border border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400 text-sm" role="status">
                If an account exists for that email, a reset link has been sent.
              </div>
            )}

            {!success && (
              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  leftIcon={<Mail className="w-5 h-5 text-black/40 dark:text-white/40" />}
                />
                <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending…" : "Send reset link"}
                </Button>
              </form>
            )}

            <div className="mt-12 text-center text-sm text-black/60 dark:text-white/50">
              <Link href="/login" className="font-medium text-black/70 underline underline-offset-2 hover:text-black dark:hover:text-white">
                Back to sign in
              </Link>
            </div>
          </div>
        </div>

        <div className="relative flex min-h-[720px] overflow-hidden rounded-md bg-black p-8 text-white sm:p-12 lg:min-h-0">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-orange-700 to-red-900 opacity-90" />
          <div className="relative z-10 flex h-full w-full flex-col justify-between">
            <h2 className="max-w-[620px] text-5xl font-medium tracking-[-0.05em] text-white sm:text-6xl lg:text-[64px] lg:leading-[0.98] xl:text-[70px]">
              Think fast,<br />
              Build faster
            </h2>
            <p className="mt-6 text-lg text-white/80 max-w-md">
              We&apos;ll send a secure link to reset your password.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}