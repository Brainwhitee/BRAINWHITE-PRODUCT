"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = searchParams.get("token");
    if (t) {
      setToken(t);
      verifyEmail(t);
    } else {
      setStatus("error");
      setError("Missing verification token");
    }
  }, [searchParams]);

  const verifyEmail = async (t: string) => {
    setStatus("verifying");
    setError(null);
    try {
      const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(t)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStatus("success");
    } catch (err: unknown) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Verification failed");
    }
  };

  const resendVerification = async () => {
    setError(null);
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setError("Verification email sent! Check your inbox.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend");
    }
  };

  if (status === "verifying") {
    return (
      <section className="min-h-screen bg-white p-3 text-black antialiased [font-synthesis:none] dark:bg-[#050505] dark:text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-black/60 dark:text-white/60" />
          <p className="mt-4 text-lg">Verifying your email…</p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-white p-3 text-black antialiased [font-synthesis:none] dark:bg-[#050505] dark:text-white">
      <div className="grid min-h-[calc(100vh-1.5rem)] gap-6 lg:grid-cols-[0.94fr_1.06fr]">
        <div className="flex min-h-[760px] items-start rounded-md border border-black/20 bg-white px-6 py-12 sm:px-10 dark:border-white/10 dark:bg-[#0a0a0a] lg:min-h-0 lg:px-14 lg:py-28 xl:px-20">
          <div className="mx-auto w-full max-w-[590px] text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/20 bg-white text-sm font-medium text-black/60 hover:bg-black/5 dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign in</span>
            </Link>

            <div className="mt-8">
              {status === "success" ? (
                <>
                  <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
                  <h1 className="mt-4 text-3xl font-medium tracking-[-0.04em] sm:text-4xl">Email verified!</h1>
                  <p className="mt-3 text-lg text-black/60 dark:text-white/55">Your account is ready. You can now sign in.</p>
                  <Button className="mt-8" asChild>
                    <Link href="/login">Sign in</Link>
                  </Button>
                </>
              ) : (
                <>
                  <AlertCircle className="w-16 h-16 mx-auto text-red-500" />
                  <h1 className="mt-4 text-3xl font-medium tracking-[-0.04em] sm:text-4xl">Verification failed</h1>
                  <p className="mt-3 text-lg text-black/60 dark:text-white/55">{error || "This link is invalid or expired."}</p>
                  <Button variant="outline" className="mt-8" onClick={resendVerification} disabled={!token}>
                    Resend verification email
                  </Button>
                </>
              )}
            </div>

            <div className="mt-12 text-sm text-black/60 dark:text-white/50">
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
              Verify your email to unlock your Brainwhite workspace.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black text-white">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}