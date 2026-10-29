"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Menu } from "@/components/experience/Menu";

export function MarketingHeader() {
  const pathname = usePathname();

  // On root "/", page.tsx already renders Menu and bespoke hero experience.
  // Auth pages (login/signup) render no navbar — back button only.
  if (pathname === "/" || pathname === "/login" || pathname === "/signup") {
    return null;
  }

  return (
    <>
      <Navbar />
      <Menu />
    </>
  );
}
