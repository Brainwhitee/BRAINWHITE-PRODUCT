"use client";

import * as React from "react";
import { TubelightNavbar } from "@/components/ui/tubelight-navbar";

const navLinks = [
  { name: "Product", url: "/product" },
  { name: "Architecture", url: "/architecture" },
  { name: "How It Works", url: "/how-it-works" },
  { name: "Security", url: "/security" },
  { name: "Pricing", url: "/pricing" },
  { name: "Book Demo", url: "/book-demo" },
];

export function Navbar() {
  return (
    <div className="relative w-full">
      <TubelightNavbar items={navLinks} />
    </div>
  );
}
