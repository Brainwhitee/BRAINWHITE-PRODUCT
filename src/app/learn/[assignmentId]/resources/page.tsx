import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Shell } from "@/components/Shell";

export default async function Resources({ params }: { params: Promise<{ assignmentId: string }> }) {
  const me = await requireUser();
  const { assignmentId } = await params;
  const a = await db.assignment.findFirst({
    where: { id: assignmentId, orgId: me.orgId, ...(me.role === "CANDIDATE" ? { userId: me.id } : {}) },
    include: { path: { include: { handouts: { include: { item: true } } } } },
  });
  if (!a) notFound();
  return (
    <Shell user={me}>
      <h1 className="mb-4 text-xl font-semibold">Resources: {a.path.title}</h1>
      {a.path.handouts.length === 0 && <p className="text-sm text-slate-500">No handouts yet.</p>}
      <ul className="space-y-2 text-sm">
        {a.path.handouts.map((h) => (
          <li key={h.id} className="rounded border bg-white p-3">
            📎 <a className="text-indigo-700 underline" href={`/api/handouts/${h.id}`} target="_blank">{h.filename}</a>
            {h.mustRead && <span className="ml-2 rounded bg-red-100 px-1.5 text-xs text-red-800">must read</span>}
            <span className="ml-2 text-xs text-slate-500">{h.item ? `attached to ${h.item.title}` : "path-wide"} · {(h.size / 1024).toFixed(0)} KB</span>
          </li>
        ))}
      </ul>
    </Shell>
  );
}
