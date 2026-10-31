import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { assignmentProgress } from "@/lib/domain/assign";
import { Shell } from "@/components/Shell";
import Card, { CardData } from "@/components/ui/course-design-cards";
import { ArrowRight, BookOpen, CheckCircle2, Clock, Sparkles } from "lucide-react";

export default async function Learn() {
  const me = await requireUser();
  // Candidates cannot enter the app until GitHub is linked (PLT-03)
  if (me.role === "CANDIDATE" && !me.githubUserId) redirect("/connect-github");
  if (me.role === "OWNER" || me.role === "MANAGER" || me.role === "MENTOR") redirect("/paths");

  const assignments = await db.assignment.findMany({
    where: { userId: me.id },
    include: {
      path: true,
      tasks: { include: { task: true }, orderBy: { dueAt: "asc" } },
      progress: { orderBy: { ts: "desc" }, take: 1 },
    },
  });
  const rows = await Promise.all(assignments.map(async (a) => ({ a, p: await assignmentProgress(a.id) })));

  const stockAvatars = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces",
  ];

  return (
    <Shell user={me}>
      {/* Header Greeting */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight">
            Hi, {me.name}
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            GitHub linked as{" "}
            <span className="font-semibold text-slate-900">@{me.githubUsername}</span>. Your active learning journey:
          </p>
        </div>
      </div>

      {rows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center bg-white shadow-xs">
          <BookOpen className="mx-auto size-10 text-slate-400 mb-3" />
          <h3 className="font-semibold text-slate-900 text-lg">No Learning Paths Assigned Yet</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            Your team leads or managers haven&apos;t assigned an onboarding track yet. Once assigned, your courses and tasks will appear here.
          </p>
        </div>
      )}

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {rows.map(({ a, p }, index) => {
          const nextItem = p.items.find((i) => i.mandatory && !p.done.has(i.id));
          const lastItem = a.progress[0]?.itemId;
          const upcoming = a.tasks.filter((t) => t.status !== "DONE").slice(0, 3);

          const color =
            p.pct >= 75 ? "green" : p.pct >= 40 ? "blue" : p.pct > 0 ? "orange" : "red";

          const cardData: CardData = {
            id: a.id,
            colorClass: color,
            date: a.startDate
              ? new Date(a.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : "Ongoing Track",
            title: a.path.title,
            description: a.path.description || (a.path.role ? `Role: ${a.path.role}` : "Engineering Readiness Track"),
            progressPercent: `${p.pct}%`,
            progressValue: `${p.pct}%`,
            imgSrc1: stockAvatars[index % stockAvatars.length],
            imgAlt1: "Mentor",
            imgSrc2: me.githubUsername
              ? `https://github.com/${me.githubUsername}.png`
              : stockAvatars[(index + 1) % stockAvatars.length],
            imgAlt2: me.name,
            countdownText:
              upcoming.length > 0 ? `${upcoming.length} task${upcoming.length > 1 ? "s" : ""} due` : "Up to date",
            href: `/learn/${a.id}/${nextItem?.id ?? lastItem ?? ""}`,
          };

          return (
            <div key={a.id} className="flex flex-col gap-3">
              <Card data={cardData} />

              {/* Action Bar for the Course */}
              <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <div className="text-slate-600 text-xs font-medium">
                    {p.completed} of {p.total} mandatory milestones completed
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      href={`/learn/${a.id}`}
                    >
                      Outline
                    </Link>
                    {(lastItem || nextItem) && (
                      <Link
                        className="px-3 py-1.5 rounded-lg bg-black text-white text-xs font-semibold hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5"
                        href={`/learn/${a.id}/${nextItem?.id ?? lastItem}`}
                      >
                        <span>{lastItem ? "Continue" : "Start Track"}</span>
                        <ArrowRight className="size-3" />
                      </Link>
                    )}
                    <Link
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      href={`/learn/${a.id}/resources`}
                    >
                      Resources
                    </Link>
                  </div>
                </div>

                {upcoming.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      <span>Upcoming Deadlines</span>
                    </div>
                    <ul className="space-y-1 text-xs">
                      {upcoming.map((t) => (
                        <li key={t.id} className="flex items-center justify-between py-0.5">
                          <Link className="font-medium text-slate-800 hover:underline truncate max-w-[240px]" href={`/tasks/${t.id}`}>
                            {t.task.title}
                          </Link>
                          <span className="text-slate-500 text-[11px]">
                            due {t.dueAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
