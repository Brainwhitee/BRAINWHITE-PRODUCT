// Demo data so a fresh clone has something to click through. Idempotent: re-running is a no-op.
// Demo password for all seeded accounts is printed at the end (demo only; never use in a real deployment).
import bcrypt from "bcryptjs";
import { db } from "../src/lib/db";
import { syncRepository } from "../src/lib/analyser/pipeline";
import { createAssignment } from "../src/lib/domain/assign";

const PASSWORD = "demo12345";

async function main() {
  if (await db.organisation.findUnique({ where: { slug: "acme-demo" } })) {
    console.log("Demo org already exists. Delete prisma/dev.db to reseed.");
    return;
  }
  const hash = await bcrypt.hash(PASSWORD, 10);
  const org = await db.organisation.create({ data: { name: "Acme Demo", slug: "acme-demo" } });
  const mk = (name: string, email: string, role: string, gh?: string) =>
    db.user.upsert({ where: { email }, update: { orgId: org.id, name, role, passwordHash: hash, githubUsername: gh ?? null, githubUserId: gh ? `dev:${gh}` : null }, create: {

        orgId: org.id, name, email, role, passwordHash: hash,
        githubUsername: gh ?? null, githubUserId: gh ? `dev:${gh}` : null,

    } });
  const owner = await mk("Olivia Owner", "owner@demo.test", "OWNER");
  const manager = await mk("Mike Manager", "manager@demo.test", "MANAGER");
  const mentor = await mk("Maya Mentor", "mentor@demo.test", "MENTOR");
  const cand = await mk("Casey Candidate", "candidate@demo.test", "CANDIDATE", "casey-dev");

  // analyse this very repository as the "company codebase"
  const project = await db.project.create({ data: { orgId: org.id, name: "Brainwhite platform" } });
  const repo = await db.repository.create({
    data: { orgId: org.id, projectId: project.id, name: "brainwhite", source: "local", location: process.cwd(), branch: "main" },
  });
  process.env.ALLOW_LOCAL_REPOS = "true";
  console.log("Analysing the codebase (a few seconds)...");
  await syncRepository(repo.id);

  const chunks = await db.chunk.findMany({
    where: { repoId: repo.id, filePath: { in: ["src/lib/rbac.ts", "src/lib/auth.ts", "src/lib/domain/score.ts"] } },
    orderBy: [{ filePath: "asc" }, { startLine: "asc" }],
  });
  const path = await db.learningPath.create({
    data: {
      orgId: org.id, createdBy: manager.id, title: "Backend onboarding: core platform", role: "Backend",
      description: "Auth, permissions and PR scoring: the three things every new engineer touches first.", status: "PUBLISHED",
    },
  });
  const week1 = await db.pathSection.create({ data: { pathId: path.id, title: "Week 1: foundations", order: 0 } });
  await db.pathItem.create({
    data: {
      sectionId: week1.id, type: "CONTENT", title: "Welcome and team conventions", order: 0, dueDay: 1,
      body: "Welcome to Acme!\n\n- Branch names: task-<issue number>-short-name\n- Reference the issue in every PR (\"Closes #n\")\n- Add or update tests for behaviour changes\n- Ask your mentor early when blocked",
    },
  });
  let order = 1;
  for (const c of chunks) await db.pathItem.create({ data: { sectionId: week1.id, type: "CHUNK", refId: c.id, title: c.title, order: order++, dueDay: 2 + order } });

  const t1 = await db.task.create({
    data: {
      orgId: org.id, pathId: path.id, repoId: repo.id, title: "Add a unit test for can()", issueNumber: 101, deadlineDay: 5,
      description: "Add tests covering each role in the permission table.", acceptance: JSON.stringify(["Covers all four roles", "Runs in CI"]), reviewerId: mentor.id,
    },
  });
  await db.task.create({
    data: {
      orgId: org.id, pathId: path.id, repoId: repo.id, title: "Document the PR scoring weights", issueNumber: 102, deadlineDay: 9, difficulty: "MEDIUM", estHours: 6,
      description: "Write a short doc explaining each sub-score.", acceptance: JSON.stringify(["Doc added under docs/", "Linked from README"]),
    },
  });
  void t1;
  await createAssignment({ orgId: org.id, userId: cand.id, pathId: path.id, startDate: new Date(Date.now() - 2 * 86400_000), mentorId: mentor.id, assignerName: manager.name });

  console.log("\nSeed complete. Log in at http://localhost:3000/login (password for all: " + PASSWORD + "):");
  for (const u of [owner, manager, mentor, cand]) console.log(`  ${u.role.padEnd(9)} ${u.email}`);
}

main().finally(() => db.$disconnect());
