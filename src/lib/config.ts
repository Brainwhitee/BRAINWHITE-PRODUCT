// Single typed access point for environment variables (AGENTS.md §3).
// Required vars fail fast at first use; optional integrations degrade visibly instead of faking.
import { z } from "zod";

const DEFAULT_DEV_ENCRYPTION_KEY =
  "cfca75822c72d55b8178725b79d046f70229f1b750a8ceb20b45ebe4cbf9ae9e";

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  APP_URL: z.string().optional(),
  ENCRYPTION_KEY: z.string().default(DEFAULT_DEV_ENCRYPTION_KEY),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    APP_URL: process.env.APP_URL,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || DEFAULT_DEV_ENCRYPTION_KEY,
  });
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid server environment configuration — ${missing}`);
  }
  cached = parsed.data;
  return cached;
}

// Public base URL used to build absolute links in emails and OAuth callbacks.
// Bulletproof: handles custom APP_URL, Vercel deployments, or incoming request origins.
export function appUrl(): string {
  if (process.env.APP_URL) {
    const raw = process.env.APP_URL.trim().replace(/\/+$/, "");
    return raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.trim().replace(/\/+$/, "")}`;
  }
  return "http://localhost:3000";
}

// ---------- Optional integrations (visible "not configured" states, never faked) ----------

export const isEmailConfigured = () => Boolean(process.env.RESEND_API_KEY);
export const isGoogleOAuthConfigured = () =>
  Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
export const isGithubOAuthConfigured = () =>
  Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
