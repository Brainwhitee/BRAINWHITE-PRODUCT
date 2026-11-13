"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Menu } from "@/components/experience/Menu";
import { isAppRoute } from "@/lib/app-routes";

export function MarketingHeader() {
  const pathname = usePathname();

  // On root "/", page.tsx already renders Menu and bespoke hero experience.
  // Auth pages (login/signup) render no navbar — back button only.
  if (pathname === "/" || pathname === "/login" || pathname === "/signup" || isAppRoute(pathname)) {
    return null;
  }

  return (
    <>
      <Navbar />
      <Menu />
    </>
  );
}
