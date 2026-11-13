# Architecture (keep updated — agents must read before coding)

## Layers
- **UI:** Next.js 15 App Router (`src/app/` pages and components)
- **Actions / Handlers:** Server Actions (`src/app/**/actions.ts`) & Route Handlers (`src/app/api/**/route.ts`)
- **Domain Logic:** `src/lib/domain/` (assignments, github events, issues, metrics, PR scoring, reports, slides, retrieval)
- **Analyser Pipeline:** `src/lib/analyser/` (source ingestion, AST parsing with Tree-sitter WASM, secret filtering, chunking, AI summaries)
- **AI Gateway:** `src/lib/ai.ts` (multi-provider gateway with auto-failover between Gemini, Groq, Grok, and Anthropic)
- **Database Access:** `src/lib/db.ts` (PrismaClient singleton)
- **Scheduler:** `src/instrumentation.ts` (dev) / Vercel Cron (production)

## Conventions (from the real codebase)
- **Auth/session helper:** `src/lib/auth.ts` (`getUser`, `requireUser`, `requirePermission`, `createSession`, `destroySession`, `homeFor`)
- **Role/permission helper:** `src/lib/rbac.ts` (`can(role, permission)`, `ROLE_PERMISSIONS`, `Permission`)
- **Cryptography helper:** `src/lib/crypto.ts` (`encrypt`, `decrypt`, `sha256`, `newToken`)
- **Email delivery helper:** `src/lib/mailer.ts` (`sendEmail` via Resend / DB logging fallback, `notify`)
- **Audit logging:** `src/lib/audit.ts` (`audit(orgId, userId, action, targetId)`)
- **Storage helper:** `src/lib/storage.ts` (`saveFile`, `readFile`)
- **Validation schemas:** Zod schemas defined inline at server action boundaries (e.g. `signupSchema` in `src/app/actions.ts`, `pathSchema` in `src/app/paths/actions.ts`)
- **Error handling pattern:** Return user-safe `{ error: string }` objects from server actions; never swallow exceptions or throw unhandled 500s.
- **Test setup:** `scripts/smoke.ts` (end-to-end smoke verification) & Vitest (`npm test`)

## Data Flow Notes
- **Organisation & Users:** `Organisation` ──1:N──> `User`, `Invitation`, `AuditLog`, `EmailLog`, `Project`
- **Learning Paths:** `LearningPath` ──1:N──> `PathSection` ──1:N──> `PathItem` (type: CONTENT \| CHUNK \| HANDOUT)
- **Assignments:** `Assignment` connects `User` (candidate) to `LearningPath`, tracks `PathItemProgress` and active time logs
- **Tasks & Pull Requests:** `Task` (linked to `Project`/`Repository` and optionally GitHub issue number) ──1:N──> `TaskAssignment` ──1:N──> `PullRequest` (scored across 7 pillars in `src/lib/domain/score.ts`)
- **Reports:** `Report` (WEEKLY \| FINAL) computes metrics across learning completion, task timeliness, and PR scores, with anti-hallucination validation (`numbersGrounded`).
