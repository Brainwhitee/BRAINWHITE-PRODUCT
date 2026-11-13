// Retrieval eval through the REAL database path (retrieve.ts: SQL candidate search + ranker), local DB only.
//   npm run eval:retrieval-db
// Needs the "brainwhite" repository synced in the local database (this project is the seeded sample codebase).
// Prints top-1 / top-3 hit rate and the time per question, and whether the pg_trgm indexes exist.
try { (process as unknown as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.(); } catch { /* no .env */ }
import { QUESTIONS } from "./retrieval-questions";

async function main() {
  if (!/@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL ?? "")) { console.error("Refusing: DATABASE_URL is not local."); process.exit(2); }
  const { db } = await import("../src/lib/db");
  const { retrieve } = await import("../src/lib/domain/retrieve");
  const repo = await db.repository.findFirst({ where: { name: "brainwhite" } });
  if (!repo) { console.error('No repository named "brainwhite" in this database. Run npm run seed first.'); process.exit(2); }
  const idx = await db.$queryRawUnsafe<{ indexname: string }[]>(`select indexname from pg_indexes where indexname like '%_trgm_idx'`);
  console.log(`pg_trgm indexes present: ${idx.length}${idx.length ? " (" + idx.map((i) => i.indexname.replace("_trgm_idx", "")).join(", ") + ")" : ""}`);
  const files = await db.file.count({ where: { repoId: repo.id } });
  console.log(`repository "${repo.name}": ${files} files in the database\n`);

  let top1 = 0, top3 = 0, totalMs = 0;
  console.log("rank  ms   question");
  for (const { q, expect } of QUESTIONS) {
    const t0 = performance.now();
    const snips = await retrieve(repo.orgId, q, { limit: 5 });
    const ms = performance.now() - t0;
    totalMs += ms;
    const seen: string[] = [];
    for (const s of snips) if (!seen.includes(s.path)) seen.push(s.path);
    const i = seen.findIndex((p) => expect.includes(p));
    const rank = i < 0 ? null : i + 1;
    if (rank === 1) top1++;
    if (rank && rank <= 3) top3++;
    console.log(`${String(rank ?? "-").padStart(4)} ${String(Math.round(ms)).padStart(4)}   ${q}`);
  }
  console.log(`\nTop-1 ${top1}/${QUESTIONS.length}   Top-3 ${top3}/${QUESTIONS.length}   avg ${Math.round(totalMs / QUESTIONS.length)} ms/question`);
  await db.$disconnect();
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
