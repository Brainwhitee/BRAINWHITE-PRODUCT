"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = searchParams.get("token");
    if (t) setToken(t);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirm }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Password reset failed");
      if (data.home) {
        router.push(data.home);
        router.refresh();
      }
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
                Choose new password
              </h1>
              <p className="mt-3 text-lg leading-snug text-black/60 dark:text-white/55 sm:text-xl lg:text-2xl xl:text-3xl">
                Your new password must be different from previously used passwords.
              </p>
            </div>

            {error && (
              <div className="mt-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-sm" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <Input
                label="New Password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={isLoading}
                leftIcon={<Lock className="w-5 h-5 text-black/40 dark:text-white/40" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
              />
              <Input
                label="Confirm Password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                disabled={isLoading}
                leftIcon={<Lock className="w-5 h-5 text-black/40 dark:text-white/40" />}
              />
              <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? "Resetting…" : "Reset password"}
              </Button>
            </form>

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
              Choose a strong password you haven&apos;t used before.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black text-white">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}