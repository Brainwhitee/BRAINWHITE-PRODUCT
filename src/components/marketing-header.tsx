"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";
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
  if (authPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return null;
  }

  // Check if current route is an authenticated dashboard or app route
  const isDashboard = pathname ? DASHBOARD_ROUTES.some((prefix) => pathname.startsWith(prefix)) : false;

  if (isDashboard) {
    // For all user dashboards:
    // Remove the landing page navbar (which had "How It Works", "Security", "Pricing", etc.)
    // Only keep the Menu button, configured specifically for the dashboard user.
    return <Menu isDashboard={true} />;
  }

  // On root "/", page.tsx already renders Menu and bespoke hero experience.
  if (pathname === "/") {
    return null;
  }

  // Standard public marketing pages (e.g. /product, /architecture, /how-it-works, /security, /pricing)
  return (
    <>
      <Navbar />
      <Menu isDashboard={false} />
    </>
  );
}
