"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname() ?? "";
  // only the most specific matching link is active ("/learn/map" must not also light up "/learn")
  const matches = links.filter((l) => pathname === l.href || pathname.startsWith(l.href + "/"));
  const activeHref = matches.sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <nav className="flex items-center gap-1 text-sm" aria-label="Main">
      {links.map((l) => {
        const active = l.href === activeHref;
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
