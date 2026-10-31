# Production readiness — living checklist
Agents: read this before every task and update it when you change anything below.

## A. Blockers before real customers (from README "Known gaps" — audit each, don't assume)
- [x] Postgres in production (SQLite does not persist on Vercel). Provider switched in
      prisma/schema.prisma, migrations generated for Postgres, DATABASE_URL set on Vercel.
- [x] Real email provider in src/lib/mailer.ts (invites, verification, password reset).
- [x] Email verification + password reset flows.
- [x] Rate limiting on login, signup, reset, chat and other expensive endpoints.
- [ ] Background work not tied to in-process timers: replace src/instrumentation.ts
      scheduler + `void syncRepository` with Vercel Cron routes + a job queue/status table;
      handle jobs stuck in RUNNING.
- [x] Demo accounts removed from production; seed only runs in dev. ALLOW_LOCAL_REPOS=false.
- [x] Fresh ENCRYPTION_KEY and GITHUB_WEBHOOK_SECRET generated for production.
- [ ] Handout storage on object storage (S3/R2/Vercel Blob), not local disk.
- [x] Automated tests + CI green; error monitoring (e.g. Sentry); structured logging.
- [ ] Privacy/Terms pages, data export/delete path, backup + restore tested.

## B. Environment variables (keep in sync with .env.example)
| Var | Required in prod | Where to get it | If missing |
|---|---|---|---|
| DATABASE_URL | yes | Neon/Supabase/Vercel Postgres | app refuses to start |
| ENCRYPTION_KEY | yes | `openssl rand -hex 32` | app refuses to start |
| APP_URL | yes | your production URL | email links break |
| GITHUB_WEBHOOK_SECRET | yes | you choose, set in GitHub webhook | webhook rejected |
| GEMINI_API_KEY / GROQ_API_KEY | optional | aistudio.google.com / console.groq.com | "AI not configured" state |
| GitHub OAuth id/secret | optional | GitHub OAuth app | dev form disabled in prod |
| Google OAuth id/secret | optional | Google Cloud Console | Google button shows "not configured" |
| Email provider key (RESEND_API_KEY) | yes | Resend/SMTP | "email not configured" state |

## C. Release checklist (per deploy)
1. CI green on the PR; CodeRabbit comments resolved.
2. Migration reviewed; backup taken; `prisma migrate deploy` run BEFORE new code serves traffic.
3. New env vars set in Vercel (Production + Preview).
4. Smoke test on preview URL: signup/login, invite, learning flow, task/PR webhook, password reset, email verification.
5. Deploy; watch logs/errors 15 min; rollback plan = revert commit + (if needed) down-migration.

## D. Auth features status (new in auth hardening)
- [x] bcrypt password hashing (cost 12)
- [x] DB sessions with httpOnly secure cookies
- [x] Email/password signup with org creation
- [x] Email/password login with rate limiting + lockout (5 failures → 15 min)
- [x] Per-IP rate limits on auth endpoints (signup 10/15min, login 20/15min, reset 5/15min)
- [x] Password reset flow (1h token, email via Resend, logs out all sessions)
- [x] Email verification flow (24h token, banner + resend for unverified users, grandfathered existing users)
- [x] GitHub OAuth (existing, refactored to shared resolver, fetches primary verified email)
- [x] Google OAuth (new, mirrors GitHub flow, env-gated)
- [x] Invite acceptance issues verification email
- [x] Support chat bot works (Groq qwen model responds)
- [x] Tests: unit/integration via vitest with transactional rollback

## E. Schema changes (auth hardening migrations)
- `User.emailVerifiedAt DateTime?` — backfilled to `createdAt` for existing rows (legacy verified)
- `AuthToken` — single-use hashed tokens for password reset + email verification
- `LoginAttempt` — fixed-window rate limiting + lockout (global, not org-scoped)
- `OAuthAccount` — Google/GitHub links, unique on (provider, providerUserId), keeps GitHub legacy fields in sync

## F. Design & UI Aesthetics Standards
- Strict Executive Hierarchy: Only clean Heading (h1) and Subheading (p). No redundant secondary subheadings.
- No Clutter Badges or Colored Banners: Absolutely no colored pill banners, micro-labels (text-[9px]/text-[10px]), pulsing colored dots (animate-pulse), or red/green status boxes on cards.
- No Backend Internal Leakage: Never disclose backend LLM or infrastructure providers in user-facing UI (e.g. NEVER show "⚡ via grok", "powered by gemini", "served via groq", etc.).
- No Decorative Emojis or Artificial Versioning: Do not litter titles, cards, or buttons with emojis (⚡, 🚀, 🎉) or artificial labels like "v1", "part1", "beta".
- Minimalist Typography: Use high-contrast, clean typography (slate-950 / white) with subtle muted secondary text (slate-500). Maintain an uncluttered, modern enterprise aesthetic.