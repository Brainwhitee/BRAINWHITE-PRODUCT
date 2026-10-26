import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { ActionForm, inputCls } from "@/components/ActionForm";
import { addRepository } from "../actions";

const badge: Record<string, string> = {
  HEALTHY: "bg-green-100 text-green-800",
  RUNNING: "bg-blue-100 text-blue-800",
  FAILED: "bg-red-100 text-red-800",
  PENDING: "bg-slate-100 text-slate-700",
};

export default async function Projects() {
  const me = await requirePermission("codebase:view");
  const projects = await db.project.findMany({
    where: { orgId: me.orgId },
    include: { repos: true },
    orderBy: { createdAt: "desc" },
  });
  const local = process.env.ALLOW_LOCAL_REPOS === "true";

  return (
    <Shell user={me}>
      <h1 className="mb-4 text-xl font-semibold">Codebase</h1>

      {can(me.role, "codebase:manage") && (
        <section className="mb-8 rounded-lg border bg-white p-4">
          <h2 className="mb-1 font-medium">Connect a repository</h2>
          <p className="mb-3 text-xs text-slate-500">
            Public GitHub repos work now (owner/name). Private repos need a GitHub App or GITHUB_TOKEN on the server.
          </p>
          <ActionForm action={addRepository} submit="Connect and analyse" className="flex flex-wrap items-start gap-2">
            <input name="projectName" placeholder="Project name" className={inputCls + " !w-44"} required />
            <select name="source" className={inputCls + " !w-36"} defaultValue="github">
              <option value="github">GitHub</option>
              {local && <option value="local">Local folder</option>}
            </select>
            <input name="location" placeholder="owner/name or folder path" className={inputCls + " !w-64"} required />
            <input name="branch" placeholder="main" className={inputCls + " !w-24"} />
          </ActionForm>
        </section>
      )}

      {projects.length === 0 && <p className="text-sm text-slate-500">No repositories connected yet.</p>}
      {projects.map((p) => (
        <section key={p.id} className="mb-4 rounded-lg border bg-white p-4">
          <h2 className="mb-2 font-medium">{p.name}</h2>
          <ul className="space-y-1 text-sm">
            {p.repos.map((r) => (
              <li key={r.id} className="flex items-center gap-3">
                <Link className="text-indigo-700 underline" href={`/projects/repos/${r.id}`}>{r.name}</Link>
                <span className={`rounded px-2 py-0.5 text-xs ${badge[r.syncStatus]}`}>{r.syncStatus}</span>
                <span className="text-slate-500">{r.source}: {r.location}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </Shell>
  );
}
