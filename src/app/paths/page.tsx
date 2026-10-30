import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { ActionForm, inputCls } from "@/components/ActionForm";
import { createPath } from "./actions";
import Card, { CardData } from "@/components/ui/course-design-cards";
import { Plus, Compass, BookOpen, Layers } from "lucide-react";

const COLORS = ["blue", "green", "orange", "red"];

const stockAvatars = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces",
];

export default async function Paths() {
  const me = await requirePermission("members:view");
  const paths = await db.learningPath.findMany({
    where: { orgId: me.orgId },
    include: {
      sections: { include: { _count: { select: { items: true } } } },
      _count: { select: { assignments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Shell user={me}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight">Learning Paths & Tracks</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Structured onboarding curricula and technical tracks for your engineering team.
          </p>
        </div>
      </div>

      {can(me.role, "paths:manage") && (
        <section className="mb-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Plus className="size-4 text-slate-700" />
            <h2 className="font-bold text-slate-900 text-sm">Create New Learning Track</h2>
          </div>
          <ActionForm action={createPath} submit="Create Track" className="flex flex-wrap items-start gap-2.5">
            <input
              name="title"
              placeholder="e.g. Backend Onboarding: Core Services & Kafka"
              className={inputCls + " !w-80"}
              required
            />
            <input
              name="role"
              placeholder="Target role (e.g. Senior Backend)"
              className={inputCls + " !w-56"}
            />
            <select name="type" className={inputCls + " !w-44"}>
              <option value="NEW_JOINEE">New Joinee</option>
              <option value="NEW_PROJECT">New Project Track</option>
            </select>
          </ActionForm>
        </section>
      )}

      {paths.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center bg-white shadow-xs">
          <Compass className="mx-auto size-10 text-slate-400 mb-3" />
          <h3 className="font-semibold text-slate-900 text-lg">No Learning Paths Yet</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            Connect a repository under Codebase first to generate graphs, or create your first onboarding path above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paths.map((p, idx) => {
            const totalModules = p.sections.reduce((n, s) => n + s._count.items, 0);
            const colorClass = COLORS[idx % COLORS.length];

            const cardData: CardData = {
              id: p.id,
              colorClass,
              date: `v${p.version} · ${p.type.replace(/_/g, " ").toLowerCase()}`,
              title: p.title,
              description: p.role ? `Role: ${p.role} · ${totalModules} items` : `${totalModules} modules curated`,
              progressPercent: p.status === "PUBLISHED" ? "100%" : "60%",
              progressValue: `${p._count.assignments} assigned`,
              imgSrc1: stockAvatars[idx % stockAvatars.length],
              imgAlt1: "Engineer 1",
              imgSrc2: stockAvatars[(idx + 1) % stockAvatars.length],
              imgAlt2: "Engineer 2",
              countdownText: p.status.toLowerCase(),
              href: `/paths/${p.id}`,
            };

            return (
              <div key={p.id} className="flex flex-col gap-2">
                <Card data={cardData} />
                <div className="flex items-center justify-between px-2 text-xs text-slate-500">
                  <span>{totalModules} syllabus items</span>
                  <Link
                    href={`/paths/${p.id}`}
                    className="font-semibold text-slate-900 hover:underline flex items-center gap-1"
                  >
                    <span>View track outline</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Shell>
  );
}
