import Link from "next/link";
import { cookies } from "next/headers";
import { logout } from "@/app/actions";
import { can } from "@/lib/rbac";
import { NavLinks } from "@/components/NavLinks";
import { ThemeToggle } from "@/components/app-fx";

export async function Shell({
  user,
  children,
  wide,
}: {
  user: { name: string; role: string; org: { name: string } };
  children: React.ReactNode;
  wide?: boolean;
}) {
  const staff = user.role !== "CANDIDATE";
  const theme = (await cookies()).get("bw-theme")?.value === "light" ? "light" : "dark"; // dark by default
  const links = staff
    ? [
        { href: "/dashboard", label: "Dashboard" },
        ...(can(user.role, "members:view") ? [{ href: "/team", label: "Team" }, { href: "/paths", label: "Paths" }, { href: "/tasks", label: "Tasks" }] : []),
        ...(can(user.role, "codebase:view") ? [{ href: "/projects", label: "Codebase" }] : []),
        ...(can(user.role, "audit:view") ? [{ href: "/audit", label: "Audit log" }] : []),
      ]
    : [{ href: "/learn", label: "My learning" }, { href: "/learn/map", label: "Code map" }, { href: "/tasks", label: "My tasks" }];
  return (
    <div className="app-shell min-h-screen bg-slate-50 text-slate-900" data-theme={theme}>
      <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b bg-white/90 px-6 py-2.5 backdrop-blur">
        <div className="flex min-w-0 items-center gap-5">
          <Link href={staff ? "/dashboard" : "/learn"} className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-slate-900">
            <span className="pill-on grid h-7 w-7 place-items-center rounded-lg text-xs font-bold">B</span>
            BrainWhite
          </Link>
          <span className="hidden rounded-full border px-2.5 py-0.5 text-xs text-slate-500 sm:inline">{user.org.name}</span>
          <NavLinks links={links} />
        </div>
        <form action={logout} className="flex shrink-0 items-center gap-3 text-sm">
          <ThemeToggle initial={theme} />
          <span className="hidden text-slate-600 md:inline">{user.name}</span>
          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium capitalize text-indigo-700">{user.role.toLowerCase()}</span>
          <button className="rounded-full border px-3 py-1 text-slate-700 transition-colors hover:bg-slate-100">Log out</button>
        </form>
      </header>
      <main className={wide ? "p-4" : "mx-auto max-w-5xl p-6"}>{children}</main>
    </div>
  );
}
