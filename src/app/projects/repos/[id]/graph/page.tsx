import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { Shell } from "@/components/Shell";
import { GraphExplorer } from "@/components/GraphExplorer";
import { TreeMap } from "@/components/TreeMap";

export default async function RepoGraphPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ view?: string }> }) {
  const me = await requirePermission("codebase:view");
  const { id } = await params;
  const { view } = await searchParams;
  const repo = await db.repository.findFirst({ where: { id, orgId: me.orgId }, select: { id: true, name: true } });
  if (!repo) notFound();
  const mode = view === "drill" ? "drill" : "tree"; // tree = folders -> files -> functions (default)
  const tab = (active: boolean) => `rounded-full px-3 py-1 text-sm ${active ? "pill-on" : "border bg-white text-slate-600 hover:bg-slate-100"}`;
  return (
    <Shell user={me} wide>
      <p className="text-xs text-slate-500"><Link href={`/projects/repos/${repo.id}`} className="underline">{repo.name}</Link> / graph</p>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Architecture graph</h1>
        <div className="flex gap-2">
          <Link href={`/projects/repos/${repo.id}/graph`} className={tab(mode === "tree")}>Tree</Link>
          <Link href={`/projects/repos/${repo.id}/graph?view=drill`} className={tab(mode === "drill")}>Drill-down</Link>
        </div>
      </div>
      {mode === "drill" ? <GraphExplorer repoId={repo.id} /> : <TreeMap repoId={repo.id} repoName={repo.name} height={680} />}
    </Shell>
  );
}
