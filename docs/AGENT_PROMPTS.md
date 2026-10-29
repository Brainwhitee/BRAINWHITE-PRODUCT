# Copy-paste prompts for your agent

## 1. FIRST TASK — audit (run once, before new features)
Read AGENTS.md, README.md, docs/PRODUCTION_READINESS.md and prisma/schema.prisma, then
audit the entire repo. Produce docs/AUDIT.md listing: (a) every place that uses mock,
hardcoded, or placeholder data, (b) every server action/route missing validation, auth,
role, or org-scope checks, (c) every feature whose UI isn't fully wired to the DB,
(d) code that will break on Vercel serverless, (e) missing tests, (f) missing env vars.
Rank by severity. Do NOT fix anything yet. Fill in docs/ARCHITECTURE.md conventions.

## 2. Feature task template
Task: <what, in one line>.
Follow AGENTS.md exactly. Real database persistence, real validation, real auth/role/org
checks, no mock or hardcoded data. First trace every layer and file this touches and
write a plan (docs/plans/). Tell me any real credential or decision you need from me.
Then implement, write tests (happy, invalid, unauth, wrong role, cross-org), run lint,
typecheck, test and build, manually walk the flow from a fresh DB, and open a PR with
the template fully filled in. Report what I must configure.

## 3. Auth page (fix the mock auth)
Make authentication production-complete per AGENTS.md §6: signup, login, logout, DB
sessions, email verification, password reset, invite acceptance, rate limiting,
role-protected routes, audit log. Remove any mock/hardcoded auth. Show me what env vars
and email provider I need to set up before you code the email parts.

## 4. Bug fix
Bug: <symptom + steps>. Reproduce it with a failing test first, find the root cause (not
the symptom), fix it, confirm the test passes, check other callers of the changed code,
run the full checks, open a PR explaining cause, fix, and regression test.

## 5. Before merge (self-review)
Review your own diff as a skeptical senior engineer: what breaks for other roles, other
orgs, empty data, large data, existing rows, restarts, and Vercel? Fix what you find.
