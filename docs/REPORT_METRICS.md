# Report metrics

Computed in `src/lib/domain/metrics.ts`. Reports only restate these values.

| Metric | Definition |
|---|---|
| Path completion % | completed mandatory items / mandatory items |
| Active time | sum of `TIME` events (30 s heartbeats, only while tab visible and user active within 2 min) |
| Schedule adherence | items with `dueDay` <= elapsed days completed by their due day / items due so far |
| Must-read opened | must-read handouts opened at least once / must-read handouts |
| Done of due | done tasks / tasks whose deadline has passed |
| On-time rate | tasks done before deadline / tasks done |
| Avg cycle | hours from first IN_PROGRESS/IN_REVIEW status to DONE |
| Blocked time | total time in BLOCKED status |
| PR score | weighted sub-scores: size 15, description 20, tests 20, CI 15, review rounds 15, commits 10, conflicts 5 (`src/lib/domain/score.ts`); managers can override |
| Readiness | weighted mean of tasks% (35), PR score (25), learning% (25), mentor rubric x20 (15); missing components are dropped and weights renormalised |
| Risk flags | no activity > 3 days; > 20% of due items behind schedule; avg PR score < 50; any overdue task |
| Quiz scores, self check-in | not available yet (V1) |
