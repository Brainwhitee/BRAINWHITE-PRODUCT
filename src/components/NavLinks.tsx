"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname() ?? "";
  return (
    <nav className="flex items-center gap-1 text-sm" aria-label="Main">
      {links.map((l) => {
        const active = pathname === l.href || pathname.startsWith(l.href + "/");
        return (
          <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}
            className={`rounded-full px-3 py-1.5 transition-colors ${active ? "pill-on" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
