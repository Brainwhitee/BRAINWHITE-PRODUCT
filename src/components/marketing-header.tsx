"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Menu } from "@/components/experience/Menu";

export function MarketingHeader() {
  const pathname = usePathname();

  // On root "/", page.tsx already renders Menu and bespoke hero experience
  if (pathname === "/") {
    return null;
  }

  return (
    <>
      <Navbar />
      <Menu />
    </>
  );
}
