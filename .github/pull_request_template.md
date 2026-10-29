## What & Why
<!-- What changed, and what user/business problem it solves. Link issue / docs/plans file. -->

## How it works
<!-- Data flow end-to-end (UI -> action/API -> validation -> authz -> DB -> UI). Key files. Design decisions and alternatives rejected. -->

## Scope
- [ ] One concern only, < ~400 lines
- Not included (follow-ups): 

## Database / migrations
- [ ] No schema change  /  [ ] Migration included (name: ______)
- Existing-data impact & rollout order:

## Config / env
- [ ] No new env vars  /  [ ] Added to `.env.example` + docs/PRODUCTION_READINESS.md
- New vars, where to get real values, what happens if missing:

## Security checklist
- [ ] Server-side validation (zod)
- [ ] AuthN + role + org-scope checks on every new action/route
- [ ] No secrets / PII in code or logs
- [ ] Rate limiting considered for new public/expensive endpoints

## No-fake-code checklist
- [ ] No mock/hardcoded data outside seed/tests
- [ ] Every new UI element is wired to real data and persists after refresh
- [ ] Loading / empty / error states exist

## Testing evidence
- [ ] `npm run lint`  - [ ] `npm run typecheck`  - [ ] `npm test`  - [ ] `npm run build`
- [ ] Tests added: happy path, invalid input, unauthenticated, wrong role, cross-org
- Manual steps performed (roles used, from fresh DB):
- Screenshots / output:

## Impact on the rest of the system
<!-- Other features/pages/jobs/webhooks that read or write the same data, and how you checked they still work. -->

## Risk & rollback
<!-- What could break in prod? How do we roll back (revert + migration plan)? -->
