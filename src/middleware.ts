import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public pages that do not require authentication
const PUBLIC_EXACT_PATHS = new Set([
  "/",
  "/how-it-works",
  "/security",
  "/pricing",
  "/product",
  "/architecture",
  "/terms",
  "/privacy",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
]);

// Public path prefixes
const PUBLIC_PREFIXES = [
  "/invite",
  "/verify-email",
  "/api/auth",
  "/api/support-chat",
  "/api/chat",
  "/api/github/webhook",
];

function isPublicPath(pathname: string): boolean {
  const normalized = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  if (PUBLIC_EXACT_PATHS.has(normalized)) return true;
  return PUBLIC_PREFIXES.some((p) => normalized.startsWith(p));
}

// Paths that should NOT show marketing header / support chat
const AUTH_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/invite",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const res = NextResponse.next();

  // Pass pathname to downstream components via header
  res.headers.set("x-pathname", pathname);

  // Check if path is public
  const isPublic = isPublicPath(pathname);
  const isAuthPath = AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  // Mark auth paths so layout can hide marketing chrome
  if (isAuthPath) {
    res.headers.set("x-is-auth-page", "true");
  }

  // Redirect unauthenticated users from protected application routes to /login
  if (!isPublic) {
    const sessionCookie = req.cookies.get("pd_session");
    if (!sessionCookie) {
      const url = new URL("/login", req.url);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (robots.txt, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
