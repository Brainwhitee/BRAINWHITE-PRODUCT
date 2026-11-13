-- Optional indexes for chat retrieval (Phase 5). Safe to run repeatedly. Apply with: npm run db:retrieval-index
--
-- retrieve.ts narrows candidates with substring matches (ILIKE '%term%') on File.path / File.content and on
-- Chunk.title / Chunk.summary. Without an index every question scans every file body of the org. A pg_trgm GIN index
-- serves exactly those substring searches, so results stay identical and only the speed changes (no code change needed:
-- the planner picks the index up by itself).
--
-- Why trigram and not tsvector: tsvector treats "syncRepository" as ONE word, so a question about "repository" would stop
-- finding it. Trigram indexes keep the substring (and camelCase) behaviour the ranker was tuned on.
--
-- These objects are not in prisma/schema.prisma (Prisma cannot express them). `prisma db push` DROPS them (tested): re-run
-- this script after every push. Nothing breaks without them: the queries are correct either way, just slower on big repos.
-- Creating an index briefly locks writes on that table, so run it on a shared database with the team's agreement.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "File_content_trgm_idx" ON "File" USING GIN ("content" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "File_path_trgm_idx" ON "File" USING GIN ("path" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Chunk_title_trgm_idx" ON "Chunk" USING GIN ("title" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Chunk_summary_trgm_idx" ON "Chunk" USING GIN ("summary" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Symbol_name_trgm_idx" ON "Symbol" USING GIN ("name" gin_trgm_ops);
