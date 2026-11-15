import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { reposForAssignment } from "@/lib/graph-map";
import { Shell } from "@/components/Shell";
import { TreeMap } from "@/components/TreeMap";

// The candidate's own view of the codebase: the same node map managers use, with their learning path numbered on it.
export default async function LearnMap({ searchParams }: { searchParams: Promise<{ a?: string; r?: string }> }) {
  const me = await requireUser();
  if (me.role === "CANDIDATE" && !me.githubUserId) redirect("/connect-github");
  const sp = await searchParams;

  const assignments = await db.assignment.findMany({ where: { userId: me.id, orgId: me.orgId }, include: { path: true }, orderBy: { startDate: "desc" } });
  const choices = (await Promise.all(assignments.map(async (a) => (await reposForAssignment(a.id)).map((r) => ({ assignmentId: a.id, repoId: r.id, repoName: r.name, pathTitle: a.path.title }))))).flat();
  const current = choices.find((c) => c.assignmentId === sp.a && (!sp.r || c.repoId === sp.r)) ?? choices[0];
  const tab = (on: boolean) => `rounded-full px-3 py-1 text-sm ${on ? "pill-on" : "border bg-white text-slate-600 hover:bg-slate-100"}`;

  return (
    <Shell user={me} wide>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Code map</h1>
          <p className="text-sm text-slate-600">The codebase as a tree: the repository holds folders, folders hold files, files hold functions. Click a node to open it; select one to see what it connects to. The numbers are the order your learning path reads the code.</p>
        </div>
        <Link href="/learn" className="text-sm text-slate-950 underline">Back to my learning</Link>
      </div>
      {!current && <p className="rounded-xl border bg-white p-4 text-sm text-slate-500">No codebase is linked to your learning path yet. Once your manager adds code lessons, the map will appear here.</p>}
      {choices.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {choices.map((c) => <Link key={c.assignmentId + c.repoId} href={`/learn/map?a=${c.assignmentId}&r=${c.repoId}`} className={tab(c === current)}>{c.repoName} · {c.pathTitle}</Link>)}
        </div>
      )}
      {current && <TreeMap repoId={current.repoId} repoName={current.repoName} assignmentId={current.assignmentId} height={720} />}
    </Shell>
  );
}
