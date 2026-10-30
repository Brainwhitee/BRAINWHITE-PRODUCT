import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { Shell } from "@/components/Shell";
import { GraphExplorer } from "@/components/GraphExplorer";

export default async function RepoGraphPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requirePermission("codebase:view");
  const { id } = await params;
  const repo = await db.repository.findFirst({ where: { id, orgId: me.orgId }, select: { id: true, name: true } });
  if (!repo) notFound();
  return (
    <Shell user={me} wide>
      <p className="text-xs text-slate-500"><Link href={`/projects/repos/${repo.id}`} className="underline">{repo.name}</Link> / graph</p>
      <h1 className="mb-4 text-xl font-semibold">Architecture graph</h1>
      <GraphExplorer repoId={repo.id} />
    </Shell>
  );
}
