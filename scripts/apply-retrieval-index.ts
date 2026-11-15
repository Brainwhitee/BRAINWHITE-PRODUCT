// Applies prisma/sql/retrieval-index.sql (pg_trgm indexes for chat retrieval). Idempotent.
//   npm run db:retrieval-index              local database: applied
//   npm run db:retrieval-index -- --yes     any other database (e.g. the shared Supabase one): only with --yes
import fs from "fs";
import path from "path";
try { (process as unknown as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.(); } catch { /* no .env */ }

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  const host = (url.match(/@([^:/?]+)/) ?? [])[1] ?? "unknown host";
  const local = /^(localhost|127\.0\.0\.1)$/.test(host);
  if (!local && !process.argv.includes("--yes")) {
    console.error(`This would create indexes on ${host}, which is not a local database.\nIndexes briefly lock writes on those tables. Agree it with your team, then re-run with --yes.`);
    process.exit(2);
  }
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  const sql = fs.readFileSync(path.join(__dirname, "..", "prisma", "sql", "retrieval-index.sql"), "utf8");
  const statements = sql.split("\n").filter((l) => !l.trim().startsWith("--")).join("\n").split(";").map((s) => s.trim()).filter(Boolean);
  for (const s of statements) { await db.$executeRawUnsafe(s); console.log("ok:", s.replace(/\s+/g, " ").slice(0, 90)); }
  console.log(`Done on ${host}.`);
  await db.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
