import { CopyInviteButton } from "@/components/CopyInviteButton";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { ActionForm, inputCls } from "@/components/ActionForm";
import { changeRole, deactivateMember, inviteMember, resendInvite, revokeInvite } from "../actions";
import { Users, UserPlus, Mail, Shield, CheckCircle2, Clock, GitBranch } from "lucide-react";

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

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };


  return (
    <Shell user={me}>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-950 tracking-tight">Team & Members</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage organization members, engineer roles, permissions, and pending invitations.
          </p>
        </div>
      </div>

      {canInvite && (
        <section className="mb-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus className="size-4 text-slate-700" />
            <h2 className="font-bold text-slate-900 text-sm">Invite New Member</h2>
          </div>
          <ActionForm action={inviteMember} submit="Send Invite" className="flex flex-wrap items-start gap-2.5">
            <input
              name="email"
              type="email"
              placeholder="engineer@company.com"
              className={inputCls + " !w-72"}
              required
            />
            <select name="role" className={inputCls + " !w-44"} defaultValue="CANDIDATE">
              <option value="CANDIDATE">Candidate</option>
              <option value="MENTOR">Mentor</option>
              <option value="MANAGER">Manager</option>
            </select>
          </ActionForm>
        </section>
      )}

      {/* MEMBERS TABLE (Inspired by 21st.dev table11) */}
      <div className="mb-8 rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-slate-700" />
            <h2 className="font-bold text-slate-950 text-base">Active Members ({members.length})</h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3.5">Member</th>
                <th className="px-4 py-3.5">Email</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">GitHub</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {m.githubUsername ? (
                        <img
                          src={`https://github.com/${m.githubUsername}.png?size=64`}
                          alt={m.name}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                          {getInitials(m.name)}
                        </div>
                      )}
                      <span className="font-bold text-slate-900">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 font-mono">{m.email}</td>
                  <td className="px-4 py-3">
                    {can(me.role, "members:change-role") && m.role !== "OWNER" && m.id !== me.id ? (
                      <form action={changeRole} className="flex items-center gap-1.5">
                        <input type="hidden" name="id" value={m.id} />
                        <select
                          name="role"
                          defaultValue={m.role}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800"
                        >
                          <option value="MANAGER">MANAGER</option>
                          <option value="MENTOR">MENTOR</option>
                          <option value="CANDIDATE">CANDIDATE</option>
                        </select>
                        <button className="text-xs font-bold text-black hover:underline cursor-pointer">
                          Update
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-slate-500 font-medium capitalize">
                        {m.role.toLowerCase()}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {m.githubUsername ? (
                      <span className="inline-flex items-center gap-1 font-mono">
                        <GitBranch className="size-3 text-slate-400" />
                        <span>@{m.githubUsername}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-500 font-medium capitalize">
                      {m.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {can(me.role, "members:deactivate") && m.role !== "OWNER" && m.id !== me.id && (
                      <form action={deactivateMember}>
                        <input type="hidden" name="id" value={m.id} />
                        <button
                          className={`text-xs font-semibold hover:underline cursor-pointer ${
                            m.status === "ACTIVE" ? "text-red-600" : "text-emerald-700"
                          }`}
                        >
                          {m.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* INVITATIONS SECTION */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-slate-700" />
            <h2 className="font-bold text-slate-950 text-base">Invitations ({invites.length})</h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3.5">Email</th>
                <th className="px-4 py-3.5">Assigned Role</th>
                <th className="px-4 py-3.5">Invitation Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invites.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-xs">
                    No active or pending invitations sent.
                  </td>
                </tr>
              ) : (
                invites.map((i) => {
                  const s = statusOf(i);
                  return (
                    <tr key={i.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-800">{i.email}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-500 font-medium capitalize">
                          {i.role.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-500 font-medium capitalize">
                          {s.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2 text-xs">
                          {s === "PENDING" && <CopyInviteButton tokenHash={i.tokenHash} />}
                          {canInvite && s !== "ACCEPTED" && (
                            <form action={resendInvite}>
                              <input type="hidden" name="id" value={i.id} />
                              <button className="font-semibold text-slate-900 hover:underline cursor-pointer">
                                Resend
                              </button>
                            </form>
                          )}
                          {canInvite && i.status === "PENDING" && (
                            <form action={revokeInvite}>
                              <input type="hidden" name="id" value={i.id} />
                              <button className="font-semibold text-red-600 hover:underline cursor-pointer">
                                Revoke
                              </button>
                            </form>
                          )}
                        </div>
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
