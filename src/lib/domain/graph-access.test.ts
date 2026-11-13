import { describe, it, expect } from "vitest";
import { runInTransaction, type TestTransactionClient } from "tests/setup";
import { graphAccess } from "@/lib/domain/graph-access";

async function seed(tx: TestTransactionClient, tag: string) {
  const org = await tx.organisation.create({ data: { name: `Org ${tag}`, slug: `ga-${tag}-${Date.now()}` } });
  const mk = (role: string) => tx.user.create({ data: { orgId: org.id, name: role, email: `${tag}-${role}-${Date.now()}@example.com`, role } });
  const [manager, candidate, idle] = [await mk("MANAGER"), await mk("CANDIDATE"), await mk("CANDIDATE")];
  const project = await tx.project.create({ data: { orgId: org.id, name: "P" } });
  const repo = await tx.repository.create({ data: { orgId: org.id, projectId: project.id, name: "r", source: "local", location: "x" } });
  const path = await tx.learningPath.create({ data: { orgId: org.id, createdBy: manager.id, title: "T", type: "NEW_PROJECT" } });
  await tx.assignment.create({ data: { orgId: org.id, userId: candidate.id, pathId: path.id, pathVersion: 1, startDate: new Date() } });
  return { org, manager, candidate, idle, repo };
}

describe("graphAccess", () => {
  it("lets staff and an assigned candidate read; refuses an unassigned candidate; hides other orgs", async () => {
    await runInTransaction(async (tx) => {
      const a = await seed(tx, "a");
      const b = await seed(tx, "b");
      expect(await graphAccess(tx, a.manager, a.repo.id)).toBe("ok");
      expect(await graphAccess(tx, a.candidate, a.repo.id)).toBe("ok");
      expect(await graphAccess(tx, a.idle, a.repo.id)).toBe("forbidden");
      expect(await graphAccess(tx, b.manager, a.repo.id)).toBe("not_found"); // cross-org: indistinguishable from missing
      expect(await graphAccess(tx, a.manager, "nope")).toBe("not_found");
    });
  });
});
