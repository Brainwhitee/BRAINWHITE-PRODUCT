import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { assignmentProgress } from "@/lib/domain/assign";
import { Shell } from "@/components/Shell";

export default async function Outline({ params }: { params: Promise<{ assignmentId: string }> }) {
  const me = await requireUser();
  const { assignmentId } = await params;
  const a = await db.assignment.findFirst({
    where: { id: assignmentId, orgId: me.orgId, ...(me.role === "CANDIDATE" ? { userId: me.id } : {}) },
    include: { path: { include: { sections: { orderBy: { order: "asc" }, include: { items: { orderBy: { order: "asc" } } } } } } },
  });
  if (!a) notFound();
  const p = await assignmentProgress(a.id);
  const chunkIds = a.path.sections.flatMap((s) => s.items.map((i) => i.refId)).filter(Boolean) as string[];
  const chunks = new Map((await db.chunk.findMany({ where: { id: { in: chunkIds } } })).map((c) => [c.id, c]));

  return (
    <Shell user={me}>
      <h1 className="text-xl font-semibold">{a.path.title}</h1>
      <p className="mb-4 text-sm text-slate-500">{p.pct}% complete · started {a.startDate.toDateString()}</p>
      {a.path.sections.map((s) => (
        <section key={s.id} className="mb-4 rounded-lg border bg-white p-4">
          <h2 className="mb-2 font-medium">{s.title}</h2>
          <ul className="divide-y text-sm">
            {s.items.map((i) => {
              const c = i.refId ? chunks.get(i.refId) : null;
              const done = p.done.has(i.id);
              const due = i.dueDay ? new Date(a.startDate.getTime() + i.dueDay * 86400_000) : null;
              return (
                <li key={i.id} className="flex items-center justify-between py-2">
                  <Link href={`/learn/${a.id}/${i.id}`} className="hover:underline">
                    {done ? "✅" : "⬜"} {i.title}
                    {c?.status === "UPDATED" && <span className="ml-2 rounded bg-amber-100 px-1.5 text-xs text-amber-800">code changed</span>}
                  </Link>
                  <span className="text-xs text-slate-500">
                    {c ? `~${c.estMinutes} min · ` : ""}{i.mandatory ? "mandatory" : "optional"}
                    {due && ` · due ${due.toDateString()}`}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </Shell>
  );
}
