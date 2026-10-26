import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { ActionForm, inputCls } from "@/components/ActionForm";
import { changeRole, deactivateMember, inviteMember, resendInvite, revokeInvite } from "../actions";

export default async function Team() {
  const me = await requirePermission("members:view");
  const [members, invites] = await Promise.all([
    db.user.findMany({ where: { orgId: me.orgId }, orderBy: { createdAt: "asc" } }),
    db.invitation.findMany({ where: { orgId: me.orgId }, orderBy: { createdAt: "desc" } }),
  ]);
  const now = new Date();
  const statusOf = (i: (typeof invites)[number]) =>
    i.status === "PENDING" && i.expiresAt < now ? "EXPIRED" : i.status;
  const canInvite = can(me.role, "members:invite");
  const th = "px-3 py-2 text-left font-medium text-slate-500";

  return (
    <Shell user={me}>
      <h1 className="mb-4 text-xl font-semibold">Team</h1>

      {canInvite && (
        <section className="mb-8 rounded-lg border bg-white p-4">
          <h2 className="mb-3 font-medium">Invite someone</h2>
          <ActionForm action={inviteMember} submit="Send invite" className="flex flex-wrap items-start gap-2">
            <input name="email" type="email" placeholder="email@company.com" className={inputCls + " !w-64"} required />
            <select name="role" className={inputCls + " !w-40"} defaultValue="CANDIDATE">
              <option value="CANDIDATE">Candidate</option>
              <option value="MENTOR">Mentor</option>
              <option value="MANAGER">Manager</option>
            </select>
          </ActionForm>
        </section>
      )}

      <section className="mb-8 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className={th}>Name</th><th className={th}>Email</th><th className={th}>Role</th>
              <th className={th}>GitHub</th><th className={th}>Status</th><th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="px-3 py-2">{m.name}</td>
                <td className="px-3 py-2">{m.email}</td>
                <td className="px-3 py-2">
                  {can(me.role, "members:change-role") && m.role !== "OWNER" && m.id !== me.id ? (
                    <form action={changeRole} className="flex gap-1">
                      <input type="hidden" name="id" value={m.id} />
                      <select name="role" defaultValue={m.role} className="rounded border px-1 py-0.5">
                        <option value="MANAGER">MANAGER</option>
                        <option value="MENTOR">MENTOR</option>
                        <option value="CANDIDATE">CANDIDATE</option>
                      </select>
                      <button className="text-indigo-700 underline">Save</button>
                    </form>
                  ) : (
                    m.role
                  )}
                </td>
                <td className="px-3 py-2">{m.githubUsername ? `@${m.githubUsername}` : "—"}</td>
                <td className="px-3 py-2">{m.status}</td>
                <td className="px-3 py-2">
                  {can(me.role, "members:deactivate") && m.role !== "OWNER" && m.id !== me.id && (
                    <form action={deactivateMember}>
                      <input type="hidden" name="id" value={m.id} />
                      <button className="text-red-600 underline">
                        {m.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <h2 className="mb-2 font-medium">Invitations</h2>
      <section className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr><th className={th}>Email</th><th className={th}>Role</th><th className={th}>Status</th><th className={th}></th></tr>
          </thead>
          <tbody>
            {invites.length === 0 && (
              <tr><td className="px-3 py-3 text-slate-500" colSpan={4}>No invitations yet.</td></tr>
            )}
            {invites.map((i) => (
              <tr key={i.id} className="border-t">
                <td className="px-3 py-2">{i.email}</td>
                <td className="px-3 py-2">{i.role}</td>
                <td className="px-3 py-2">{statusOf(i)}</td>
                <td className="flex gap-3 px-3 py-2">
                  {canInvite && statusOf(i) !== "ACCEPTED" && (
                    <form action={resendInvite}>
                      <input type="hidden" name="id" value={i.id} />
                      <button className="text-indigo-700 underline">Resend</button>
                    </form>
                  )}
                  {canInvite && i.status === "PENDING" && (
                    <form action={revokeInvite}>
                      <input type="hidden" name="id" value={i.id} />
                      <button className="text-red-600 underline">Revoke</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </Shell>
  );
}
