"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Menu } from "@/components/experience/Menu";

const DASHBOARD_ROUTES = [
  "/dashboard",
  "/learn",
  "/paths",
  "/tasks",
  "/projects",
  "/team",
  "/audit",
  "/people",
  "/reports",
  "/slides",
  "/connect-github",
];

export function MarketingHeader() {
  const pathname = usePathname();

  const authPaths = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/invite",
  ];
  if (authPaths.some((p) => pathname === p || pathname?.startsWith(p + "/"))) {
    return null;
  }

  // Check if current route is an authenticated dashboard or app route
  const isDashboard = pathname ? DASHBOARD_ROUTES.some((prefix) => pathname.startsWith(prefix)) : false;

  if (isDashboard) {
    // For all user dashboards:
    // Only keep the Menu button, configured specifically for the dashboard user.
    return <Menu isDashboard={true} />;
  }

  // On root "/", page.tsx already renders Menu and bespoke hero experience.
  if (pathname === "/") {
    return null;
  }

  // Standard public marketing pages (e.g. /product, /architecture, /how-it-works, /security, /pricing, /book-demo)
  // Per user instruction: Remove the floating navbar, keep the Menu, and provide a sleek "Back to Home" option.
  return (
    <>
      <div className="fixed top-6 left-6 z-50">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/80 hover:bg-white hover:text-black backdrop-blur-md px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all shadow-lg hover:scale-105"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>
      <Menu isDashboard={false} />
    </>
  );
}
