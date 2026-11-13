# Auth redesign — plan (2026-10-30)

## Goal
Replace the incomplete auth UI with the requested design (GrainGradient two-pane layout) and make
authentication fully functional for real users, end to end, per AGENTS.md §6.

## Current state (verified)
- `src/components/ui/auth-section-1.tsx` = previous agent's static dark mockup. Hardcoded
  "GitHub (coming soon)", no Google/Apple, no password-reset, and it never renders the
  `?error=` query params that `/api/auth/github/callback` redirects with (`github_not_configured`,
  `github_state_invalid`, ...) → a real functional bug.
- Backend exists and is real: bcrypt hashing, DB sessions (`src/lib/auth.ts`), zod validation,
  invite acceptance, GitHub OAuth start/callback against the live DB.
- Gaps vs AGENTS.md §6: no rate limiting/lockout, no password reset, no email verification,
  `npm test` does not exist (vitest not installed), CI still uses `file:./ci.db` while schema is
  postgresql (CI broken), seed has no production guard.
- Support chat bot: `GEMINI_MODEL=gemini-3.8-flash` and `GROQ_MODEL=qwen/qwen3.8-27b` are invalid
  model IDs → every AI call fails → the bot always answers with the dumb fallback.
- Live DB = Supabase Postgres via the **pooler** connection (no shadow-DB creation possible) →
  migrations must be generated with `prisma migrate diff` and resolved, not `migrate dev`.

## Design decisions
1. **Google OAuth is real** (user decision): new `/api/auth/google/start` + `/api/auth/google/callback`
   mirroring the GitHub flow, env-gated with a visible "not configured" state. Apple is NOT built
   (needs an Apple Developer program membership); the two social buttons shipped are Google + GitHub
   (both fully functional). No dead buttons.
2. **Email verification**: `User.emailVerifiedAt`. Migration backfills `createdAt` for existing rows
   (legacy users = verified, nobody gets locked out). New signups/invite-accepts verify via a mailed
   token; while unverified a banner + resend is shown (no hard lockout, so a missing email provider
   degrades gracefully instead of bricking accounts).
3. **Password reset**: token in `AuthToken` table (hashed, 1h TTL), email via existing Resend
   mailer; always returns the same generic response (no account enumeration).
4. **Rate limiting/lockout**: DB-backed (serverless-safe). Per-email: 5 failed logins → 15 min
   lockout. Per-IP: 20 attempts / 15 min on auth endpoints. Old rows purged opportunistically.
5. **Testability**: auth core goes into framework-free `src/lib/domain/auth.ts` that accepts a
   Prisma client (so tests run inside a rollback transaction — no pollution of the live DB).
   Server actions become thin wrappers.
6. Auth routes render without the marketing navbar/chat widget (via middleware `x-pathname`).

## Layers touched
UI (login, signup, forgot, reset, verify, terms, privacy, banner) · server actions (signup, login,
invite accept, reset, verify, resend) · route handlers (google start/callback, github callback refactor)
· validation (zod) · authz (session/role unchanged, + unauth redirect middleware) · schema/migration
· env vars (GOOGLE_CLIENT_ID/SECRET) · email (reset + verification templates) · support bot (model IDs)
· tests + CI · docs.

## Risks
- Applying a migration to the live Supabase DB: generated SQL will be reviewed before applying;
  only additive changes + a data backfill. Rollback = drop the 3 new objects (documented).
- Google OAuth requires the user to create an OAuth client; until then the button shows the
  "not configured" error state on return (tested).

## Test plan
- Vitest (real DB, rollback transactions): signup happy path + validation + duplicate email;
  login ok / wrong password / lockout after 5 fails / lockout expiry; password reset full cycle;
  email verification full cycle; OAuth user resolution (link by email, no enumeration data leak).
- Manual: dev-server curl walkthrough of signup → verify email link → login → forgot → reset →
  Google start route redirect; support-chat answer quality; delete the manual test user afterwards.
