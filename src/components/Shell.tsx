import Link from "next/link";
import { logout } from "@/app/actions";
import { can } from "@/lib/rbac";

export function Shell({
  user,
  children,
  wide,
}: {
  user: { name: string; role: string; org: { name: string } };
  children: React.ReactNode;
  wide?: boolean;
}) {
  const staff = user.role !== "CANDIDATE";
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="flex items-center justify-between border-b bg-white px-6 py-3">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-indigo-700">BrainWhite</span>
          <span className="text-sm text-slate-500">{user.org.name}</span>
          <nav className="flex gap-4 text-sm">
            {staff ? (
              <>
                <Link href="/dashboard">Dashboard</Link>
                {can(user.role, "members:view") && <Link href="/team">Team</Link>}
                {can(user.role, "members:view") && <Link href="/paths">Paths</Link>}
                {can(user.role, "members:view") && <Link href="/tasks">Tasks</Link>}
                {can(user.role, "codebase:view") && <Link href="/projects">Codebase</Link>}
                {can(user.role, "audit:view") && <Link href="/audit">Audit log</Link>}
              </>
            ) : (
              <><Link href="/learn">My learning</Link><Link href="/tasks">My tasks</Link></>
            )}
          </nav>
        </div>
        <form action={logout} className="flex items-center gap-3 text-sm">
          <span>
            {user.name} · {user.role.toLowerCase()}
          </span>
          <button className="text-indigo-700 underline">Log out</button>
        </form>
      </header>
      <main className={wide ? "p-3" : "mx-auto max-w-5xl p-6"}>{children}</main>
    </div>
  );
}
