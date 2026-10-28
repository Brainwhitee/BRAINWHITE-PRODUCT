"use client";

import * as React from "react";
import { TubelightNavbar } from "@/components/ui/tubelight-navbar";

const navLinks = [
  { name: "Product", url: "/product" },
  { name: "How It Works", url: "/how-it-works" },
  { name: "Pricing", url: "/pricing" },
  { name: "Security", url: "/security" },
  { name: "Contact", url: "/contact" },
];

export function Navbar() {
  return (
    <div className="relative w-full">
      <TubelightNavbar items={navLinks} />
    </div>
  );
}
