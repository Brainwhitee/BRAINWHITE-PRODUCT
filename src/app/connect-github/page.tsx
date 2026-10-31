import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { linkGithubDev } from "../actions";
import { ActionForm, btnCls, inputCls } from "@/components/ActionForm";

export default async function ConnectGithub({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const me = await requireUser();
  if (me.githubUserId) redirect("/learn");
  const { error } = await searchParams;
  const oauth = Boolean(process.env.GITHUB_CLIENT_ID);

  return (
    <div className="mx-auto mt-16 max-w-md space-y-4">
      <h1 className="text-xl font-semibold">Connect your GitHub account</h1>
      <p className="text-sm text-slate-600">
        This step is required. We use your GitHub identity to attribute your commits and pull requests in{" "}
        <b>{me.org.name}</b>&apos;s repositories to you.
      </p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
        <li>Tracked: commits, PRs, reviews and CI status in company repos only.</li>
        <li>Not tracked: your personal repositories or private activity.</li>
        <li>We request identity-only permissions (read:user, user:email).</li>
      </ul>
      {error && <p className="text-sm text-red-600">GitHub connection failed ({error}). Please try again.</p>}
      {oauth ? (
        <a href="/api/auth/github/start?mode=link" className={btnCls + " inline-block"}>Continue with GitHub</a>
      ) : (
        <div className="space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3">
          <p className="text-xs text-amber-800">
            Dev mode: GITHUB_CLIENT_ID is not set, so enter your username manually.
          </p>
          <ActionForm action={linkGithubDev} submit="Link GitHub">
            <input name="username" placeholder="GitHub username" className={inputCls} required />
          </ActionForm>
        </div>
      )}
    </div>
  );
}
