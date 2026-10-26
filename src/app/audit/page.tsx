import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { Shell } from "@/components/Shell";

export default async function Audit() {
  const me = await requirePermission("audit:view");
  const logs = await db.auditLog.findMany({
    where: { orgId: me.orgId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <Shell user={me}>
      <h1 className="mb-4 text-xl font-semibold">Audit log</h1>
      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t first:border-t-0">
                <td className="px-3 py-2 text-slate-500">{l.createdAt.toISOString().slice(0, 19).replace("T", " ")}</td>
                <td className="px-3 py-2">{l.action}</td>
                <td className="px-3 py-2 text-slate-500">{l.target}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
