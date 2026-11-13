-- Schema changes made by the core improvement work (Phases 1-4), as plain additive SQL for an EXISTING database.
-- Use this instead of `prisma db push` on production: it only ADDS things, never drops or rewrites anything.
--   * every new column is nullable or has a default, so existing rows and the old deployed code keep working
--   * ADD COLUMN with a constant default is a metadata-only change on PostgreSQL 11+ (no table rewrite, no long lock)
--   * every statement is idempotent: running it twice is harmless
--   * CREATE INDEX briefly blocks writes to GraphEdge; GraphEdge is rebuilt by syncs only, so do it between syncs
--
-- Apply it BEFORE deploying code that reads these columns (GraphEdge.confidence/weight, Repository.graphCoverage,
-- SyncRun.importsResolved/importsUnresolved). Verified: starting from the schema before the core work (commit 7b3e4d3),
-- running this file leaves the database identical to prisma/schema.prisma (prisma migrate diff reports no difference).
-- This is the whole diff: there are no other schema changes in this work.

ALTER TABLE "Repository" ADD COLUMN IF NOT EXISTS "graphCoverage" TEXT NOT NULL DEFAULT '{}';

ALTER TABLE "GraphEdge" ADD COLUMN IF NOT EXISTS "confidence" TEXT NOT NULL DEFAULT 'EXACT';
ALTER TABLE "GraphEdge" ADD COLUMN IF NOT EXISTS "weight" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "SyncRun" ADD COLUMN IF NOT EXISTS "importsResolved" INTEGER;
ALTER TABLE "SyncRun" ADD COLUMN IF NOT EXISTS "importsUnresolved" INTEGER;

CREATE INDEX IF NOT EXISTS "GraphEdge_repoId_fromId_idx" ON "GraphEdge"("repoId", "fromId");
CREATE INDEX IF NOT EXISTS "GraphEdge_repoId_toId_idx" ON "GraphEdge"("repoId", "toId");
CREATE INDEX IF NOT EXISTS "GraphEdge_repoId_type_idx" ON "GraphEdge"("repoId", "type");
