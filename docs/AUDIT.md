# BrainWhite Repository Production Audit (AUDIT.md)
*Generated according to AGENTS.md §2 and docs/AGENT_PROMPTS.md #1*

---

## Executive Summary & Scorecard

BrainWhite is architecturally solid with a modern Next.js 15 App Router foundation, WebAssembly Tree-sitter AST parser, multi-provider AI gateway (Gemini/Groq/Grok/Anthropic), and Supabase PostgreSQL schema. However, because the repository originated as an MVP prototype, several patterns violate production standards and will fail on Vercel serverless or present security vulnerabilities.

| Category | Status | Severity | Total Issues |
|---|---|---|---|
| **Serverless Reality (Vercel)** | ⚠️ Failing | **CRITICAL** | 4 issues |
| **Security & Authorization (IDOR/Auth)** | ⚠️ Partial | **HIGH / CRITICAL** | 4 issues |
| **Testing & CI Quality** | ❌ Missing | **HIGH** | 2 issues |
| **Database & Migrations** | ⚠️ Partial | **HIGH** | 2 issues |
| **Mock & Placeholder Code** | ℹ️ Minor | **LOW** | 3 issues |
| **Config & Secret Management** | ⚠️ Unvalidated | **MEDIUM** | 2 issues |

---

## Ranked Findings by Severity

### 🔴 Severity 1: Critical Production Blockers (Will Crash on Vercel or Cause Data Loss)

#### 1.1 Local Disk Handout Storage (`src/lib/storage.ts`)
* **File:** `src/lib/storage.ts` (lines 7–18), called by `src/app/paths/actions.ts` (line 160) and `src/app/api/handouts/[id]/route.ts`.
* **Issue:** Handout uploads write files to `path.join(process.cwd(), "storage")`. On Vercel, serverless containers have a **strictly read-only filesystem** (`EROFS: read-only file system`). Files will fail to upload, or if written to `/tmp`, will vanish between serverless function invocations.
* **Production Fix Required:** Migrate handout storage to Supabase Storage (already configured) or Vercel Blob / S3.

#### 1.2 "Fire and Forget" Repo Sync Killed Mid-Execution (`src/app/actions.ts`)
* **File:** `src/app/actions.ts` (lines 221, 230): `void syncRepository(repo.id);`
* **Issue:** In serverless runtimes, as soon as an action returns an HTTP response, the container freeze/terminates. Calling `void syncRepository(...)` without awaiting pauses or terminates repository ingestion midway, leaving the repository permanently locked in `syncStatus: "RUNNING"`.
* **Production Fix Required:** Offload heavy ingestion to an asynchronous job queue (e.g. Inngest / BullMQ / QStash) or run via a long-running background route with a max execution timeout.

#### 1.3 In-Process `setInterval` Background Scheduler (`src/instrumentation.ts`)
* **File:** `src/instrumentation.ts` (lines 5–15).
* **Issue:** Uses `globalThis.__brainwhiteTimer = setInterval(..., 15 * 60 * 1000)` to execute deadline checks and report jobs. Serverless lambdas freeze between requests, so `setInterval` never triggers in production.
* **Production Fix Required:** Disable the in-memory timer on serverless (`DISABLE_SCHEDULER="true"`) and implement a dedicated cron route (`/api/cron/jobs`) triggered via Vercel Cron (`vercel.json`) with `CRON_SECRET` authentication.

#### 1.4 Unprotected Cross-Tenant IDOR in Slide Decks (`src/lib/domain/slides.ts`)
* **File:** `src/lib/domain/slides.ts` (lines 177–204).
* **Issue:** `getSlideDeck(id)`, `updateSlideDeck(id)`, and `deleteSlideDeck(id)` query only by `id` without checking `orgId`. A user from Organisation A can read, modify, or delete slide decks belonging to Organisation B by guessing or enumerating IDs.
* **Production Fix Required:** Require `orgId` in `getSlideDeck`, `updateSlideDeck`, and `deleteSlideDeck`, and verify `where: { id, orgId }` on all operations.

#### 1.5 Missing Production Guard on Seed Script (`scripts/seed.ts`)
* **File:** `scripts/seed.ts` (lines 8–28).
* **Issue:** Seeds default test accounts (`owner@demo.test`, `manager@demo.test`, `candidate@demo.test`) with hardcoded password `demo12345`. If `npm run setup` is run in production or staging, it creates known backdoor credentials.
* **Production Fix Required:** Refuse to seed if `NODE_ENV === "production"`.

---

### 🟠 Severity 2: High Severity (Production Requirements & Integrity)

#### 2.1 Complete Absence of Automated Test Suite
* **Files:** Entire repo (no `*.test.ts` or `*.spec.ts` in `src/`, `package.json` lacks a `"test"` script).
* **Issue:** CI workflow (`.github/workflows/ci.yml`) runs `npm test --if-present`, which silently passes because Vitest/Jest is not installed. There are no regression tests for RBAC, auth, or PR scoring.
* **Production Fix Required:** Install `vitest`, add `"test": "vitest run"` to `package.json`, and create unit tests for:
  - Auth sessions & permission checks (`can()`)
  - Cross-org tenant isolation
  - PR scoring calculations (`scorePr()`)

#### 2.2 Missing Prisma Migrations Directory (`prisma/migrations`)
* **File:** `prisma/schema.prisma`
* **Issue:** The repository has been relying on `prisma db push`. In production, schema changes must be versioned migrations (`prisma migrate dev` / `prisma migrate deploy`) to guarantee rollback safety and zero drift.
* **Production Fix Required:** Generate the baseline PostgreSQL migration: `npx prisma migrate dev --name init`.

#### 2.3 Ephemeral Diagram Route Not Persisted (`src/app/api/diagrams/route.ts`)
* **File:** `src/app/api/diagrams/route.ts` (lines 96–105).
* **Issue:** Diagrams are generated via AI and assigned a temporary ID `diagram_${Date.now()}`, but are never written to Prisma. Refreshing or sharing a diagram causes data loss.
* **Production Fix Required:** Add a `Diagram` model to `prisma/schema.prisma` scoped by `orgId` and persist diagram records.

#### 2.4 Auth Error State Disconnected in Login/Signup UI
* **Files:** `src/app/login/page.tsx` (lines 24–28) and `src/components/ui/auth-section-1.tsx` (lines 12–25).
* **Issue:** When `login()` returns `{ error: "Invalid email or password" }`, `handleLogin` calls `setError(result.error)`, but does NOT re-throw or pass `error` to `AuthSectionOne`. The user sees the form stop loading without displaying the error banner.
* **Production Fix Required:** Pass `error` prop from `LoginPage`/`SignupPage` to `AuthSectionOne`, or throw an error from `onLogin`/`onSignup` so `AuthSectionOne` catches and displays it.

#### 2.5 Missing Rate Limiting on Public Endpoints
* **Files:** `/login`, `/signup`, `/api/chat`, `/api/support-chat`.
* **Issue:** No rate limiting or lockout protection against brute-force attacks or AI token exhaustion.
* **Production Fix Required:** Implement Upstash Redis rate limiting or in-memory sliding window for auth and AI endpoints.

---

### 🟡 Severity 3: Medium Severity (Configuration & Observability)

#### 3.1 Untyped, Distributed `process.env` Calls
* **Files:** 25+ files directly accessing `process.env`.
* **Issue:** No single validated config schema. If an essential environment variable is missing (e.g. `ENCRYPTION_KEY` or `DATABASE_URL`), the app fails silently or crashes deep inside helper functions.
* **Production Fix Required:** Create `src/lib/config.ts` using `zod` to validate all environment variables at startup and fail fast.

#### 3.2 Mock Key Fallback in PostHog Provider
* **File:** `src/components/providers/posthog-provider.tsx` (line 11).
* **Issue:** `posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || 'phc_mock', ...)`.
* **Production Fix Required:** Only initialize PostHog when `NEXT_PUBLIC_POSTHOG_KEY` is present; otherwise gracefully no-op without fake keys.

#### 3.3 Untyped Prisma Casts for SlideDecks
* **File:** `src/lib/domain/slides.ts` (lines 161, 178, 199, 203): `(db as any).slideDeck`
* **Issue:** Uses `as any` because Prisma Client was not re-generated after adding the `SlideDeck` model to `schema.prisma`.
* **Production Fix Required:** Run `npx prisma generate` so `db.slideDeck` is strongly typed.

---

### 🟢 Severity 4: Low Severity (UI & Cleanup)

#### 4.1 Mock Text in Marketing Hero Component
* **File:** `src/components/hero.tsx` (lines 196, 207).
* **Finding:** Contains `// FIXME: Rahul said this breaks on staging` and `// TODO: refactor this 3 years ago` inside the animated code terminal illustration. (Harmless visual mockup, but should be documented).

#### 4.2 Unused Component Stubs
* **Files:** `src/components/experience/HeroLiquidCanvas.tsx`, `src/components/motion/smooth-scroll.tsx`.
* **Finding:** Unused Three.js / Lenis stubs not imported anywhere.

---

## Recommended Step-by-Step Resolution Roadmap

1. **Step 1: Auth & Login Error Display Fix** — Connect error state between `login/page.tsx`, `signup/page.tsx`, and `auth-section-1.tsx`.
2. **Step 2: Tenant Isolation in Slides & Diagrams** — Add `orgId` enforcement to `src/lib/domain/slides.ts` and persist diagrams in Prisma.
3. **Step 3: Object Storage for Handouts** — Update `src/lib/storage.ts` to use Supabase Storage instead of local disk.
4. **Step 4: Centralized Config Module** — Create `src/lib/config.ts` with strict Zod validation.
5. **Step 5: Automated Testing Suite** — Install `vitest` and implement unit tests for auth, RBAC permissions, and PR scoring.
6. **Step 6: Background Jobs via Vercel Cron** — Replace `instrumentation.ts` in-process scheduler with `/api/cron/jobs`.
