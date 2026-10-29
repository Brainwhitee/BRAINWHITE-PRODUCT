# Production readiness — living checklist
Agents: read this before every task and update it when you change anything below.

## A. Blockers before real customers (from README "Known gaps" — audit each, don't assume)
- [ ] Postgres in production (SQLite does not persist on Vercel). Provider switched in
      prisma/schema.prisma, migrations generated for Postgres, DATABASE_URL set on Vercel.
- [ ] Real email provider in src/lib/mailer.ts (invites, verification, password reset).
- [ ] Email verification + password reset flows.
- [ ] Rate limiting on login, signup, reset, chat and other expensive endpoints.
- [ ] Background work not tied to in-process timers: replace src/instrumentation.ts
      scheduler + `void syncRepository` with Vercel Cron routes + a job queue/status table;
      handle jobs stuck in RUNNING.
- [ ] Demo accounts removed from production; seed only runs in dev. ALLOW_LOCAL_REPOS=false.
- [ ] Fresh ENCRYPTION_KEY and GITHUB_WEBHOOK_SECRET generated for production.
- [ ] Handout storage on object storage (S3/R2/Vercel Blob), not local disk.
- [ ] Automated tests + CI green; error monitoring (e.g. Sentry); structured logging.
- [ ] Privacy/Terms pages, data export/delete path, backup + restore tested.

## B. Environment variables (keep in sync with .env.example)
| Var | Required in prod | Where to get it | If missing |
|---|---|---|---|
| DATABASE_URL | yes | Neon/Supabase/Vercel Postgres | app refuses to start |
| ENCRYPTION_KEY | yes | `openssl rand -hex 32` | app refuses to start |
| GITHUB_WEBHOOK_SECRET | yes | you choose, set in GitHub webhook | webhook rejected |
| GEMINI_API_KEY / GROQ_API_KEY | optional | aistudio.google.com / console.groq.com | "AI not configured" state |
| GitHub OAuth id/secret | optional | GitHub OAuth app | dev form disabled in prod |
| Email provider key | yes | Resend/SMTP | "email not configured" state |

## C. Release checklist (per deploy)
1. CI green on the PR; CodeRabbit comments resolved.
2. Migration reviewed; backup taken; `prisma migrate deploy` run BEFORE new code serves traffic.
3. New env vars set in Vercel (Production + Preview).
4. Smoke test on preview URL: signup/login, invite, learning flow, task/PR webhook.
5. Deploy; watch logs/errors 15 min; rollback plan = revert commit + (if needed) down-migration.
