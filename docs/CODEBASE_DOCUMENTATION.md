# BrainWhite — Comprehensive Developer Documentation  
> Target audience: engineers joining the team, contributors picking up backlog items, and onboarding candidates exploring the product itself.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [High-Level System Architecture](#2-high-level-system-architecture)
3. [End-to-End Data Flow](#3-end-to-end-data-flow)
4. [Directory Layout](#4-directory-layout)
5. [Core Module Reference](#5-core-module-reference)
   - 5.1 [Codebase Analyser — `src/lib/analyser/`](#51-codebase-analyser--srclibanalyser)
   - 5.2 [Domain Services — `src/lib/domain/`](#52-domain-services--srclibdomain)
   - 5.3 [Shared Library — `src/lib/`](#53-shared-library--srclib)
   - 5.4 [App Router — `src/app/`](#54-app-router--srcapp)
6. [Data Model — `prisma/schema.prisma`](#6-data-model--prismaschemaprisma)
7. [Role & Permission Model](#7-role--permission-model)
8. [Authentication System](#8-authentication-system)
9. [Local Development Setup](#9-local-development-setup)
10. [Environment Variables Reference](#10-environment-variables-reference)
11. [Testing GitHub Events with the Dev Simulator](#11-testing-github-events-with-the-dev-simulator)
12. [Email Logging in Development](#12-email-logging-in-development)
13. [AI Provider Integration](#13-ai-provider-integration)
14. [Deployment & Production Checklist](#14-deployment--production-checklist)
15. [Known Gaps & Extension Roadmap](#15-known-gaps--extension-roadmap)
16. [Contribution Guidelines](#16-contribution-guidelines)

---

## 1. Product Overview

BrainWhite is an AI-assisted engineering onboarding platform. It ingests an organisation's codebase, constructs a navigable knowledge graph, and uses that graph as the substrate for structured onboarding paths, GitHub-tracked tasks, and evidence-based progress reports.

The platform is built for four roles:

| Role | Primary concerns |
|---|---|
| **Owner** | Org settings, user management, audit log, billing |
| **Manager** | Codebase analysis, learning path creation, task assignment, candidate oversight, reports |
| **Mentor** | Candidate progress monitoring, task feedback, mentor rubric scoring |
| **Candidate** | 3-pane learning workspace, GitHub task completion, AI-assisted chat |

The core thesis: everything the manager sees—progress percentages, risk flags, PR quality scores, report narratives—is computed from real events (learning events, GitHub webhook events, task history). No numbers are invented by an LLM.

---

## 2. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           BrainWhite Platform                           │
│                                                                         │
│  ┌──────────────┐    ┌──────────────────────────────────────────────┐   │
│  │  GitHub Repo │───▶│  ANALYSER PIPELINE  (src/lib/analyser/)      │   │
│  │  (public or  │    │  source.ts → filter.ts → secrets.ts          │   │
│  │   private)   │    │  → parse.ts (Tree-sitter WASM)               │   │
│  └──────────────┘    │  → modules.ts → chunk.ts → summarise.ts      │   │
│                      └────────────────────┬─────────────────────────┘   │
│                                           │ writes                      │
│                                           ▼                             │
│                      ┌──────────────────────────────────────────────┐   │
│                      │  KNOWLEDGE GRAPH  (Postgres / SQLite)        │   │
│                      │  Organisation → Project → Repository         │   │
│                      │  → Module → File → Symbol → Chunk            │   │
│                      │  → GraphEdge (IMPORTS / DEPENDS_ON)          │   │
│                      └────────────────────┬─────────────────────────┘   │
│                                           │ reads                       │
│                            ┌──────────────┴───────────────────┐         │
│                            │                                  │         │
│                   ┌────────▼────────┐              ┌──────────▼──────┐  │
│                   │  PATH BUILDER   │              │  RETRIEVAL      │  │
│                   │  /paths         │              │  domain/        │  │
│                   │  LearningPath   │              │  retrieve.ts    │  │
│                   │  PathSection    │              │  (keyword →     │  │
│                   │  PathItem       │              │   vector later) │  │
│                   └────────┬────────┘              └──────────┬──────┘  │
│                            │ assign                           │         │
│                            ▼                                  ▼         │
│                   ┌────────────────┐              ┌──────────────────┐  │
│                   │  ASSIGNMENT    │              │  3-PANE          │  │
│                   │  domain/       │              │  WORKSPACE       │  │
│                   │  assign.ts     │◀─────────────│  /learn/         │  │
│                   │  Task +        │              │  code | explain  │  │
│                   │  TaskAssignment│              │  | AI chat       │  │
│                   └────────┬───────┘              └──────────────────┘  │
│                            │                                            │
│  ┌──────────────┐          │                                            │
│  │  GitHub      │          ▼                                            │
│  │  Webhooks    │───▶ ┌─────────────────┐    ┌─────────────────────┐   │
│  │  /api/github │     │  GITHUB EVENT   │───▶│  METRICS ENGINE     │   │
│  │  /webhook    │     │  PROCESSOR      │    │  domain/metrics.ts  │   │
│  └──────────────┘     │  domain/        │    │  computeMetrics()   │   │
│  ┌──────────────┐     │  github.ts      │    └──────────┬──────────┘   │
│  │  Dev         │───▶ │  PR scoring     │               │              │
│  │  Simulator   │     │  domain/        │               ▼              │
│  │  /tasks/[id] │     │  score.ts       │    ┌─────────────────────┐   │
│  └──────────────┘     └─────────────────┘    │  REPORTS ENGINE     │   │
│                                              │  domain/reports.ts  │   │
│  ┌──────────────┐                            │  templateNarrative()│   │
│  │  Scheduler   │───────────────────────────▶│  + LLM enrichment   │   │
│  │  instrumen-  │                            │  → Dashboard        │   │
│  │  tation.ts   │                            └─────────────────────┘   │
│  └──────────────┘                                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

**Technology stack:**

| Concern | Choice |
|---|---|
| Framework | Next.js 15 (App Router, React Server Components) |
| Language | TypeScript |
| ORM | Prisma 6 |
| Database (dev) | PostgreSQL (also SQLite-compatible in schema) |
| Database (prod) | PostgreSQL (Neon / Supabase / Vercel Postgres) |
| Auth | Custom DB sessions (httpOnly cookies, 7-day TTL) |
| AST Parsing | Tree-sitter via WebAssembly (`web-tree-sitter`) |
| AI Gateway | Multi-provider: Gemini, Groq, Grok, Anthropic (auto-failover) |
| Email | Resend (dev: terminal log + `EmailLog` DB table) |
| Styling | Tailwind CSS v4 |
| Testing | Vitest |

---

## 3. End-to-End Data Flow

### Phase 1 — Repository Ingestion (turns code into knowledge)

```
Manager connects repo (owner/name or local path)
    │
    ▼
addRepository() server action
    │
    ▼
syncRepository(repoId) — src/lib/analyser/pipeline.ts
    │
    ├─ 1. loadSource()     — downloads tarball from GitHub or reads local folder
    ├─ 2. makeFilter()     — applies .gitignore + .brainwhiteignore + size limits
    ├─ 3. redactSecrets()  — strips API keys / tokens before storage
    ├─ 4. parseSource()    — Tree-sitter AST: symbols (functions, classes, interfaces)
    │                        + import edges per file
    ├─ 5. modulePathFor()  — groups files into logical modules by directory
    ├─ 6. buildChunks()    — splits files into stable, function-aligned learning chunks
    ├─ 7. heuristicChunk() — generates structural summary for each chunk
    │    └── callAi()      — optionally enriches top chunks with LLM summaries
    ├─ 8. GraphEdge rows   — IMPORTS (file→file) + DEPENDS_ON (module→module)
    └─ 9. Repository.syncStatus = "HEALTHY"
```

### Phase 2 — Learning Path Creation

```
Manager opens /paths → path builder UI
    │
    ▼
Knowledge graph nodes (Chunks) are displayed on the left panel.
Manager drags chunks into a PathSection → PathItem (type=CHUNK, refId=chunk.id).
Manager adds CONTENT items (markdown notes), Handout attachments, and Tasks.
Manager publishes the path (status = PUBLISHED).
Manager assigns the path to a candidate via createAssignment()
    │
    ▼
Assignment row created → TaskAssignment rows created (one per Task, dueAt = startDate + task.deadlineDay)
Candidate receives invite email → navigates to /connect-github → then /learn
```

### Phase 3 — Candidate Learning Workspace

```
Candidate opens /learn → assignment list
    │
    ▼
Clicks "Continue" → /learn/[assignmentId]/[itemId]
    │
    ├─ Left pane   — source code viewer (file content from DB, highlighted line range)
    ├─ Middle pane — Explanation tab (chunk summary), Handouts tab, Notes tab
    └─ Right pane  — AI chat
                     ask() → POST /api/chat
                               → retrieve() — keyword scoring over all chunks (org-scoped)
                               → callAi()   — LLM answer grounded in retrieved snippets
                               ← {answer, citations}
                     Citation button clicked → left pane jumps to cited line range

ProgressEvent rows written:
    OPENED     — when item first viewed
    TIME       — heartbeat every 30s while visible and active (< 2 min idle)
    COMPLETED  — when "Mark complete" clicked
```

### Phase 4 — GitHub Task Tracking

```
Real path:
GitHub repo webhook → POST /api/github/webhook
    │
    ▼
verifyWebhookSignature() → processGithubEvent(orgId, event, payload)

Dev simulator path:
Manager clicks Dev Simulator buttons in /tasks/[id]
    │
    ▼
Server action simulateGithubEvent() → processGithubEvent(orgId, event, syntheticPayload)

Both paths converge at processGithubEvent():
    ├─ Matches GitHub login to User.githubUsername (org-scoped, only linked candidates)
    ├─ Finds the TaskAssignment via issue reference in PR title/body/branch name
    ├─ Creates/updates PullRequest row with additions, deletions, files, commit messages
    ├─ Tracks conflicts (conflictCount, conflictSince, conflictSeconds)
    ├─ Updates TaskAssignment.status (NOT_STARTED → IN_PROGRESS → IN_REVIEW → DONE)
    └─ Calls scorePr() → PullRequest.qualityScore + qualityBreakdown + feedback
```

### Phase 5 — Metrics, Reports, and Dashboard

```
computeMetrics(assignmentId, start, end) — src/lib/domain/metrics.ts
    │
    Reads: ProgressEvent, ChatMessage, GithubEvent, PullRequest, TaskAssignment
    Returns: Metrics object (learning, tasks, github, qualitative, overall sections)
    │
    ▼
templateNarrative(metrics, type) — deterministic sentences over metric values
    └── llmNarrative()           — optional LLM rewrite; rejected if any new numbers appear
    │
    ▼
Report row saved → email sent to mentor + path creator → Dashboard updated

Automated via src/instrumentation.ts scheduler (every 15 min):
    runJobs() → 24h task reminders, overdue alerts, weekly reports, final reports
```

---

## 4. Directory Layout

```
BRAINWHITE-PRODUCT/
│
├── prisma/
│   ├── schema.prisma           # Single source of truth for all data models
│   └── migrations/             # Applied Postgres migrations (never edit applied ones)
│
├── scripts/
│   ├── seed.ts                 # Creates demo org, users, path, and analyses this repo
│   └── smoke.ts                # Manual end-to-end smoke test script
│
├── src/
│   ├── app/                    # Next.js App Router: pages + server actions
│   │   ├── actions.ts          # Top-level server actions (signup, login, addRepository…)
│   │   ├── api/                # Route handlers (auth, chat, github webhook, progress…)
│   │   ├── dashboard/          # Manager dashboard (metrics, cohort table)
│   │   ├── learn/              # Candidate workspace (/learn/[assignmentId]/[itemId])
│   │   ├── paths/              # Path builder (/paths/[id])
│   │   ├── projects/           # Codebase browser + repo management
│   │   ├── tasks/              # Task list + Dev Simulator
│   │   ├── team/               # User management, invitations
│   │   ├── people/             # Per-candidate dossier page
│   │   ├── reports/            # Report detail view + PDF export
│   │   ├── audit/              # Audit log (Owner only)
│   │   ├── slides/             # AI slide deck builder
│   │   ├── login/ signup/      # Auth pages
│   │   ├── invite/             # Invitation acceptance flow
│   │   ├── forgot-password/    # Password reset request
│   │   ├── reset-password/     # Password reset confirmation
│   │   └── verify-email/       # Email verification handler
│   │
│   ├── components/             # Shared React components
│   │   ├── Shell.tsx           # App shell: sidebar navigation, user badge, layout
│   │   ├── SidebarNav.tsx      # Role-aware navigation item renderer
│   │   ├── Workspace.tsx       # 3-pane candidate learning workspace
│   │   └── ui/                 # Design system primitives
│   │
│   ├── lib/
│   │   ├── analyser/           # Codebase ingestion pipeline (see §5.1)
│   │   ├── domain/             # Core business logic (see §5.2)
│   │   ├── ai.ts               # Multi-provider AI gateway with auto-failover
│   │   ├── auth.ts             # Session helpers: getUser, requirePermission, homeFor
│   │   ├── audit.ts            # audit(orgId, userId, action, targetId)
│   │   ├── crypto.ts           # encrypt/decrypt (AES-256-GCM), sha256, newToken
│   │   ├── db.ts               # PrismaClient singleton
│   │   ├── mailer.ts           # sendEmail() — Resend or terminal log fallback
│   │   ├── rbac.ts             # PERMISSIONS table + can(role, permission)
│   │   └── storage.ts          # saveFile / readFile for handout attachments
│   │
│   └── instrumentation.ts      # Next.js instrumentation hook: 15-min scheduler
│
├── docs/
│   ├── ARCHITECTURE.md         # Layer diagram + convention reference (read before coding)
│   ├── PRODUCTION_READINESS.md # Pre-launch checklist + env var table
│   ├── CODEBASE_DOCUMENTATION.md  # This document
│   ├── AGENT_PROMPTS.md        # LLM system prompts used in the product
│   ├── AUDIT.md                # Audit log action catalogue
│   └── REPORT_METRICS.md       # Full definition of every metric computed
│
├── .env.example                # Every accepted env var with comments
├── AGENTS.md                   # Engineering rules — read before every task
└── package.json
```

---

## 5. Core Module Reference

### 5.1 Codebase Analyser — `src/lib/analyser/`

The analyser is a pure data pipeline. It has no UI dependency. The entry point is `pipeline.ts:syncRepository()`.

#### `source.ts` — Repository acquisition

**Exports:** `loadSource(source, location, branch, token?): Promise<LoadedSource>`

Two modes:

- `source === "local"` — reads a folder path on the server. Gated behind `ALLOW_LOCAL_REPOS=true`. Disabled in production.
- `source === "github"` — downloads a tarball from `codeload.github.com`, extracts to a temp directory, fetches the latest commit SHA from the GitHub API. Cleans up after the pipeline finishes.

GitHub authentication precedence: organisation-level GitHub App token (`getOrgGithubToken`) → `GITHUB_TOKEN` env var → unauthenticated (public repos only).

#### `filter.ts` — File exclusion

**Exports:** `makeFilter(gitignore, customIgnore): (path, size) => string | null`, `languageOf(path): string`

Skips:
- Directories: `node_modules`, `.git`, `dist`, `build`, `.next`, `__pycache__`, `venv`, and others in `IGNORED_DIRS`
- Binary file extensions: images, fonts, archives, compiled artefacts
- Lock files: `package-lock.json`, `yarn.lock`, `Cargo.lock`, etc.
- Minified files: `.min.js`, `.min.css`
- Files larger than 300 KB
- Paths matching `.gitignore` or the repo's custom ignore list (`Repository.customIgnore`)

Language detection maps file extensions to language strings used by Tree-sitter and downstream logic.

#### `secrets.ts` — Secret redaction

**Exports:** `redactSecrets(text): { text: string; count: number }`

Applies regex patterns to replace tokens that look like API keys, private keys, connection strings, and JWT secrets with `[REDACTED]` before anything is stored in the database or sent to an LLM. The count of redactions per file is stored on the `File` row.

#### `parse.ts` — Tree-sitter AST parsing

**Exports:** `parseSource(lang, source): Promise<ParseResult | null>`, `isParsable(lang): boolean`

Supported languages: `javascript`, `typescript`, `tsx`, `python`, `java`.

For each supported file, `parseSource` returns:
- `symbols` — an array of `ParsedSymbol` objects: `{ kind, name, signature, doc, startLine, endLine, depth }`
  - Kinds: `class`, `function`, `method`, `interface`
  - `doc` is the JSDoc / Python docstring / block comment immediately preceding the symbol
  - `depth` distinguishes top-level (`0`) from class members (`1`)
- `imports` — module specifiers from all `import` / `from` statements

The parser uses `web-tree-sitter` loaded via its `.cjs` build (not the ESM build) using a direct `require()` call to prevent the Next.js bundler from rewriting internal paths. WASM grammar files are loaded from `tree-sitter-wasms/out/`.

#### `modules.ts` — Directory-to-module grouping

**Exports:** `modulePathFor(filePath): string`, `moduleNameFor(path): string`, `resolveImport(fromPath, spec, lang, allPaths): string | null`

Groups files by their first-level directory (e.g., all files under `src/lib/domain/` become the `domain` module). `resolveImport` resolves relative import paths to canonical file paths for building the dependency graph.

#### `chunk.ts` — Learning chunk generation

**Exports:** `buildChunks(repoId, filePath, content, symbols): ChunkDraft[]`

The chunking algorithm:
1. If no symbols are found (non-parseable files, config files), the file is split into 80-line sliding windows.
2. For parseable files, top-level symbols (`depth === 0`) are the base units.
3. Large classes (> 120 lines) are expanded: each method becomes its own unit.
4. Small adjacent units (< 25 lines each) are grouped up to a combined limit of 80 lines to avoid creating trivially small chunks.
5. No function body is ever split across two chunks.
6. The leading imports/header is absorbed into the first chunk.

Chunk IDs are stable hashes of `repoId + filePath + symbolNames`, meaning unchanged code retains the same chunk ID across syncs. The `contentHash` changes when the code changes, allowing the UI to show a "code changed" badge on previously completed items.

Difficulty: `EASY` (< 40 lines), `MEDIUM` (40–99 lines), `HARD` (≥ 100 lines).  
Estimated reading time: 1 minute per 25 lines.

#### `summarise.ts` — Chunk and module summarisation

**Exports:** `heuristicChunk(...)`, `summariseChunk(...)`, `summariseRollup(...)`, `buildConceptualModuleSummary(...)`

Two-tier strategy:
1. **Heuristic (always available):** Structural templates filled from symbol names, kinds, file path, and line counts. Deterministic and free.
2. **LLM (when configured):** Calls `callAi()` for the top chunks per module, capped by `MAX_LLM_SUMMARIES` (default 15). The LLM is prompted to write 2–3 technical sentences as a principal engineer. If the LLM times out or fails twice, the heuristic is used for remaining chunks.

#### `pipeline.ts` — Orchestrator

**Exports:** `syncRepository(repoId): Promise<string>`

Runs the 8-stage pipeline described in §3 above. Key design decisions:
- Database persistence uses a concurrency of 2 to stay within connection pool limits.
- Chunks are batch-inserted in groups of 40 to avoid Postgres parameter limits.
- A `SyncRun` row tracks progress, file counts, secrets redacted, summaries generated, and final SHA.
- Errors are caught and recorded; `Repository.syncStatus` is set to `FAILED` on any exception.
- The pipeline is called with `void syncRepository(...)` from server actions (fire-and-forget) — this is a known gap (see §15).

---

### 5.2 Domain Services — `src/lib/domain/`

#### `assign.ts` — Learning path assignment

**Exports:** `createAssignment(opts)`, `assignmentProgress(assignmentId)`

`createAssignment` creates an `Assignment` row and one `TaskAssignment` row per `Task` on the path. Task due dates are computed as `startDate + task.deadlineDay * 24h`. Sends the candidate an invite email (or logs it in dev). Guards against duplicate assignment of the same path to the same user.

`assignmentProgress` returns `{ items, done, total, completed, pct }` for a given assignment — used by the candidate's learning index page and the path builder preview.

#### `retrieve.ts` — Chat retrieval

**Exports:** `retrieve(orgId, question, opts): Promise<Snippet[]>`, `tokenize(query): string[]`

Current implementation: keyword scoring over all chunks in the organisation. Scoring weights:
- Title match: +4 per token
- File path match: +2 per token
- Summary match: +1 per token
- Code body occurrence: +min(hits, 5) per token
- Currently-viewed chunk: +3 bonus if score > 0
- Same module as current chunk: +1 bonus

Handout text (`extractedText`) is searched with the same token scoring.

Results are sorted by score and capped at 5 (configurable). The `Snippet` return shape (`n, kind, repoId, path, start, end, title, text, score`) is a **stable contract** — the vector-search replacement must preserve it.

#### `github.ts` — GitHub event processing

**Exports:** `processGithubEvent(orgId, event, payload): Promise<string>`, `setTaskStatus(taId, status, why)`

Single entry point for both real webhooks and the dev simulator. Handles events:
- `pull_request` — creates or updates `PullRequest`, auto-links to `TaskAssignment` by issue number reference in PR title/body/branch, tracks conflict timing, rescores
- `pull_request_review` — increments `reviewRounds`, records review events
- `check_run` / `check_suite` — updates `ciStatus`, sets `ciFirstTryPass`
- `push` — records commit events

Candidate matching: `User.githubUsername` is compared case-insensitively against the event sender. Only candidates linked to the organisation and with a connected GitHub username are recorded — anonymous pushes are ignored for privacy.

Task auto-linking: searches for `Closes #N`, `Fixes #N`, `Resolves #N` in PR text, or `task-N`/`issue-N` in branch name. Only links automatically when unambiguous (exactly one open task matches).

#### `score.ts` — PR quality scoring

**Exports:** `scorePr(facts: PrFacts): { score, parts, feedback }`

Deterministic rubric across 7 pillars:

| Pillar | Weight | Scoring logic |
|---|---|---|
| `size` | 15% | ≤ 200 lines = 100; ≤ 400 = 80; ≤ 800 = 50; > 800 = 25 |
| `description` | 20% | PR body ≥ 200 chars = 100; ≥ 80 = 75; ≥ 20 = 50; < 20 = 20 |
| `tests` | 20% | Test file changed = 100; no code files changed = 70; no tests = 30 |
| `ci` | 15% | CI success first try = 100; success (not first try) = 80; failure = 40 |
| `review` | 15% | 0 rounds = 100; 1 round = 80; 2 rounds = 60; 3+ rounds = 35 |
| `commits` | 10% | % of commit messages that are ≥ 12 chars and not `wip/fix/update/misc` |
| `conflicts` | 5% | 0 conflicts = 100; 1 = 75; 2+ = 50 |

The `feedback` JSON contains `strengths` and `improve` arrays — displayed in the UI on the task page.

#### `metrics.ts` — Metrics computation

**Exports:** `computeMetrics(assignmentId, start, end): Promise<Metrics>`

The single source of truth for all dashboard and report numbers. Reads from: `ProgressEvent`, `ChatMessage`, `GithubEvent`, `PullRequest`, `TaskAssignment`, `MentorFeedback`. Never writes.

Output sections:

- `learning` — completion %, items done this period, active minutes, schedule adherence, handouts opened, chat question topics
- `tasks` — counts, on-time rate, average cycle time, blocked hours, overdue list
- `github` — commit count, PRs opened/merged/closed, average score, score trend, sub-score averages, review rounds, conflict stats
- `qualitative` — mentor rubric average, recent mentor notes
- `overall` — readiness score (weighted composite), risk flags, last activity date

Risk flags are raised when: idle > 3 days, schedule adherence < 80%, average PR score < 50, any task overdue.

#### `reports.ts` — Report generation and scheduling

**Exports:** `generateReport(assignmentId, type)`, `runJobs()`, `templateNarrative(metrics, type)`, `numbersGrounded(text, facts)`

`generateReport`:
1. Calls `computeMetrics` for the report period
2. Builds a deterministic narrative via `templateNarrative` (every sentence is a template over metric values)
3. Optionally calls the LLM to improve prose — but `numbersGrounded` rejects the LLM output if it introduces any number not present in the original facts
4. Saves a `Report` row and emails the narrative to the mentor and path creator

`runJobs` is called every 15 minutes by the scheduler:
- 24-hour deadline reminders for tasks due the next day
- Overdue task alerts to mentors
- Weekly reports for assignments where ≥ 7 days have passed since the last report
- Final reports for completed assignments that have no final report yet

#### `github-app.ts` — GitHub App token management

**Exports:** `getOrgGithubToken(orgId): Promise<string | null>`

Returns the best available GitHub token for an org: GitHub App installation token (generated on-demand via the installation ID) → decrypted custom PAT → `GITHUB_TOKEN` env var → `null`. Tokens are AES-256-GCM encrypted at rest using `ENCRYPTION_KEY`.

---

### 5.3 Shared Library — `src/lib/`

| File | Purpose |
|---|---|
| `ai.ts` | Multi-provider gateway. Tries providers in order: Gemini → Groq → Grok → Anthropic. Respects per-task routing hints. Returns `{ text }` or throws after all providers fail. |
| `auth.ts` | `getUser()` reads the `pd_session` httpOnly cookie, looks up the session and user. `requireUser()` redirects to `/login` if no session. `requirePermission(perm)` additionally checks RBAC. `homeFor(role)` returns `/learn` for candidates, `/dashboard` for staff. |
| `audit.ts` | `audit(orgId, userId, action, targetId)` — appends a row to `AuditLog`. Called on every write operation that changes security-relevant state (user role changes, invitations, session creation, etc.). |
| `crypto.ts` | `encrypt(text, key)` / `decrypt(ciphertext, key)` — AES-256-GCM. `sha256(text)` — used for session token storage (never store plaintext tokens). `newToken()` — 32 bytes of crypto-random hex. |
| `db.ts` | PrismaClient singleton with global caching to avoid exhausting connection pools during Next.js hot-reload. |
| `mailer.ts` | `sendEmail(orgId, to, subject, body, opts?)` — sends via Resend if `RESEND_API_KEY` is set; otherwise logs to the terminal and writes to `EmailLog`. Always writes to `EmailLog` regardless. `notify(userId, title, body)` — creates an in-app `Notification` row. |
| `rbac.ts` | `PERMISSIONS` table (permission name → allowed roles[]). `can(role, permission)` — the single boolean check used throughout server actions and UI. |
| `storage.ts` | `saveFile` / `readFile` — local disk in development. Must be replaced with object storage (S3/R2) for production. |

---

### 5.4 App Router — `src/app/`

All pages are React Server Components by default. All mutations are **server actions** in `actions.ts` files co-located with their page. Every server action starts with `requireUser()` or `requirePermission(...)`.

#### Key server action files

| File | Actions |
|---|---|
| `src/app/actions.ts` | `signup`, `login` (via API routes), `addRepository`, `syncNow`, `linkGithubManual`, `saveCustomGithubPat`, `disconnectGithubApp` |
| `src/app/paths/actions.ts` | `createPath`, `updatePath`, `publishPath`, `deleteSection`, `addItem`, `reorderItems`, `addHandout`, `deleteHandout` |
| `src/app/people/actions.ts` | `generateWeeklyReport`, `generateFinalReport`, `runJobsNow`, `setMentorFeedback`, `overridePrScore` |
| `src/app/team/actions.ts` | `inviteUser`, `deactivateUser`, `changeRole`, `resendInvite`, `revokeInvite` |
| `src/app/tasks/actions.ts` | `createTask`, `updateTask`, `simulateGithubEvent`, `linkPrManual`, `setTaskBlocked`, `addTaskReviewer` |

#### Key API route handlers

| Route | Purpose |
|---|---|
| `POST /api/auth/login` | Email/password login — rate-limited (20 attempts/15 min per IP/email), bcrypt verify, session creation |
| `POST /api/auth/signup` | Org + user creation — rate-limited (10 attempts/15 min), Zod validation, bcrypt hash |
| `GET /api/auth/github/start` | Initiates GitHub OAuth (login, signup, or link modes) |
| `GET /api/auth/github/callback` | Handles GitHub OAuth redirect |
| `GET /api/auth/google/start` | Initiates Google OAuth |
| `GET /api/auth/google/callback` | Handles Google OAuth redirect |
| `POST /api/auth/logout` | Destroys session cookie and DB session |
| `POST /api/auth/resend-verification` | Re-sends email verification link |
| `POST /api/chat` | Candidate AI chat — retrieves snippets, calls LLM, writes `ChatMessage` |
| `GET /api/code` | Returns raw file content for the code viewer (auth required, org-scoped) |
| `POST /api/progress` | Records `ProgressEvent` rows (TIME heartbeats, OPENED, COMPLETED) |
| `POST /api/github/webhook` | Real GitHub webhook receiver — verifies HMAC signature, calls `processGithubEvent` |
| `GET /api/github/app/callback` | GitHub App installation callback — saves `installationId` to `Organisation` |

---

## 6. Data Model — `prisma/schema.prisma`

### Entity relationships overview

```
Organisation
    ├── User (1:N)
    │       ├── Session (1:N)
    │       ├── AuthToken (1:N) — password reset, email verification
    │       ├── OAuthAccount (1:N) — Google / GitHub OAuth links
    │       └── Notification (1:N)
    │
    ├── Invitation (1:N)
    ├── AuditLog (1:N)
    ├── EmailLog (1:N)
    │
    ├── Project (1:N)
    │       └── Repository (1:N)
    │               ├── Module (1:N)
    │               │       ├── File (1:N)
    │               │       │       └── Symbol (1:N)
    │               │       └── Chunk (1:N)
    │               ├── GraphEdge (1:N) — IMPORTS, DEPENDS_ON
    │               └── SyncRun (1:N)
    │
    ├── LearningPath (1:N)
    │       ├── PathSection (1:N)
    │       │       └── PathItem (1:N)
    │       │               └── Handout (0:N) — per-item handouts
    │       ├── Handout (1:N) — path-level handouts
    │       ├── Task (1:N)
    │       └── Assignment (1:N)
    │               ├── ProgressEvent (1:N)
    │               ├── TaskAssignment (1:N)
    │               │       └── PullRequest (0:N)
    │               ├── Report (1:N)
    │               └── MentorFeedback (1:N)
    │
    ├── Task (1:N) — also scoped to org, may reference LearningPath
    ├── Report (1:N)
    └── GithubEvent (1:N)
```

### Key model notes

**`Chunk`** — Has a manually assigned `id` (stable hash of `repoId + filePath + symbolNames`). This means `upsert` / `skipDuplicates` is used. The `contentHash` changes when code changes, enabling "content changed" detection without re-reading the file.

**`PullRequest`** — Has a unique constraint on `(repoFullName, number)` to prevent duplicate PR records from repeated webhook deliveries. `conflictSince` / `conflictSeconds` track time-in-conflict.

**`LoginAttempt`** — Not org-scoped (global rate limiting). `key` is normalised email or IP address. `lockedUntil` implements a 15-minute lockout after 5 consecutive failures.

**`AuthToken`** — Single-use. `usedAt` is set on consumption; a token with `usedAt != null` is rejected. Expires after 24 hours (email verification) or 1 hour (password reset).

**`GraphEdge`** — `fromKind` / `toKind` distinguish file-level IMPORTS edges from module-level DEPENDS_ON edges. The repo detail page renders module edges as a dependency graph.

**`Report.metrics`** — JSON-serialised `Metrics` object from `computeMetrics`. Stored verbatim so reports are reproducible and not recalculated on every view.

---

## 7. Role & Permission Model

Defined entirely in `src/lib/rbac.ts`. One lookup table, one function:

```typescript
export const PERMISSIONS = {
  "org:settings":        ["OWNER", "MANAGER"],
  "members:view":        ["OWNER", "MANAGER", "MENTOR"],
  "members:invite":      ["OWNER", "MANAGER"],
  "members:deactivate":  ["OWNER", "MANAGER"],
  "members:change-role": ["OWNER"],
  "audit:view":          ["OWNER"],
  "codebase:manage":     ["OWNER", "MANAGER"],
  "codebase:view":       ["OWNER", "MANAGER", "MENTOR"],
  "paths:manage":        ["OWNER", "MANAGER"],
  "learning:own":        ["OWNER", "MANAGER", "MENTOR", "CANDIDATE"],
};

export const can = (role: string, perm: Permission) =>
  PERMISSIONS[perm].includes(role);
```

**Rules:**
- Every server action and API route handler calls `requirePermission(perm)` or `requireUser()` first.
- Every database query includes `orgId` in the `where` clause. IDOR is prevented by never querying by `id` alone.
- The middleware (`src/middleware.ts`) protects route groups at the edge, redirecting unauthenticated users to `/login`.

---

## 8. Authentication System

### Session lifecycle

1. User submits login form → `POST /api/auth/login`
2. Server verifies password with bcrypt (cost 12), checks lockout (`LoginAttempt`)
3. `createSession(userId)` — generates a 32-byte random token, stores `sha256(token)` in `Session` table, sets `pd_session` cookie (httpOnly, sameSite=lax, secure in production, 7-day TTL)
4. Every authenticated request: `getUser()` reads the cookie, hashes it, finds the `Session`, returns the `User` with `org`
5. `destroySession()` deletes the `Session` row and clears the cookie

### Password security

- Hashed with bcrypt, cost factor 12
- Reset via single-use `AuthToken` (type=`PASSWORD_RESET`), 1-hour expiry, emailed to the user, destroys all existing sessions on use

### Email verification

- `AuthToken` (type=`EMAIL_VERIFICATION`), 24-hour expiry, sent on signup and on resend request
- `User.emailVerifiedAt` is null until the link is clicked; a banner appears in the Shell for unverified users
- Existing users at migration time are grandfathered (backfilled `emailVerifiedAt = createdAt`)

### OAuth (GitHub and Google)

- State parameter (CSRF protection) stored as a httpOnly cookie, verified on callback
- Fetches the user's primary verified email from the provider
- In `link` mode (candidates connecting GitHub identity): links `githubUserId` and `githubUsername` to the existing `User` row
- In `login`/`signup` mode: looks up or creates a `User` via `OAuthAccount`

### Rate limiting

- Implemented in `src/lib/domain/auth.ts` using `LoginAttempt` table
- Limits: signup 10/15min, login 20/15min, password reset 5/15min (per IP or email)
- Lockout: 5 consecutive failures → 15-minute block

---

## 9. Local Development Setup

### Prerequisites

- Node.js 20 or later (tested on Node 24)
- PostgreSQL 14 or later running locally, **or** a free cloud Postgres instance ([Neon](https://neon.tech), [Supabase](https://supabase.com))
- Git

### Step 1 — Clone and install

```bash
git clone https://github.com/Brainwhitee/BRAINWHITE-PRODUCT.git
cd BRAINWHITE-PRODUCT
npm install
```

### Step 2 — Configure environment variables

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

Open `.env` and set at minimum:

```env
# Replace with your actual Postgres connection string
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/brainwhite"

# Generate a fresh key: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY="<64 hex chars>"

APP_URL="http://localhost:3000"

# Leave blank — emails print to the terminal in dev
RESEND_API_KEY=""
```

**Creating the database** (if running PostgreSQL locally):

```powershell
$env:PGPASSWORD="yourpassword"
psql -U postgres -h localhost -c "CREATE DATABASE brainwhite;"
```

### Step 3 — Run migrations and seed demo data

```bash
npm run setup
```

This runs `prisma db push` (creates all tables from the schema) followed by `scripts/seed.ts` (creates the demo org, four demo users, a learning path, and analyses the BrainWhite repo itself as the sample codebase).

Expected output:

```
Environment variables loaded from .env
Analysing the codebase (a few seconds)...
[email] from=BrainWhite <onboarding@brainwhite.com> to=candidate@demo.test subject="New learning path: ..."
Seed complete. Log in at http://localhost:3000/login (password for all: demo12345):
  OWNER     owner@demo.test
  MANAGER   manager@demo.test
  MENTOR    mentor@demo.test
  CANDIDATE candidate@demo.test
```

### Step 4 — Start the dev server

```bash
npm run dev
```

The app is now running at **http://localhost:3000**.

### Step 5 — Verify the setup

Open http://localhost:3000/login and log in as `manager@demo.test` with password `demo12345`.

- Navigate to **Codebase** — you should see the BrainWhite repo with modules and chunks
- Navigate to **Learning Paths** — you should see the seeded "Backend onboarding" path
- Navigate to **Dashboard** — you should see Casey Candidate in the cohort table

### Useful development commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start Next.js development server (hot-reload) |
| `npm run build` | Production build — also runs lint |
| `npm run typecheck` | TypeScript type-check without emitting files |
| `npm run lint` | ESLint |
| `npm test` | Run Vitest unit tests |
| `npm run setup` | Reset database and re-seed (run after `prisma db push` or schema changes) |
| `npm run smoke` | End-to-end smoke test against the seeded database |
| `npx prisma studio` | Open Prisma Studio database browser at http://localhost:5555 |
| `npx prisma db push` | Push schema changes to the database without creating a migration file |
| `npx prisma migrate dev` | Create a named migration file and apply it |
| `npx prisma migrate status` | Check for pending migrations |

### Clean slate

To start over from an empty database:

```bash
# Stop npm run dev first, then:
npx prisma db push --force-reset
npm run setup
```

---

## 10. Environment Variables Reference

All variables are optional unless marked **required**. The app starts and runs with no AI keys; features degrade gracefully.

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | **yes** | — | PostgreSQL connection string |
| `ENCRYPTION_KEY` | **yes** | — | 64 hex chars (32 bytes). Used for AES-256-GCM encryption of GitHub tokens |
| `APP_URL` | **yes** | `http://localhost:3000` | Base URL for email links |
| `ALLOW_LOCAL_REPOS` | no | `false` | Set `true` in dev to allow local folder paths as repo sources |
| `GEMINI_API_KEY` | no | — | Google Gemini. Free tier at [aistudio.google.com](https://aistudio.google.com). Used for chunk summaries, reports |
| `GEMINI_MODEL` | no | `gemini-2.5-flash` | Gemini model for summaries |
| `GEMINI_REPORT_MODEL` | no | `gemini-2.5-pro` | Gemini model for report narrative |
| `GROQ_API_KEY` | no | — | Groq. Free tier at [console.groq.com](https://console.groq.com). Used for candidate chat |
| `GROQ_MODEL` | no | `qwen/qwen3.8-27b` | Groq model |
| `GROK_API_KEY` | no | — | xAI Grok. At [console.x.ai](https://console.x.ai) |
| `ANTHROPIC_API_KEY` | no | — | Anthropic Claude |
| `GITHUB_CLIENT_ID` | no | — | GitHub OAuth App Client ID. Enables "Sign in with GitHub" |
| `GITHUB_CLIENT_SECRET` | no | — | GitHub OAuth App Client Secret |
| `GITHUB_TOKEN` | no | — | Personal Access Token. Enables private repos and PR enrichment |
| `GITHUB_WEBHOOK_SECRET` | no | — | Verifies incoming webhook signatures at `/api/github/webhook` |
| `GITHUB_APP_SLUG` | no | `brainwhite` | GitHub App slug for the "Connect GitHub Organization" install URL |
| `GOOGLE_CLIENT_ID` | no | — | Google OAuth 2.0 Client ID. Enables "Sign in with Google" |
| `GOOGLE_CLIENT_SECRET` | no | — | Google OAuth 2.0 Client Secret |
| `RESEND_API_KEY` | no | — | [Resend](https://resend.com) API key. Without it, emails log to the terminal |
| `FROM_EMAIL` | no | `BrainWhite <onboarding@brainwhite.com>` | From address for outgoing emails |
| `DISABLE_SCHEDULER` | no | `false` | Set `true` to suppress the 15-min background job timer |
| `MAX_LLM_SUMMARIES` | no | `15` | Maximum LLM calls per repository sync for chunk summaries |

**How to get real values for each key:**

- `ENCRYPTION_KEY` — `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `GEMINI_API_KEY` — https://aistudio.google.com → Get API key
- `GROQ_API_KEY` — https://console.groq.com → API Keys → Create new key
- `GITHUB_CLIENT_ID/SECRET` — GitHub Settings → Developer settings → OAuth Apps → New OAuth App. Set callback URL to `http://localhost:3000/api/auth/github/callback`
- `GOOGLE_CLIENT_ID/SECRET` — Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID. Set redirect URI to `http://localhost:3000/api/auth/google/callback`
- `RESEND_API_KEY` — https://resend.com → API Keys

---

## 11. Testing GitHub Events with the Dev Simulator

The Dev Simulator fires the same code path as a real GitHub webhook (`processGithubEvent`), making it safe to test without a real GitHub App or public tunnel.

### How to use it

1. Log in as `manager@demo.test`
2. Go to **Tasks** → click any task
3. Scroll to the **Dev Simulator** panel at the bottom of the task detail page
4. Click the events in sequence:

| Button | GitHub event emitted | Expected result |
|---|---|---|
| **Push commits** | `push` | `GithubEvent` row created; task stays `NOT_STARTED` until a PR is opened |
| **Open PR** | `pull_request` (action: opened) | `PullRequest` row created; task moves to `IN_REVIEW` |
| **Request changes** | `pull_request_review` (action: changes_requested) | task moves to `CHANGES_REQUESTED`; `reviewRounds` increments |
| **CI passes** | `check_run` (conclusion: success) | `PullRequest.ciStatus = "success"` |
| **Merge** | `pull_request` (action: closed, merged: true) | task moves to `DONE`; PR quality score calculated and displayed |

After merging, refresh the task page to see the **PR Quality Score** (0–100), the sub-score breakdown (size, description, tests, CI, review, commits, conflicts), and the feedback bullets (strengths and areas to improve).

### Verifying the score

The `scorePr` function in `src/lib/domain/score.ts` is a pure function. You can test it directly:

```typescript
import { scorePr } from "@/lib/domain/score";

const result = scorePr({
  additions: 150, deletions: 20,
  body: "Implements the login rate limiter as described in the ticket. Tested manually.",
  changedFiles: ["src/lib/domain/auth.ts", "src/lib/domain/auth.test.ts"],
  commitMessages: ["feat: add rate limiting to login endpoint"],
  ciStatus: "success", ciFirstTryPass: true,
  reviewRounds: 0, conflictCount: 0,
});
// result.score → 92
// result.parts → { size: 100, description: 50, tests: 100, ci: 100, review: 100, commits: 100, conflicts: 100 }
```

### Verifying with real GitHub webhooks

To receive real webhooks from a GitHub repository during development:

1. Install [ngrok](https://ngrok.com): `ngrok http 3000`
2. Copy the HTTPS forwarding URL (e.g. `https://abc123.ngrok.io`)
3. In your GitHub repo → Settings → Webhooks → Add webhook:
   - Payload URL: `https://abc123.ngrok.io/api/github/webhook`
   - Content type: `application/json`
   - Secret: generate one and add to `.env` as `GITHUB_WEBHOOK_SECRET`
   - Events: `push`, `pull_request`, `pull_request_review`, `check_run`, `issues`
4. Restart `npm run dev` to pick up the new env var
5. Push a commit to the repo — the webhook fires within seconds and the task status updates automatically

---

## 12. Email Logging in Development

When `RESEND_API_KEY` is not set (the default for local development), all emails are:

1. Printed to the **terminal running `npm run dev`** as a formatted block:
   ```
   [email] from=BrainWhite <onboarding@brainwhite.com> to=candidate@demo.test subject="..."
   <email body text>
   ```

2. Stored in the **`EmailLog` database table** with `orgId`, `to`, `subject`, and full `body`.

### Viewing email logs

**Via Prisma Studio:**
```bash
npx prisma studio
```
Open http://localhost:5555, select the `EmailLog` model.

**Via direct query:**
```bash
# Using psql
$env:PGPASSWORD="yourpassword"
psql -U postgres -h localhost -d brainwhite -c "SELECT to, subject, created_at FROM \"EmailLog\" ORDER BY created_at DESC LIMIT 10;"
```

### Invitation links in development

When a manager invites a new user, the invitation email contains a link like:
```
http://localhost:3000/invite/[token]
```
This token is in the email body logged to the terminal. Copy the full URL and open it in a new browser tab to test the invitation acceptance flow without a real email provider.

---

## 13. AI Provider Integration

The AI gateway (`src/lib/ai.ts`) abstracts all LLM calls. It is a multi-provider system with automatic fallover.

### Provider priority

1. **Gemini** (`GEMINI_API_KEY`) — preferred for summaries and reports
2. **Groq** (`GROQ_API_KEY`) — preferred for real-time candidate chat (low latency)
3. **Grok** (`GROK_API_KEY`) — fallback
4. **Anthropic** (`ANTHROPIC_API_KEY`) — fallback

### Task routing

Tasks map to different models optimised for latency vs quality:

| Task | Models used | Notes |
|---|---|---|
| `summary` | Gemini Flash → Groq | Chunk and module summaries during sync |
| `report` | Gemini Pro → Anthropic | Weekly/final report narrative enrichment |
| `chat` | Groq → Gemini Flash | Candidate workspace real-time chat |

### Graceful degradation

When no AI provider is configured:
- Chunk summaries: heuristic structural descriptions are used
- Candidate chat: keyword-based retrieval answer is returned with a note that AI is not configured
- Reports: deterministic template narrative is used without LLM enrichment

No feature is blocked or broken by missing AI keys.

### Anti-hallucination in reports

`numbersGrounded(text, facts)` in `reports.ts` validates that every number appearing in the LLM-rewritten narrative also exists in the original `Metrics` JSON. If the LLM introduces any new number, the LLM output is discarded and the template narrative is used instead.

---

## 14. Deployment & Production Checklist

Refer to `docs/PRODUCTION_READINESS.md` for the full living checklist. Key points:

### Database

- Change `provider = "postgresql"` in `prisma/schema.prisma` if not already set
- Run `npx prisma migrate deploy` before deploying new code (never `db push` in production)
- Take a backup before every migration

### Required environment variables for production

`DATABASE_URL`, `ENCRYPTION_KEY`, `APP_URL`, `GITHUB_WEBHOOK_SECRET`, `RESEND_API_KEY`

### Security hardening before first real customer

- Generate a fresh `ENCRYPTION_KEY` (never use the placeholder)
- Set `ALLOW_LOCAL_REPOS=false`
- Delete the demo accounts (or never run `seed.ts` in production — it is guarded by `NODE_ENV !== "production"`)
- Review rate limiting — currently per-IP/email via `LoginAttempt` table; may need Redis-backed rate limiting for multi-instance deployments
- Handout storage: replace `src/lib/storage.ts` disk writes with S3/R2/Vercel Blob
- Replace the in-process scheduler with Vercel Cron routes + a persistent job queue

### Vercel-specific

- Set all env vars in Vercel Dashboard → Settings → Environment Variables for both Production and Preview environments
- `DATABASE_URL` must point to a Postgres instance accessible from Vercel (Neon and Supabase work out of the box)
- `NEXT_PUBLIC_*` vars are exposed to the browser; keep secrets server-only

---

## 15. Known Gaps & Extension Roadmap

These gaps are intentional — the current build is a working v0. Each item below includes the exact files to change.

### Gap 1 — Embeddings and vector search (highest impact)

**Problem:** Current retrieval in `src/lib/domain/retrieve.ts` is keyword scoring. It returns poor results for semantic queries like "where do we handle refunds?" or "how is rate limiting implemented?".

**Solution:** Replace the internals of `retrieve()` with a vector index. The `Snippet` return shape must remain unchanged.

**Implementation path:**
1. During `syncRepository` in `pipeline.ts`, compute embeddings for each chunk and store them (pgvector column on `Chunk`, or Qdrant)
2. In `retrieve.ts`, replace the keyword loop with a vector similarity search + reranker
3. Consider a hybrid approach: vector search for top-N, then keyword re-scoring

**Files to change:** `src/lib/domain/retrieve.ts`, `src/lib/analyser/pipeline.ts`, `prisma/schema.prisma`

---

### Gap 2 — GitHub App installation flow

**Problem:** Only public repos work without a `GITHUB_TOKEN`. Private repos require the user to paste a PAT manually.

**Solution:** Implement the full GitHub App installation flow so organisations can grant access with one click.

**Files to change:** `src/app/api/github/app/callback/route.ts`, `src/lib/domain/github-app.ts`, `src/app/projects/page.tsx`

**What exists:** The UI for "Connect GitHub Organization" is built. The installation callback saves `installationId` to `Organisation`. The token generation in `github-app.ts` is partially implemented.

---

### Gap 3 — Incremental sync from push webhooks

**Problem:** The knowledge graph goes stale after the initial sync. Managers must click "Sync now" manually.

**Solution:** Handle `push` events in `src/app/api/github/webhook/route.ts` by calling `syncRepository` for the affected repo (or a targeted incremental sync for changed files only).

**Files to change:** `src/app/api/github/webhook/route.ts`, `src/lib/analyser/pipeline.ts`

---

### Gap 4 — Real job queue (BullMQ / Temporal)

**Problem:** `syncRepository` is called with `void` (fire-and-forget) inside a server action on a serverless runtime. A Vercel function timeout or restart mid-sync leaves the repo stuck in `RUNNING` status. The 15-min scheduler in `instrumentation.ts` also does not survive restarts.

**Solution:** Move all background work (sync, reports, reminders) to a durable job queue. On Vercel, use Vercel Cron + a `JobQueue` database table, or integrate BullMQ with an external Redis instance.

**Files to change:** `src/instrumentation.ts`, `src/app/actions.ts` (anywhere `void syncRepository` is called), `src/lib/domain/reports.ts:runJobs`

---

### Gap 5 — Real email provider + password reset + email verification

**Status:** These are **implemented** in the codebase. The gap is configuration.

**To enable:** Set `RESEND_API_KEY` in `.env`. Use `onboarding@resend.dev` for testing (Resend free tier), or verify your domain in the Resend dashboard.

---

### Gap 6 — LLM PR review with line-level feedback

**Problem:** `scorePr` is fully deterministic. It cannot read code or assess whether the PR follows repo conventions, naming patterns, or architectural constraints.

**Solution:** After scoring, call an LLM with the PR diff and the repo's convention documentation. Return line-level comments that can be surfaced in the task detail view.

**Files to change:** `src/lib/domain/score.ts`, `src/lib/domain/github.ts:rescore()`

---

### Gap 7 — Quizzes, templates, cohorts, bulk assignment

**Current state:** Quizzes are defined in the schema (`quizAveragePct` exists as `null` in metrics) but not implemented. Path templates, cohort management, and bulk assignment are not built.

**Files to create:** New pages under `src/app/paths/` and `src/app/team/`, new schema models for `Quiz`, `QuizAttempt`, `Cohort`

---

### Gap 8 — Handout file storage for production

**Problem:** `src/lib/storage.ts` writes handout files to the local server disk. This does not persist on Vercel and does not work across multiple instances.

**Solution:** Replace `saveFile` / `readFile` in `storage.ts` with an object storage SDK (AWS S3, Cloudflare R2, or Vercel Blob). The callers do not need to change.

**Files to change:** `src/lib/storage.ts`

---

### Gap 9 — Automated test suite

**Current state:** `scripts/smoke.ts` is a manual end-to-end script. Vitest is configured but only a few unit tests exist in `src/lib/domain/auth.test.ts`.

**What is needed:**
- Unit tests: `scorePr`, `computeMetrics`, `buildChunks`, `retrieve`, `templateNarrative` (all pure or easily mockable functions)
- Integration tests: `createAssignment`, `processGithubEvent`, auth flows
- E2E tests (Playwright): signup, login, invite accept, learning workspace, task PR flow

**Files to create:** `src/lib/domain/score.test.ts`, `src/lib/domain/metrics.test.ts`, `src/lib/analyser/chunk.test.ts`, `tests/e2e/`

---

### Gap 10 — Postgres for production (schema is already correct)

**Status:** `prisma/schema.prisma` already uses `provider = "postgresql"`. The migrations in `prisma/migrations/` are Postgres-compatible.

**Action needed:** Set `DATABASE_URL` to a Postgres instance and run `npx prisma migrate deploy`.

---

## 16. Contribution Guidelines

### Branch naming

```
feat/<short-description>     New feature
fix/<short-description>      Bug fix
chore/<short-description>    Tooling, deps, refactoring
docs/<short-description>     Documentation only
test/<short-description>     Tests only
```

### Commit messages (Conventional Commits)

```
feat: add vector search to retrieve()
fix: prevent duplicate assignment on path re-publish
chore: upgrade Prisma to 6.x
docs: document metrics computation in CODEBASE_DOCUMENTATION.md
test: add regression test for scorePr conflict counting
```

### Before every pull request

```bash
npm run lint        # zero lint errors
npm run typecheck   # zero type errors
npm test            # all tests pass
npm run build       # production build passes
npx prisma migrate status  # no unapplied migrations
```

Then: manual walkthrough in the browser as each affected role, from a fresh database (`npm run setup`).

### Pull request template

The `.github/pull_request_template.md` template must be filled in completely — especially:
- Reference the issue: "Closes #N"
- Schema/migration impact
- New env vars and where to get real values
- Evidence of testing (commands run + output)

### Database schema changes

1. Modify `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name describe-your-change` to generate a migration file
3. Commit both the schema change and the migration file in the same PR
4. Announce the change to the team before merging — everyone must run `npx prisma migrate dev` or `npx prisma db push` after pulling

**Never edit an already-applied migration file.**

### Multi-tenancy rule

Every database query that touches org data must include `orgId` in the `where` clause. This is enforced by convention, not by the ORM. Violations are IDOR vulnerabilities.

```typescript
// Correct
const path = await db.learningPath.findUniqueOrThrow({
  where: { id: pathId, orgId: me.orgId },
});

// Wrong — never do this
const path = await db.learningPath.findUniqueOrThrow({
  where: { id: pathId },
});
```


*Last updated: November 2026 · Maintained by the BrainWhite engineering team*
