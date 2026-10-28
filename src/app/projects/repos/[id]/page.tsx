import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { isAiConfigured } from "@/lib/ai";
import { Shell } from "@/components/Shell";
import { AutoRefresh } from "@/components/AutoRefresh";
import { disconnectRepo, syncNow } from "../../../actions";

export default async function RepoPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requirePermission("codebase:view");
  const { id } = await params;
  const repo = await db.repository.findFirst({
    where: { id, orgId: me.orgId },
    include: {
      project: true,
      syncRuns: { orderBy: { startedAt: "desc" }, take: 5 },
      modules: { orderBy: { path: "asc" }, include: { chunks: { orderBy: [{ filePath: "asc" }, { startLine: "asc" }] }, _count: { select: { files: true } } } },
    },
  });
  if (!repo) notFound();
  const run = repo.syncRuns[0];
  const edges = await db.graphEdge.findMany({ where: { repoId: id, type: "DEPENDS_ON" } });
  const modName = new Map(repo.modules.map((m) => [m.id, m.name]));
  const langs = Object.entries(JSON.parse(repo.languages) as Record<string, number>).sort((a, b) => b[1] - a[1]);
  const running = repo.syncStatus === "RUNNING";
  const manage = can(me.role, "codebase:manage");

  return (
    <Shell user={me}>
      {running && <AutoRefresh />}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500">{repo.project.name}</p>
          <h1 className="text-xl font-semibold">{repo.name}</h1>
          <p className="text-sm text-slate-500">
            {repo.source}: {repo.location} @ {repo.branch}
            {repo.lastSyncedSha && <> · <code>{repo.lastSyncedSha.slice(0, 8)}</code></>}
          </p>
        </div>
        {manage && (
          <div className="flex gap-3 text-sm">
            <form action={syncNow}>
              <input type="hidden" name="id" value={repo.id} />
              <button disabled={running} className="rounded-md bg-indigo-600 px-3 py-1.5 text-white disabled:opacity-50">Sync now</button>
            </form>
            <form action={disconnectRepo}>
              <input type="hidden" name="id" value={repo.id} />
              <button className="text-red-600 underline">Disconnect</button>
            </form>
          </div>
        )}
      </div>

      {run && (
        <section className="mb-6 rounded-lg border bg-white p-4 text-sm">
          <div className="mb-1 font-medium">
            Status: {repo.syncStatus}{running && ` — ${run.progress}…`}
          </div>
          {run.error && <p className="text-red-600">{run.error}</p>}
          <p className="text-slate-600">
            {run.filesSeen} files seen · {run.filesParsed} parsed · {run.filesSkipped} skipped · {run.secretsRedacted} secrets redacted · {run.summariesGenerated} LLM summaries
            {!isAiConfigured() && " (no AI key set: heuristic summaries)"}
          </p>
          {langs.length > 0 && <p className="text-slate-600">Languages: {langs.map(([l, n]) => `${l} ${n}`).join(" · ")}</p>}
        </section>
      )}

      {repo.summary && <p className="mb-6 text-sm text-slate-700">{repo.summary}</p>}

      {edges.length > 0 && (
        <section className="mb-6 text-sm">
          <h2 className="mb-1 font-medium">Module dependencies</h2>
          <ul className="list-disc pl-5 text-slate-600">
            {edges.map((e) => (
              <li key={e.id}>{modName.get(e.fromId)} → {modName.get(e.toId)}</li>
            ))}
          </ul>
        </section>
      )}

      <h2 className="mb-2 font-medium">Modules and learning chunks</h2>
      <div className="space-y-3">
        {repo.modules.map((m) => (
          <details key={m.id} className="rounded-lg border bg-white p-3" open={repo.modules.length <= 3}>
            <summary className="cursor-pointer font-medium">
              {m.name} <span className="text-xs font-normal text-slate-500">{m.path} · {m._count.files} files · {m.chunks.length} chunks</span>
            </summary>
            {m.summary && <p className="mt-2 text-sm text-slate-600">{m.summary}</p>}
            <ul className="mt-2 divide-y text-sm">
              {m.chunks.map((c) => (
                <li key={c.id} className="py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{c.title}</span>
                    <span className="rounded bg-slate-100 px-1.5 text-xs">{c.difficulty.toLowerCase()}</span>
                    <span className="text-xs text-slate-500">~{c.estMinutes} min</span>
                    {c.status !== "ACTIVE" && <span className="rounded bg-amber-100 px-1.5 text-xs text-amber-800">{c.status.toLowerCase()}</span>}
                  </div>
                  <div className="text-xs text-slate-500">{c.filePath}:{c.startLine}-{c.endLine}</div>
                  <p className="text-slate-600">{c.summary}</p>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </Shell>
  );
}
