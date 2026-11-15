# Core graph, retrieval and incremental sync

## Goal
Make the codebase knowledge graph accurate (resolved imports, symbol edges), keep it fresh on push, answer chat questions from it, and let managers and candidates explore it as a tree.

## Layers touched
UI (repo graph page, candidate Code map, paths), `/api/graph`, `/api/chat`, GitHub webhook, sync pipeline, Prisma schema (migration `20261113000000_core_graph_columns`), env (`AUTO_SYNC_ON_PUSH`).

## Schema
Additive only: 4 nullable/defaulted columns and 3 GraphEdge indexes, idempotent SQL. Optional trigram indexes live in `prisma/sql/retrieval-index.sql` and are applied manually (`prisma db push` drops them).

## Rollout order
1. `prisma migrate deploy` against production. 2. Deploy code. 3. Optionally set `AUTO_SYNC_ON_PUSH=true`. Nothing syncs automatically before step 3.

## Risks and rollback
Full sync is lock-free by design (a lock re-introduced the stalled-sync deadlock); incremental sync claims a repo with a 2-minute takeover. Rollback: redeploy the previous build; the new columns are unused by it.

## Tests
Unit tests in `scripts/*.test.ts` (`npm run test:core`), real-DB authz test `src/lib/domain/graph-access.test.ts`, and `check:incremental`, `check:boot`, `check:webhook`, `eval:retrieval`.

## Not done
Playwright flows for the graph pages; splitting this branch into smaller PRs.
