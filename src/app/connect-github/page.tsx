import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { linkGithubManual } from "../actions";
import { ActionForm, inputCls } from "@/components/ActionForm";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { ExperienceFooter } from "@/components/experience/footer";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

const errorMessages: Record<string, string> = {
  github_state_invalid:
    "Your browser or in-app webview dropped the security cookie during redirect. Try again or enter your GitHub handle below.",
  github_token_failed:
    "GitHub authorization code exchange failed. You can connect seamlessly using your username below.",
  unauthorized:
    "Session was interrupted during redirect. Please enter your GitHub handle below to complete setup.",
  github_not_configured:
    "OAuth is not configured on this environment. Please enter your GitHub handle below.",
};

export default async function ConnectGithub({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; error_description?: string }>;
}) {
  const me = await requireUser();
  if (me.githubUserId) redirect("/learn");
  const { error, error_description } = await searchParams;
  const oauth = Boolean(process.env.GITHUB_CLIENT_ID);
  let friendlyError = error ? (errorMessages[error] || `Connection attempt failed (${error}).`) : null;
  if (friendlyError && error_description) {
    friendlyError = `${friendlyError} Details: ${error_description}`;
  }

  return (
    <main className="min-h-screen bg-white text-neutral-900 selection:bg-neutral-900 selection:text-white flex flex-col justify-between">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 sm:py-24 max-w-lg mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-neutral-950 text-white flex items-center justify-center mx-auto mb-4 shadow-sm">
            <GitHubIcon className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-neutral-950">
            Connect Your GitHub
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-neutral-600 font-sans max-w-sm mx-auto leading-relaxed">
            Link your identity so your pull requests, code reviews, and milestone tasks in{" "}
            <span className="font-semibold text-neutral-900">{me.org.name}</span> are attributed directly to you.
          </p>
        </div>

        {/* Error Alert if any */}
        {friendlyError && (
          <div className="w-full mb-6 p-4 rounded-2xl border border-red-200 bg-red-50 text-red-800 text-xs font-sans flex items-start gap-3 shadow-2xs">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{friendlyError}</div>
          </div>
        )}

        {/* Main Action Card */}
        <div className="w-full bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-[0_10px_35px_rgba(0,0,0,0.05)] space-y-6">
          {/* 1. Primary One-Click OAuth */}
          {oauth && (
            <div className="space-y-3">
              <a
                href="/api/auth/github/start?mode=link"
                className="w-full py-3.5 px-4 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 shadow-sm"
              >
                <GitHubIcon className="w-4 h-4" />
                <span>Authorize with GitHub (1-Click)</span>
              </a>
              <p className="text-[11px] text-neutral-500 text-center font-sans">
                Identity-only permission (<code className="text-neutral-700">read:user</code>). No personal repository access.
              </p>
            </div>
          )}

          {oauth && (
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <span className="relative bg-white px-3 text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                Or Link via Username
              </span>
            </div>
          )}

          {/* 2. Resilient Manual Username Input (Always Available) */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label
                htmlFor="username"
                className="text-xs font-mono font-medium uppercase tracking-wider text-neutral-700 block"
              >
                GitHub Username
              </label>
              <ActionForm action={linkGithubManual} submit="Link Username & Start">
                <input
                  id="username"
                  name="username"
                  placeholder="e.g. octocat or @octocat"
                  className={inputCls + " text-sm"}
                  required
                />
              </ActionForm>
            </div>
            <p className="text-[11px] text-neutral-500 font-sans leading-relaxed">
              We check your handle against GitHub to ensure milestone PRs and commits are credited to you.
            </p>
          </div>

          {/* Privacy Checklist */}
          <div className="pt-4 border-t border-neutral-100 space-y-2 text-xs text-neutral-600 font-sans">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
              <span>Tracked: commits &amp; PRs in company repositories only</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
              <span>Never tracked: personal repositories or private activity</span>
            </div>
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
