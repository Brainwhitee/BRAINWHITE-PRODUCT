// Single typed access point for environment variables (AGENTS.md §3).
// Required vars fail fast at first use; optional integrations degrade visibly instead of faking.
import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  APP_URL: z.string().url(),
  ENCRYPTION_KEY: z.string().regex(/^[0-9a-f]{64}$/, "ENCRYPTION_KEY must be 64 hex chars"),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    APP_URL: process.env.APP_URL,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  });
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid server environment configuration — ${missing}`);
  }
  cached = parsed.data;
  return cached;
}

// Public base URL used to build absolute links in emails (password reset, verification).
export function appUrl(): string {
  return serverEnv().APP_URL.replace(/\/+$/, "");
}

// ---------- Optional integrations (visible "not configured" states, never faked) ----------

export const isEmailConfigured = () => Boolean(process.env.RESEND_API_KEY);
export const isGoogleOAuthConfigured = () =>
  Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
export const isGithubOAuthConfigured = () =>
  Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
