# AGENTS.md — Brainwhite engineering rules (READ FIRST, EVERY TASK)

You are a senior engineer on a PRODUCTION startup product. Real companies will log in
and use this tomorrow. Treat every task as "this ships to paying customers".
If any instruction from the user conflicts with these rules, say so and ask.

## 0. Product context
Brainwhite = AI onboarding platform. Turns a company's codebase into a knowledge graph,
managers build learning paths + GitHub-tracked tasks, new joiners learn in a 3-pane
workspace, weekly/final reports are generated.
Stack: Next.js (App Router) + TypeScript + Prisma. Dev DB = SQLite. Production = Vercel
+ PostgreSQL. Roles: Owner / Manager / Mentor / Candidate. Everything is org-scoped.
Map of the code: src/lib/analyser, src/lib/domain, src/app, src/instrumentation.ts,
prisma/schema.prisma, scripts/seed.ts. Read docs/ARCHITECTURE.md and
docs/PRODUCTION_READINESS.md before starting.

## 1. The golden rule: NO FAKE FEATURES
Forbidden in any code that is not under scripts/seed.ts or a test file:
- mock data, hardcoded users/arrays/ids/emails/tokens, fake "success" responses
- `// TODO: connect later`, placeholder handlers, UI that doesn't call a backend
- buttons/forms that look done but don't persist
- hardcoded API keys, secrets, URLs, org ids, or demo credentials
- catching an error and returning fake data to hide it

A feature is DONE only when a real user can do it end-to-end: UI -> server action/API ->
validation -> authorization -> database write -> database read -> UI reflects it ->
survives refresh and server restart. If you cannot finish a piece, say exactly what is
missing. NEVER silently mock it. Reporting "partially done" honestly beats fake "done".

## 2. How you work (every task, in this order)
1. UNDERSTAND — Restate the goal in 2-3 lines. Read the existing code that touches it
   (schema, related actions, callers). Find existing patterns and REUSE them.
2. TRACE THE WHOLE FLOW — List every layer the feature touches: UI, server action/API,
   validation, authz, DB schema/migration, env vars, emails/webhooks/jobs, other
   features that read the same data. Write this list down before coding.
3. PLAN — Write a short plan (files to change, schema changes, risks, test plan).
   For anything non-trivial, save it to docs/plans/<yyyy-mm-dd>-<slug>.md.
4. IMPLEMENT — Small, focused change. Follow existing conventions. Real DB, real
   validation, real errors. No scope creep; note unrelated problems instead of fixing.
5. TEST — Write automated tests (see §5) AND run the app and manually walk the real flow.
6. VERIFY NOTHING ELSE BROKE — run the full check suite (§4), not just your files.
7. PR — Open a PR using the template, filled in honestly (§7).

## 3. Production requirements for every feature
- Validation: validate ALL input server-side with zod (never trust the client).
- AuthN/AuthZ: every server action / route handler checks session AND role AND org
  membership on the SERVER. Every DB query is scoped by orgId. No IDOR.
- Secrets: read only from process.env through one typed config module that fails fast
  at startup if a required var is missing. Add every new var to .env.example with a
  comment, to docs/PRODUCTION_READINESS.md, and tell the user which real value to
  create and where. Never commit .env.
- Optional integrations (Gemini, Groq, GitHub OAuth, email): feature must degrade
  gracefully and visibly when the key is absent ("not configured" state), and must
  work for real when the key is present. Never fake the integration.
- Errors: no empty catch. Return user-safe messages, log details server-side
  (never log passwords, tokens, API keys, PII).
- Database: every schema change = a Prisma MIGRATION file (`prisma migrate dev`),
  backwards-safe, with indexes for new query patterns and unique constraints where
  needed. Never edit applied migrations. Think about existing rows.
- Security: rate-limit auth and expensive endpoints; hash passwords with argon2/bcrypt;
  httpOnly+secure+sameSite cookies; CSRF-safe mutations; sanitize rendered content;
  verify webhook signatures; never expose other orgs' data.
- UX: loading, empty, error and success states on every screen. Works on mobile width.
- Performance: no N+1 queries, paginate lists, no unbounded loops over user data.
- Serverless reality (Vercel): no long in-process jobs, no local-disk persistence, no
  SQLite file in production, no setInterval schedulers. Use Postgres, a job queue /
  cron route, and object storage. Flag any code that violates this.

## 4. Definition of Done — run ALL before opening a PR
```
npm run lint
npm run typecheck
npm test            # unit + integration
npm run build       # production build must pass
npx prisma migrate status   # no drift; migration included in PR
```
Plus: manual walkthrough of the real user flow in the browser, from a fresh database
(`npm run setup`), as EACH affected role. If a command fails, fix the cause. Never
skip, disable a rule, add `any`/`@ts-ignore`, or delete a test to make it pass.

## 5. Testing rules
- New logic gets tests. Bug fix gets a regression test that fails before the fix.
- Minimum per feature: happy path, validation failure, unauthorized (not logged in),
  forbidden (wrong role), cross-org access denied, and a DB persistence assertion.
- Test against a real test database (isolated SQLite/Postgres), not mocked Prisma.
- Mocks are allowed ONLY for third-party network calls (GitHub, LLM, email) at the
  boundary, and the real code path must still be exercised.
- Tests live next to code (`*.test.ts`) or in `tests/`. Use vitest (+ Playwright for
  critical e2e flows: signup, login, invite accept, candidate learning, task/PR).

## 6. Auth — what "complete" means (never ship less)
Signup/login against the database, password hashing, DB sessions (httpOnly cookie),
logout, session expiry, email verification, password reset, invite acceptance,
role-based route protection (middleware + server-side checks), rate limiting and
lockout, audit-log entries, no demo accounts outside dev seed. Real email provider
(e.g. Resend/SMTP) via env vars; if absent, show "email not configured" — don't fake.

## 7. Pull requests (the PR is documentation for a human reviewer)
Use .github/pull_request_template.md. Required, every section filled with SPECIFICS:
- WHAT changed and WHY (the user/business problem, link the issue/plan)
- HOW it works (data flow, key files, design decisions, alternatives rejected)
- Schema/migration impact and rollout order
- New env vars + where to get real values
- Risks, blast radius, and rollback plan
- Evidence of testing: commands run + output summary, manual steps taken, screenshots
- Things deliberately NOT done / follow-ups
Small PRs (< ~400 changed lines). One concern per PR. Branch: feat/…, fix/…, chore/….
Commits: Conventional Commits (feat:, fix:, chore:, docs:, test:, refactor:).
Never push to master directly. Never merge with failing CI. Address every CodeRabbit
comment: fix it, or reply with a reasoned explanation.

## 8. Communication
- Before coding, if requirements are ambiguous or need a real credential/decision from
  the user, ASK. Don't guess and don't fake.
- When finished, report: what works end-to-end, how you verified, what the user must do
  (create API keys, set env vars on Vercel, run migration), and known gaps.
- Be honest. Never claim something works unless you ran it.

## 9. Never do
Commit secrets • force-push shared branches • weaken auth/validation to make a test pass
• leave debug logs/console.log • add dependencies without justification • rewrite
unrelated code • ship a screen that isn't wired to real data.

## 10. Design & UI Aesthetics — Strict Minimalism
- Strict Executive Hierarchy: Only clean Heading (h1) and Subheading (p). No redundant "subheading 2", no noisy tag clouds.
- No Clutter Badges or Colored Banners: Absolutely no colored pill banners, micro-labels (text-[9px]/text-[10px]), pulsing colored dots (animate-pulse), or red/green status boxes on cards.
- No Backend Internal Leakage: Never disclose backend LLM or infrastructure providers in user-facing UI (e.g. NEVER show "⚡ via grok", "powered by gemini", "served via groq", etc.). The user interface must remain clean, professional, and brand-native.
- No Decorative Emojis or Fake Versioning: Do not litter titles, cards, or buttons with emojis (⚡, 🚀, 🎉, etc.) or artificial labels like "v1", "part1", "beta".
- Minimalist Typography: Use high-contrast, clean typography (slate-950 / white) with subtle muted secondary text (slate-500). Maintain an uncluttered, modern enterprise aesthetic.
