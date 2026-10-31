import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { ActionForm, inputCls } from "@/components/ActionForm";
import { addRepository } from "../actions";
import {
  FolderGit2,
  GitBranch,
  Plus,
  ArrowRight,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from "lucide-react";

export default async function Projects() {
  const me = await requirePermission("codebase:view");
  const projects = await db.project.findMany({
    where: { orgId: me.orgId },
    include: {
      repos: {
        include: {
          _count: { select: { modules: true, files: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  const local = process.env.ALLOW_LOCAL_REPOS === "true";


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

      {/* 2. Connect Repository Section */}
      {can(me.role, "codebase:manage") && (
        <section className="mb-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Plus className="size-4 text-slate-700" />
            <h2 className="font-bold text-slate-900 text-sm">Connect New Repository</h2>
          </div>
          <p className="mb-3 text-xs text-slate-500">
            Enter the public GitHub repo (<code>owner/name</code>) or connect a local directory in development mode.
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
