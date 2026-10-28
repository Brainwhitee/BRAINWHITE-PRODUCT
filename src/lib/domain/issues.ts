import { db } from "../db";

// Creates a GitHub issue when GITHUB_TOKEN + a github-sourced repo exist; otherwise a local placeholder number
// so the rest of the flow (linking, auto-status) still works in dev (ADM-10).
export async function createIssueForTask(orgId: string, repoId: string | null, title: string, body: string) {
  const repo = repoId ? await db.repository.findFirst({ where: { id: repoId, orgId } }) : null;
  if (repo?.source === "github" && process.env.GITHUB_TOKEN) {
    const r = await fetch(`https://api.github.com/repos/${repo.location}/issues`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, "User-Agent": "brainwhite", Accept: "application/vnd.github+json" },
      body: JSON.stringify({ title, body, labels: ["onboarding"] }),
    });
    if (r.ok) {
      const d = await r.json();
      return { number: d.number as number, url: d.html_url as string, real: true };
    }
  }
  const max = await db.task.aggregate({ where: { orgId }, _max: { issueNumber: true } });
  return { number: (max._max.issueNumber ?? 100) + 1, url: null as string | null, real: false };
}

export async function assignIssue(repoLocation: string, issueNumber: number, login: string) {
  if (!process.env.GITHUB_TOKEN) return;
  await fetch(`https://api.github.com/repos/${repoLocation}/issues/${issueNumber}/assignees`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, "User-Agent": "brainwhite", Accept: "application/vnd.github+json" },
    body: JSON.stringify({ assignees: [login] }),
  }).catch(() => {});
}

export function parseIssueUrl(url: string) {
  const m = url.match(/github\.com\/([\w.-]+\/[\w.-]+)\/issues\/(\d+)/);
  return m ? { repo: m[1], number: Number(m[2]) } : null;
}
