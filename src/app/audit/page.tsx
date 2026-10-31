import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { Shell } from "@/components/Shell";
import { ShieldCheck, Clock, Activity, User } from "lucide-react";

export default async function Audit() {
  const me = await requirePermission("audit:view");
  const logs = await db.auditLog.findMany({
    where: { orgId: me.orgId },
    orderBy: { createdAt: "desc" },
    take: 150,
  });

  const getActionBadge = (action: string) => {
    if (action.startsWith("auth.")) {
      return "bg-purple-50 text-purple-700 border-purple-200/60";
    }
    if (action.startsWith("invite.")) {
      return "bg-blue-50 text-blue-700 border-blue-200/60";
    }
    if (action.startsWith("repo.")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
    }
    if (action.startsWith("member.")) {
      return "bg-amber-50 text-amber-700 border-amber-200/60";
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <Shell user={me}>
      {/* 1. Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-950 tracking-tight">Audit Log & Security Trail</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable organizational activity records, authentication events, and role permissions.
          </p>
        </div>
      </div>

      {/* 2. Audit Table (Inspired by 21st.dev table11) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-slate-700" />
            <h2 className="font-bold text-slate-950 text-sm">Recent Activity ({logs.length} events)</h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">Action Event</th>
                <th className="px-4 py-3.5">Target / Payload</th>
                <th className="px-4 py-3.5 text-right">Actor ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <Activity className="size-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-800 text-sm">No audit activity logged yet.</p>
                    <p className="text-xs text-slate-400 mt-0.5">Actions performed in this workspace will appear here in realtime.</p>
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-600 font-mono">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="size-3 text-slate-400" />
                        <span>{l.createdAt.toISOString().slice(0, 19).replace("T", " ")}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${getActionBadge(
                          l.action
                        )}`}
                      >
                        {l.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700 font-mono max-w-md truncate">
                      {l.target || "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-500 font-mono">
                      {l.actorId ? (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                          {l.actorId.slice(0, 8)}…
                        </span>
                      ) : (
                        <span className="text-slate-400">system</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
