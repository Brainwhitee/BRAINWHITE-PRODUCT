"use client";

import { useState, useEffect } from "react";
import { GrainGradient } from "@paper-design/shaders-react";
import { cn } from "@/lib/utils";
import { ArrowRight, Mail, Lock, Eye, EyeOff, Check } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

type Mode = "login" | "signup";

interface AuthSectionOneProps {
  mode?: Mode;
  initialError?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  google_not_configured: "Google sign-in is not configured. Please use email or GitHub.",
  google_state_invalid: "Google authentication failed. Please try again.",
  google_token_failed: "Google authentication failed. Please try again.",
  google_no_email: "Your Google account did not share an email address. Use email sign-up instead.",
  google_no_account: "No Brainwhite account uses this Google profile. Create an account first.",
  github_not_configured: "GitHub sign-in is not configured. Please use email or Google.",
  github_state_invalid: "GitHub authentication failed. Please try again.",
  github_token_failed: "GitHub authentication failed. Please try again.",
  github_no_email: "Your GitHub account did not share a verified email. Add one at github.com/settings/emails, then retry.",
  github_no_account: "No Brainwhite account uses this GitHub profile. Create an account first.",
  signup_org_name_taken: "That organisation name is taken. Please choose another.",
  github_account_not_found: "No account linked to this GitHub profile. Sign up instead.",
  reset_token_invalid: "This reset link is invalid or expired. Request a new one.",
  verify_token_invalid: "This verification link is invalid or expired.",
  oauth_no_email: "Provider did not share an email. Use email sign-up instead.",
  oauth_no_account: "No account linked to this provider. Sign up instead.",
};

function mapError(code: string): string {
  return ERROR_MESSAGES[code] ?? code.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AuthSectionOne({ mode = "login", initialError }: AuthSectionOneProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [showPassword, setShowPassword] = useState(false);

  // Read ?error= from URL on mount
  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError && !initialError) {
      setError(mapError(urlError));
    }
  }, [searchParams, initialError]);

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Signup form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const isSignup = mode === "signup";

  const getRedirectDestination = (defaultHome: string) => {
    const redirectParam = searchParams.get("redirect");
    if (redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")) {
      return redirectParam;
    }
    return defaultHome;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!isSignup) {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || "Login failed");
        const destination = getRedirectDestination(data.home || "/dashboard");
        router.push(destination);
        router.refresh();
      } else {
        if (!termsAccepted) {
          throw new Error("You must accept the Terms and Privacy Policy to continue.");
        }
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orgName,
            name: `${firstName.trim()} ${lastName.trim()}`.trim(),
            email: signupEmail,
            password: signupPassword,
          }),
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || "Sign up failed");
        const destination = getRedirectDestination(data.home || "/dashboard");
        router.push(destination);
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const redirectQuery = (() => {
    const r = searchParams.get("redirect");
    return r ? `&redirect=${encodeURIComponent(r)}` : "";
  })();

  const handleGoogleSignup = () => {
    window.location.href = `/api/auth/google/start?mode=signup${redirectQuery}`;
  };
  const handleGoogleLogin = () => {
    window.location.href = `/api/auth/google/start?mode=login${redirectQuery}`;
  };
  const handleGithubSignup = () => {
    window.location.href = `/api/auth/github/start?mode=signup${redirectQuery}`;
  };
  const handleGithubLogin = () => {
    window.location.href = `/api/auth/github/start?mode=login${redirectQuery}`;
  };

  const termsText = (
    <>
      By creating an account, you agree to our{" "}
      <a href="/terms" className="font-medium text-black/45 underline underline-offset-2 dark:text-white/45">
        Terms and Services
      </a>{" "}
      and{" "}
      <a href="/privacy" className="font-medium text-black/45 underline underline-offset-2 dark:text-white/45">
        Privacy Policy
      </a>
    </>
  );

  return (
    <section className="min-h-screen bg-white p-3 text-black antialiased [font-synthesis:none] dark:bg-[#050505] dark:text-white">
      <div className="grid min-h-[calc(100vh-1.5rem)] gap-6 lg:grid-cols-[0.94fr_1.06fr]">
        <div className="flex min-h-[760px] items-start rounded-md border border-black/20 bg-white px-6 py-12 sm:px-10 dark:border-white/10 dark:bg-[#0a0a0a] lg:min-h-0 lg:px-14 lg:py-28 xl:px-20">
          <div className="mx-auto w-full max-w-[590px]">
            <div>
              <h1 className="whitespace-nowrap text-3xl font-medium tracking-[-0.04em] sm:text-4xl lg:text-[42px] lg:leading-[1.05] xl:text-[50px]">
                {isSignup ? "Create an account" : "Welcome back"}
              </h1>
              <p className="mt-3 whitespace-nowrap text-lg leading-snug text-black/60 dark:text-white/55 sm:text-xl lg:text-2xl xl:text-3xl">
                {isSignup ? "Brainstorm in chat, build in cowork" : "Sign in to your Brainwhite workspace."}
              </p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2">
              <SocialButton
                icon={<GoogleIcon />}
                label={isSignup ? "Sign up with Google" : "Sign in with Google"}
                onClick={isSignup ? handleGoogleSignup : handleGoogleLogin}
              />
              <SocialButton
                icon={<GitHubIcon />}
                label={isSignup ? "Sign up with GitHub" : "Sign in with GitHub"}
                onClick={isSignup ? handleGithubSignup : handleGithubLogin}
              />
            </div>

            <div className="my-10 text-center text-xl font-medium text-black/60 dark:text-white/50">
              or
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignup && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <FieldBox
                    label="First Name"
                    placeholder="John"
                    value={firstName}
                    onChange={setFirstName}
                    required
                  />
                  <FieldBox
                    label="Last Name"
                    placeholder="Doe"
                    value={lastName}
                    onChange={setLastName}
                    required
                  />
                </div>
              )}

              {isSignup && (
                <FieldBox
                  label="Organisation Name"
                  placeholder="Acme Corp"
                  value={orgName}
                  onChange={setOrgName}
                  required
                />
              )}

              <FieldBox
                label={isSignup ? "Work Email" : "Email"}
                type="email"
                placeholder={isSignup ? "you@company.com" : "you@company.com"}
                value={isSignup ? signupEmail : email}
                onChange={isSignup ? setSignupEmail : setEmail}
                required
                leftIcon={<Mail className="w-5 h-5 text-black/40 dark:text-white/40" />}
              />

              <FieldBox
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={isSignup ? signupPassword : password}
                onChange={isSignup ? setSignupPassword : setPassword}
                required
                minLength={isSignup ? 8 : undefined}
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

              {isSignup && (
                <p className="text-xs text-black/40 dark:text-white/40">Password must be at least 8 characters</p>
              )}

              {isSignup && (
                <div className="space-y-4 pt-2 text-sm leading-5 text-black/30 dark:text-white/35 sm:text-[15px]">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <span className="relative mt-1 size-4 shrink-0">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="peer size-full appearance-none rounded-[2px] border border-black/25 bg-white checked:border-black checked:bg-black dark:border-white/30 dark:bg-white/5 dark:checked:border-white dark:checked:bg-white focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
                      />
                      <svg
                        viewBox="0 0 12 12"
                        className="pointer-events-none absolute inset-0 hidden size-full p-0.5 text-white peer-checked:block dark:text-black"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M3 6.2 5 8.1 9 3.9"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span>{termsText}</span>
                  </label>
                </div>
              )}

              {error && (
                <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-sm" role="alert">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "mt-9 flex h-12 w-full items-center justify-center rounded-[10px] border font-medium text-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed",
                  isSignup
                    ? "border-black/40 bg-black text-white hover:bg-black/85 dark:border-white/40 dark:bg-white dark:text-black dark:hover:bg-white/85"
                    : "border-black/40 bg-black text-white hover:bg-black/85 dark:border-white/40 dark:bg-white dark:text-black dark:hover:bg-white/85"
                )}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {isSignup ? "Creating account…" : "Signing in…"}
                  </>
                ) : (
                  <>
                    {isSignup ? "Create account" : "Sign in"}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-12 text-center text-sm text-black/60 dark:text-white/50">
              {isSignup ? (
                <>
                  Already have an account?{" "}
                  <a
                    href="/login"
                    className="font-medium text-black/70 underline underline-offset-2 hover:text-black dark:hover:text-white transition-colors"
                  >
                    Sign in
                  </a>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{" "}
                  <a
                    href="/signup"
                    className="font-medium text-black/70 underline underline-offset-2 hover:text-black dark:hover:text-white transition-colors"
                  >
                    Create one
                  </a>
                </>
              )}
            </div>

            {!isSignup && (
              <div className="mt-6 text-center text-sm text-black/60 dark:text-white/50">
                <a
                  href="/forgot-password"
                  className="font-medium text-black/70 underline underline-offset-2 hover:text-black dark:hover:text-white transition-colors"
                >
                  Forgot password?
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="relative flex min-h-[720px] overflow-hidden rounded-md bg-black p-8 text-white sm:p-12 lg:min-h-0">
          <GrainGradient
            speed={1}
            scale={1}
            rotation={0}
            offsetX={0}
            offsetY={0}
            softness={0.5}
            intensity={0.5}
            noise={0.25}
            shape="corners"
            frame={2854.5}
            colors={["#FFFFFF", "#FC7819", "#FC7819", "#FFFFFF"]}
            colorBack="#00000000"
            className="absolute inset-0 bg-black"
          />

          <div className="relative z-10 flex h-full w-full flex-col justify-between">
            <h2 className="max-w-[620px] pt-0 text-5xl font-medium tracking-[-0.05em] text-white sm:text-6xl lg:pt-16 lg:text-[64px] lg:leading-[0.98] xl:text-[70px]">
              Think fast,<br />
              Build faster
            </h2>

            <a
              href="#"
              className="mb-0 inline-flex h-12 max-w-full items-center gap-3 rounded-[10px] border border-white/25 px-5 text-base font-medium text-white/85 backdrop-blur-sm transition-colors hover:border-white/45 hover:text-white xl:mb-32 xl:px-6 xl:text-2xl"
            >
              <WindowsIcon className="size-5 shrink-0 xl:size-7" />
              <span className="truncate whitespace-nowrap">
                Download the Windows app
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-10 items-center justify-center gap-2 rounded-[10px] border px-3 text-sm leading-none transition-colors xl:text-[19px]",
        disabled
          ? "border-black/15 bg-white/5 text-black/30 cursor-not-allowed dark:border-white/10 dark:bg-white/10 dark:text-white/30"
          : "border-black/25 bg-white text-black hover:bg-black/[0.03] dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

function FieldBox({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  required,
  minLength,
  leftIcon,
  rightIcon,
}: {
  label: string;
  placeholder?: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  minLength?: number;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}) {
  return (
    <label className="flex h-14 items-center gap-4 rounded-[10px] border border-black/25 bg-white px-5 text-lg leading-none dark:border-white/15 dark:bg-white/5 xl:text-xl">
      {leftIcon && <span className="shrink-0">{leftIcon}</span>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        required={required}
        minLength={minLength}
        className="min-w-0 flex-1 truncate bg-transparent text-black outline-none placeholder:text-black/30 dark:text-white dark:placeholder:text-white/35"
      />
      {rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853" />
      <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84Z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" fill="#EB4335" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function WindowsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M3 4.7 10.7 3.6v7.7H3V4.7Zm8.8-1.25L21 2.1v9.2h-9.2V3.45ZM3 12.7h7.7v7.7L3 19.3v-6.6Zm8.8 0H21v9.2l-9.2-1.3v-7.9Z" />
    </svg>
  );
}