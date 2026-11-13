import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { ActionForm, inputCls } from "@/components/ActionForm";
import { addRepository, disconnectGithubApp, saveCustomGithubPat } from "../actions";
import {
  FolderGit2,
  GitBranch,
  Plus,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  Unlink,
} from "lucide-react";

interface ProjectsProps {
  searchParams?: Promise<{ installed?: string }>;
}

export default async function Projects({ searchParams }: ProjectsProps) {
  const me = await requirePermission("codebase:view");
  const params = searchParams ? await searchParams : undefined;
  const justInstalled = params?.installed === "true";

  const [org, projects] = await Promise.all([
    db.organisation.findUniqueOrThrow({ where: { id: me.orgId } }),
    db.project.findMany({
      where: { orgId: me.orgId },
      include: {
        repos: {
          include: {
            _count: { select: { modules: true, files: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const local = process.env.ALLOW_LOCAL_REPOS === "true";
  const canManage = can(me.role, "codebase:manage");
  const appSlug = process.env.GITHUB_APP_SLUG || "brainwhite";
  const installUrl = `https://github.com/apps/${appSlug}/installations/new`;

  return (
    <Shell user={me}>
      {/* 1. Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-950 tracking-tight">Codebase & Repositories</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Connected repositories, automated AST architecture graphs, and modular learning chunks.
          </p>
        </div>
      </div>

      {/* Installation Success Banner */}
      {justInstalled && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-xs text-emerald-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span className="font-medium">
              BrainWhite GitHub App successfully installed! Repositories in your organization can now be synchronized.
            </span>
          </div>
          <Link href="/projects" className="font-semibold text-emerald-700 hover:text-emerald-950 underline underline-offset-2">
            Dismiss
          </Link>
        </div>
      )}

      {/* GitHub Organization Integration */}
      {canManage && (
        <section className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <svg className="size-4.5 text-slate-900" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <h2 className="font-bold text-slate-950 text-sm">GitHub Organization Integration</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Authenticate repository tarball downloads, AST architecture graph extraction, and candidate PR scoring.
              </p>
            </div>

            {org.githubInstallationId ? (
              <div className="flex items-center gap-2">
                <a
                  href={`https://github.com/settings/installations/${org.githubInstallationId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span>Configure Repos</span>
                  <ExternalLink className="size-3 text-slate-400" />
                </a>
                <form action={disconnectGithubApp}>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/60 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
                  >
                    <Unlink className="size-3" />
                    <span>Disconnect</span>
                  </button>
                </form>
              </div>
            ) : (
              <a
                href={installUrl}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black transition-colors shadow-2xs"
              >
                <ShieldCheck className="size-3.5 text-emerald-400" />
                <span>Connect GitHub Organization</span>
              </a>
            )}
          </div>

          <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`size-2.5 rounded-full ${org.githubInstallationId ? "bg-emerald-500 ring-4 ring-emerald-100" : "bg-amber-400 ring-4 ring-amber-100"}`} />
              <div>
                <p className="text-xs font-bold text-slate-900">
                  {org.githubInstallationId
                    ? `Connected: ${org.githubOrgName || "Installed Organization"} (Installation #${org.githubInstallationId})`
                    : "No GitHub App Installed"}
                </p>
                <p className="text-[11px] text-slate-500">
                  {org.githubInstallationId
                    ? "Automatic multi-tenant access tokens are generated on-demand."
                    : "Install the BrainWhite GitHub App for seamless 1-click access to private repositories."}
                </p>
              </div>
            </div>

            {/* Manual PAT Fallback Section */}
            <div className="text-right">
              <details className="group inline-block text-left">
                <summary className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer select-none">
                  <KeyRound className="size-3 text-slate-400" />
                  <span>{org.githubTokenEnc ? "Custom PAT Active (Edit)" : "Use Personal Access Token"}</span>
                </summary>
                <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl w-80 shadow-md">
                  <p className="text-[11px] text-slate-500 mb-2">
                    Fallback token for private repositories when a GitHub App cannot be installed. Leave blank to clear.
                  </p>
                  <ActionForm action={saveCustomGithubPat} submit={org.githubTokenEnc ? "Update PAT" : "Save PAT"}>
                    <input
                      name="token"
                      type="password"
                      placeholder={org.githubTokenEnc ? "••••••••••••••••••••" : "ghp_... or github_pat_..."}
                      className={inputCls + " text-xs"}
                    />
                  </ActionForm>
                </div>
              </details>
            </div>
          </div>
        </section>
      )}

      {/* 2. Connect Repository Section */}
      {canManage && (
        <section className="mb-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Plus className="size-4 text-slate-700" />
            <h2 className="font-bold text-slate-900 text-sm">Connect New Repository</h2>
          </div>
          <p className="mb-3 text-xs text-slate-500">
            Enter the public or organization GitHub repo (<code>owner/name</code>) or connect a local directory in development mode.
          </p>
          <ActionForm action={addRepository} submit="Connect & Sync" className="flex flex-wrap items-start gap-2.5">
            <input
              name="projectName"
              placeholder="Project name (e.g. Core Platform)"
              className={inputCls + " !w-56"}
              required
            />
            <select name="source" className={inputCls + " !w-36"} defaultValue="github">
              <option value="github">GitHub</option>
              {local && <option value="local">Local folder</option>}
            </select>
            <input
              name="location"
              placeholder="owner/name (e.g. facebook/react)"
              className={inputCls + " !w-64"}
              required
            />
            <input name="branch" placeholder="main" className={inputCls + " !w-24"} />
          </ActionForm>
        </section>
      )}

      {/* 3. Empty State */}
      {projects.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center bg-white shadow-xs">
          <FolderGit2 className="mx-auto size-10 text-slate-400 mb-3" />
          <h3 className="font-semibold text-slate-900 text-base">No Repositories Connected</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Connect your primary GitHub repository above to automatically map dependencies and generate onboarding chunks.
          </p>
        </div>
      )}

      {/* 4. Connected Projects & Repositories Grid */}
      <div className="space-y-6">
        {projects.map((p) => (
          <div key={p.id} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FolderGit2 className="size-4 text-slate-700" />
                <h2 className="font-bold text-slate-950 text-base">{p.name}</h2>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {p.repos.length} {p.repos.length === 1 ? "repository" : "repositories"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {p.repos.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 hover:border-black hover:bg-white transition-all shadow-2xs group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 truncate">
                        <GitBranch className="size-4 text-slate-500 shrink-0" />
                        <span className="font-bold text-slate-900 text-sm truncate">{r.name}</span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium capitalize shrink-0">
                        {r.syncStatus.toLowerCase()}
                      </span>
                    </div>

                    <div className="text-xs font-mono text-slate-500 mb-3 truncate">
                      {r.source}: {r.location} @ {r.branch}
                    </div>

                    {r.summary ? (
                      <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                        {r.summary}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic mb-3">
                        {r.syncStatus === "RUNNING"
                          ? "Generating architecture graph and summaries..."
                          : "No summary generated yet."}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-3">
                      <span>{r._count.modules} modules</span>
                      <span>·</span>
                      <span>{r._count.files} files</span>
                    </div>
                    <Link
                      href={`/projects/repos/${r.id}`}
                      className="inline-flex items-center gap-1 font-bold text-slate-900 group-hover:text-indigo-600 transition-colors"
                    >
                      <span>Explore</span>
                      <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}
