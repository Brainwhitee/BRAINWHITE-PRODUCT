# Pedagon: AI onboarding platform (MVP v0)

Turns an organisation's codebase into a knowledge graph, lets managers build learning paths and GitHub-tracked tasks from it, gives new joiners a 3-pane learning workspace, and produces weekly and final onboarding reports.

Built from `Onboarding_Platform_Feature_List.xlsx`. This is a **v0 for the team to clone and extend**. See [Known gaps](#known-gaps).

## Quick start

Requires Node 20+ (tested on 24). No Docker or database server needed (SQLite for dev).

```bash
git clone <repo-url> && cd pedagon
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
npm install
npm run setup               # creates the DB, seeds a demo org, analyses this repo as the sample codebase
npm run dev                 # http://localhost:3000
```

Demo logins (password `demo12345`): `owner@demo.test`, `manager@demo.test`, `mentor@demo.test`, `candidate@demo.test`.

Emails are not sent in dev: they are printed in the server console and stored in the `EmailLog` table (open invite links from there).

## Try the whole loop (about 5 minutes)

1. Log in as **manager**. **Codebase**: see the analysed modules and chunks. **Paths**: open the seeded path and see the builder.
2. Log in as **candidate** (another browser/profile). **My learning**: open an item and use the 3-pane workspace: code, explanation, handouts, notes, AI chat with clickable citations. Click **Mark complete**.
3. As manager open **Tasks**, pick the candidate's task and use the **Dev simulator** to fire GitHub events (push, open PR, CI, changes requested, conflict, merge). The task moves automatically and the PR gets a quality score with feedback.
4. **Dashboard** shows progress, on-time rate, PR scores and risk flags. Click a candidate for the timeline, then **Generate weekly/final report**; **Export PDF** uses the browser's print dialog.

## What is built

| Area | Status |
|---|---|
| Orgs, email/password auth, RBAC (Owner/Manager/Mentor/Candidate), invites, audit log, encrypted GitHub tokens | Done |
| Candidate GitHub connect (mandatory gate). OAuth if keys set, dev form otherwise | Done |
| Codebase analyser: GitHub tarball or local folder, filtering, secret redaction, Tree-sitter parsing (JS/TS/Python/Java), modules, dependency graph, stable chunk ids, summaries (LLM or heuristic) | Done |
| Path builder, content blocks, handouts (25 MB, private), publish, assign + invite email | Done |
| 3-pane workspace, retrieval-based chat with citations, notes, progress + active-time tracking | Done |
| Tasks, GitHub issue creation/link, webhook receiver, auto status, PR quality scoring, conflicts, blockers, manual review | Done |
| Deadline reminders, weekly + final reports, grounded narratives, dashboards, risk flags, mentor rubric | Done |

## Configuration (all optional)

See `.env.example`. With **no keys** everything runs: summaries are heuristic, chat is search-based, GitHub login uses a dev form, and GitHub events come from the simulator. Adding `ANTHROPIC_API_KEY` upgrades summaries, chat answers and report wording (report numbers are validated against computed metrics before an AI rewrite is accepted).

Real GitHub webhooks: point a repo/GitHub App webhook at `/api/github/webhook` (JSON), set `GITHUB_WEBHOOK_SECRET`, subscribe to `push`, `pull_request`, `pull_request_review`, `check_run`, `issues`. Candidates are matched by their linked GitHub username; only linked candidates in connected repos are recorded.

## Layout

```
src/lib/analyser/   ingestion, filtering, parsing, chunking, summaries, pipeline
src/lib/domain/     assignments, retrieval, GitHub events, PR scoring, metrics, reports, jobs
src/app/            pages + server actions per area (codebase, paths, learn, tasks, people, reports)
src/instrumentation.ts   in-process scheduler (every 15 min)
prisma/schema.prisma     data model
scripts/seed.ts          demo data
```

Useful: `npm run typecheck`, `npm run build`, `npx prisma studio`.

## Known gaps

Deliberately left for the team (roughly in priority order):

1. **Embeddings / vector index and hybrid RAG**: retrieval is keyword scoring (`src/lib/domain/retrieve.ts`). Keep the `Snippet` shape and swap the internals (pgvector/Qdrant + rerank).
2. **GitHub App** install flow, org-level repo selection and private repo access (a `GITHUB_TOKEN` works as a stopgap). Incremental sync from `push` webhooks and scheduled full re-sync are not wired: use **Sync now**.
3. **Job queue**: sync and reports run in-process (`void syncRepository`, 15-min timer). A restart mid-sync leaves a repo stuck on RUNNING. Move to BullMQ/Temporal.
4. **Real email provider** (`src/lib/mailer.ts`), password reset, email verification, Google SSO, refresh-token style sessions (currently 7-day DB sessions).
5. **PR review by LLM** against repo conventions with line-level feedback (current scoring is deterministic sub-scores only), and PDF/Office text extraction for handouts (only .txt/.md are indexed for chat).
6. **Quizzes**, templates/cohorts/bulk assignment, path-update migration for active candidates, stale-content badges beyond the basic "code changed" flag, knowledge-graph explorer UI, monaco syntax highlighting, true PDF export, Postgres for production (change the provider in `prisma/schema.prisma`).
7. Org settings UI (timezone, report day/weights are currently fixed in code), billing, GitLab/Bitbucket.
8. Automated tests. Only manual end-to-end testing has been done so far.

## Security notes

Org-scoped queries throughout; handouts are served only through an authenticated route; secrets are redacted before storage and LLM calls; GitHub tokens are AES-256-GCM encrypted; webhook signatures are verified. **Before any real deployment**: set a fresh `ENCRYPTION_KEY`, set `GITHUB_WEBHOOK_SECRET`, disable `ALLOW_LOCAL_REPOS`, delete the demo accounts, and review rate limiting (not implemented).
