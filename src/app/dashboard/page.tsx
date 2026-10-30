import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { computeMetrics } from "@/lib/domain/metrics";
import { Shell } from "@/components/Shell";
import { runJobsNow } from "../people/actions";
import Card, { CardData } from "@/components/ui/course-design-cards";
import {
  Users,
  Rocket,
  AlertTriangle,
  MailCheck,
  CheckCircle2,
  GitPullRequest,
  Clock,
  ArrowRight,
  TrendingUp,
  Activity,
  Sparkles,
  ShieldAlert,
  Play,
  Layers,
} from "lucide-react";

const COLORS = ["blue", "green", "orange", "red"];

const stockAvatars = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces",
];

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ path?: string; risk?: string }>;
}) {
  const me = await requirePermission("members:view");
  const sp = await searchParams;

  const [members, pending, assignments, paths, usersList] = await Promise.all([
    db.user.count({ where: { orgId: me.orgId, status: "ACTIVE" } }),
    db.invitation.count({ where: { orgId: me.orgId, status: "PENDING" } }),
    db.assignment.findMany({
      where: { orgId: me.orgId, status: "ACTIVE", ...(sp.path ? { pathId: sp.path } : {}) },
      include: { path: true },
      orderBy: { startDate: "desc" },
    }),
    db.learningPath.findMany({ where: { orgId: me.orgId }, include: { sections: true } }),
    db.user.findMany({ where: { orgId: me.orgId } }),
  ]);

  const userMap = new Map(usersList.map((u) => [u.id, u]));
  const now = new Date();
  const rows = await Promise.all(
    assignments.map(async (a) => ({
      a,
      m: await computeMetrics(a.id, new Date(now.getTime() - 7 * 86400_000), now),
    }))
  );

  const shown = sp.risk === "1" ? rows.filter((r) => r.m.overall.riskFlags.length) : rows;
  const atRisk = rows.filter((r) => r.m.overall.riskFlags.length).length;

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <Shell user={me} wide>
      {/* 1. TOP HEADER & WORKSPACE BANNER */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Operations Center
            </span>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Realtime Active
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight">
            Engineering Onboarding Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor active developer cohorts, path progress, PR quality scores, and risk alerts.
          </p>
        </div>

        {can(me.role, "paths:manage") && (
          <form action={runJobsNow}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-slate-800 transition-all duration-150 shadow-xs hover:scale-102 cursor-pointer"
              title="Trigger automated deadline reminders, weekly summaries, and risk audits"
            >
              <Play className="size-3.5 fill-current" />
              <span>Run Background Jobs Now</span>
            </button>
          </form>
        )}
      </div>

      {/* 2. STATISTIC METRIC CARDS (Inspired by 21st.dev statistics-card-2 / bento) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Metric 1: Active Members */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users className="size-5" />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/50">
              <TrendingUp className="size-3" />
              <span>Verified</span>
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-950 tracking-tight">{members}</div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">Active Team Members</div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Engineering Org</span>
            <span className="font-semibold text-slate-700">{userMap.size} total accounts</span>
          </div>
        </div>

        {/* Metric 2: Active Onboardings */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Rocket className="size-5" />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/50">
              In Flight
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-950 tracking-tight">{rows.length}</div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">Active Onboardings</div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Assigned paths</span>
            <span className="font-semibold text-slate-700">{paths.length} available</span>
          </div>
        </div>

        {/* Metric 3: At Risk */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              atRisk > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
            }`}>
              {atRisk > 0 ? <AlertTriangle className="size-5" /> : <CheckCircle2 className="size-5" />}
            </div>
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              atRisk > 0
                ? "bg-red-50 text-red-700 border-red-200/60"
                : "bg-emerald-50 text-emerald-700 border-emerald-200/60"
            }`}>
              {atRisk > 0 ? "Needs Attention" : "Optimal"}
            </span>
          </div>
          <div className="mt-4">
            <div className={`text-3xl font-black tracking-tight ${atRisk > 0 ? "text-red-600" : "text-slate-950"}`}>
              {atRisk}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">Candidates At Risk</div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Risk threshold</span>
            <Link href="/dashboard?risk=1" className="font-semibold text-indigo-700 hover:underline">
              Filter at risk →
            </Link>
          </div>
        </div>

        {/* Metric 4: Pending Invites */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <MailCheck className="size-5" />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/50">
              Invitations
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-950 tracking-tight">{pending}</div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">Pending Invitations</div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Candidate queue</span>
            <Link href="/team" className="font-semibold text-indigo-700 hover:underline">
              Manage team →
            </Link>
          </div>
        </div>
      </div>

      {/* 3. ACTIVE TRACKS SHOWCASE (Course Cards Component Integration) */}
      {paths.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-slate-700" />
              <h2 className="font-bold text-slate-950 text-base">Active Onboarding Tracks</h2>
            </div>
            <Link href="/paths" className="text-xs font-semibold text-indigo-700 hover:underline flex items-center gap-1">
              <span>View all tracks</span>
              <span>→</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paths.slice(0, 3).map((p, idx) => {
              const totalModules = p.sections ? p.sections.length : 0;
              const activeCount = rows.filter((r) => r.a.pathId === p.id).length;
              const cardData: CardData = {
                id: p.id,
                colorClass: COLORS[idx % COLORS.length],
                date: `v${p.version} · ${p.type.replace(/_/g, " ").toLowerCase()}`,
                title: p.title,
                description: p.role ? `Role: ${p.role}` : "Core Curriculum Track",
                progressPercent: p.status === "PUBLISHED" ? "100%" : "50%",
                progressValue: `${activeCount} in progress`,
                countdownText: `${p.status.toLowerCase()}`,
                imgSrc1: stockAvatars[idx % stockAvatars.length],
                imgAlt1: "Mentor 1",
                imgSrc2: stockAvatars[(idx + 1) % stockAvatars.length],
                imgAlt2: "Mentor 2",
                href: `/paths/${p.id}`,
              };
              return <Card key={p.id} data={cardData} />;
            })}
          </div>
        </div>
      )}

      {/* 4. ONBOARDINGS CANDIDATE TABLE (Inspired by 21st.dev table11 / leaderboard-card) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {/* Table Toolbar & Filters */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-slate-700" />
            <h2 className="font-bold text-slate-950 text-base">Cohort Performance & Progress</h2>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Link
              href="/dashboard"
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                !sp.path && !sp.risk
                  ? "bg-black text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Cohorts
            </Link>
            <Link
              href="/dashboard?risk=1"
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                sp.risk === "1"
                  ? "bg-red-600 text-white shadow-2xs"
                  : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200/50"
              }`}
            >
              <AlertTriangle className="size-3" />
              <span>At Risk ({atRisk})</span>
            </Link>
            {paths.map((p) => (
              <Link
                key={p.id}
                href={`/dashboard?path=${p.id}`}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors truncate max-w-[160px] ${
                  sp.path === p.id
                    ? "bg-black text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {p.title}
              </Link>
            ))}
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3.5">Candidate</th>
                <th className="px-4 py-3.5">Assigned Track</th>
                <th className="px-4 py-3.5">Curriculum</th>
                <th className="px-4 py-3.5">Tasks Done</th>
                <th className="px-4 py-3.5">On-Time</th>
                <th className="px-4 py-3.5">Avg PR Quality</th>
                <th className="px-4 py-3.5">Last Active</th>
                <th className="px-4 py-3.5">Status & Risk</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shown.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                    <Users className="size-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-800">No active candidate onboardings match this filter.</p>
                    <p className="text-xs text-slate-500 mt-1">Publish a path and assign it to an engineer to view realtime progress.</p>
                  </td>
                </tr>
              ) : (
                shown.map(({ a, m }) => {
                  const candidate = userMap.get(a.userId);
                  const candidateName = candidate?.name || "Unknown Candidate";
                  const hasRisk = m.overall.riskFlags.length > 0;

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Candidate Avatar & Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            {candidate?.githubUsername ? (
                              <img
                                src={`https://github.com/${candidate.githubUsername}.png?size=64`}
                                alt={candidateName}
                                className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                                {getInitials(candidateName)}
                              </div>
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/people/${a.id}`}
                              className="font-bold text-slate-900 hover:text-indigo-600 transition-colors block leading-tight"
                            >
                              {candidateName}
                            </Link>
                            {candidate?.githubUsername && (
                              <span className="text-[11px] text-slate-400">
                                @{candidate.githubUsername}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Assigned Track */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800 truncate max-w-[180px]">
                          {a.path.title}
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                          v{a.path.version}
                        </span>
                      </td>

                      {/* Progress Bar */}
                      <td className="px-4 py-3">
                        <div className="w-28">
                          <div className="flex items-center justify-between text-xs font-semibold mb-1">
                            <span>{m.learning.completionPct}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                m.learning.completionPct >= 80
                                  ? "bg-emerald-500"
                                  : m.learning.completionPct >= 40
                                  ? "bg-blue-500"
                                  : "bg-amber-500"
                              }`}
                              style={{ width: `${m.learning.completionPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Tasks Done */}
                      <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/60">
                          {m.tasks.done} / {m.tasks.total}
                        </span>
                      </td>

                      {/* On-Time Rate */}
                      <td className="px-4 py-3 text-xs">
                        {m.tasks.onTimeRatePct != null ? (
                          <span
                            className={`font-semibold px-2 py-0.5 rounded-md ${
                              m.tasks.onTimeRatePct >= 80
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                                : "bg-amber-50 text-amber-700 border border-amber-200/50"
                            }`}
                          >
                            {m.tasks.onTimeRatePct}%
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Avg PR Score */}
                      <td className="px-4 py-3 text-xs">
                        {m.github.avgPrScore != null ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                            <GitPullRequest className="size-3 text-slate-400" />
                            <span>{m.github.avgPrScore} / 100</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Last Activity */}
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {m.overall.lastActivity ? (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-3 text-slate-400" />
                            <span>{m.overall.lastActivity.slice(0, 10)}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">None recorded</span>
                        )}
                      </td>

                      {/* Status & Risk Pill */}
                      <td className="px-4 py-3">
                        {!hasRisk ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>On Track</span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200/60"
                            title={m.overall.riskFlags.join("\n")}
                          >
                            <AlertTriangle className="size-3 text-red-600" />
                            <span>{m.overall.riskFlags[0]}</span>
                            {m.overall.riskFlags.length > 1 && (
                              <span className="text-[10px] opacity-75">
                                +{m.overall.riskFlags.length - 1}
                              </span>
                            )}
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/people/${a.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-black hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200/80 transition-all"
                        >
                          <span>Dossier</span>
                          <ArrowRight className="size-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
