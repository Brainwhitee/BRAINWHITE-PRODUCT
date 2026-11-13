import { SignJWT, importPKCS8 } from "jose";
import { createPrivateKey } from "crypto";
import { db } from "../db";
import { decrypt } from "../crypto";

export function isGitHubAppConfigured(): boolean {
  return Boolean(process.env.GITHUB_APP_ID && process.env.GITHUB_APP_PRIVATE_KEY);
}

// Signs an RS256 JWT using GITHUB_APP_PRIVATE_KEY with issuer GITHUB_APP_ID
export async function getAppJwt(): Promise<string | null> {
  const appId = process.env.GITHUB_APP_ID;
  const rawKey = process.env.GITHUB_APP_PRIVATE_KEY;
  if (!appId || !rawKey) return null;

  // Normalize PEM key formatting (handling \n strings in env vars)
  let pem = rawKey.trim();
  if (pem.includes("\\n")) {
    pem = pem.replace(/\\n/g, "\n");
  }

  try {
    const keyObject = createPrivateKey(pem);
    const pkcs8Pem = keyObject.export({ type: "pkcs8", format: "pem" }) as string;
    const privateKey = await importPKCS8(pkcs8Pem, "RS256");

    const now = Math.floor(Date.now() / 1000);
    return await new SignJWT({})
      .setProtectedHeader({ alg: "RS256" })
      .setIssuedAt(now - 60) // 60s in past for clock drift
      .setExpirationTime(now + 9 * 60) // 9 minutes expiration
      .setIssuer(String(appId))
      .sign(privateKey);
  } catch (err) {
    console.error("[github-app] Error signing App JWT:", err);
    return null;
  }
}

// In-memory token cache for short-lived installation access tokens
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

export async function getInstallationAccessToken(installationId: string): Promise<string | null> {
  const cached = tokenCache.get(installationId);
  const now = Date.now();
  if (cached && cached.expiresAt - now > 5 * 60 * 1000) {
    return cached.token;
  }

  const jwt = await getAppJwt();
  if (!jwt) return null;

  try {
    const res = await fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "brainwhite",
      },
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error(`[github-app] Installation token exchange failed (${res.status}): ${errText}`);
      return null;
    }

    const data = await res.json();
    const token = data.token as string | undefined;
    const expiresAt = data.expires_at ? new Date(data.expires_at).getTime() : now + 50 * 60 * 1000;
    if (token) {
      tokenCache.set(installationId, { token, expiresAt });
      return token;
    }
    return null;
  } catch (err) {
    console.error("[github-app] Failed to get installation token:", err);
    return null;
  }
}

// Resolves GitHub token for an organization:
// 1. GitHub App installation token (preferred multi-tenant)
// 2. Encrypted custom PAT fallback on Organisation
// 3. Server GITHUB_TOKEN fallback
export async function getOrgGithubToken(orgId: string): Promise<string | null> {
  const org = await db.organisation.findUnique({ where: { id: orgId } });
  if (!org) return process.env.GITHUB_TOKEN ?? null;

  // 1. GitHub App installation
  if (org.githubInstallationId) {
    const appToken = await getInstallationAccessToken(org.githubInstallationId);
    if (appToken) return appToken;
  }

  // 2. Custom encrypted PAT fallback
  if (org.githubTokenEnc) {
    try {
      const pat = decrypt(org.githubTokenEnc);
      if (pat) return pat;
    } catch (err) {
      console.warn(`[github-app] Failed to decrypt custom PAT for org ${orgId}:`, err);
    }
  }

  // 3. Fallback to server env
  return process.env.GITHUB_TOKEN ?? null;
}
