import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { getAppJwt } from "@/lib/domain/github-app";

// GitHub App setup URL callback (triggered after company owner installs the GitHub App)
export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user || !can(user.role, "codebase:manage")) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("error", "unauthorized");
    return NextResponse.redirect(loginUrl);
  }

  const { searchParams } = new URL(req.url);
  const installationId = searchParams.get("installation_id");
  const setupAction = searchParams.get("setup_action");

  if (!installationId) {
    const errorUrl = new URL("/projects", req.url);
    errorUrl.searchParams.set("error", "missing_installation_id");
    return NextResponse.redirect(errorUrl);
  }

  try {
    // Optionally fetch GitHub organization / account name using App JWT
    let githubOrgName: string | null = null;
    const jwt = await getAppJwt();
    if (jwt) {
      try {
        const ghRes = await fetch(`https://api.github.com/app/installations/${installationId}`, {
          headers: {
            Authorization: `Bearer ${jwt}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "brainwhite",
          },
        });
        if (ghRes.ok) {
          const ghData = await ghRes.json();
          githubOrgName = ghData.account?.login ?? null;
        }
      } catch (e) {
        console.warn("[github-app] Could not fetch installation account details:", e);
      }
    }

    // Save installationId to the current user's organisation
    await db.organisation.update({
      where: { id: user.orgId },
      data: {
        githubInstallationId: String(installationId),
        ...(githubOrgName ? { githubOrgName } : {}),
      },
    });

    await audit(user.orgId, user.id, "org.github_app_installed", String(installationId));

    const successUrl = new URL("/projects", req.url);
    successUrl.searchParams.set("installed", "true");
    return NextResponse.redirect(successUrl);
  } catch (err: unknown) {
    console.error("[github-app] Setup callback error:", err);
    const errorUrl = new URL("/projects", req.url);
    errorUrl.searchParams.set("error", "app_installation_failed");
    return NextResponse.redirect(errorUrl);
  }
}
