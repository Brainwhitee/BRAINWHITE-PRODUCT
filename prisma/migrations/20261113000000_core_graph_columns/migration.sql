-- Core graph work (import resolution, symbol edges, sync statistics). Purely additive: every new column is nullable or has a default,
-- so existing rows and the code that is currently deployed keep working. Every statement is idempotent (safe if it was applied by hand).

ALTER TABLE "Repository" ADD COLUMN IF NOT EXISTS "graphCoverage" TEXT NOT NULL DEFAULT '{}';

ALTER TABLE "GraphEdge" ADD COLUMN IF NOT EXISTS "confidence" TEXT NOT NULL DEFAULT 'EXACT';
ALTER TABLE "GraphEdge" ADD COLUMN IF NOT EXISTS "weight" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "SyncRun" ADD COLUMN IF NOT EXISTS "importsResolved" INTEGER;
ALTER TABLE "SyncRun" ADD COLUMN IF NOT EXISTS "importsUnresolved" INTEGER;

CREATE INDEX IF NOT EXISTS "GraphEdge_repoId_fromId_idx" ON "GraphEdge"("repoId", "fromId");
CREATE INDEX IF NOT EXISTS "GraphEdge_repoId_toId_idx" ON "GraphEdge"("repoId", "toId");
CREATE INDEX IF NOT EXISTS "GraphEdge_repoId_type_idx" ON "GraphEdge"("repoId", "type");
