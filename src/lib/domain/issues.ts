import { db } from "../db";
import { getOrgGithubToken } from "./github-app";

// Creates a GitHub issue when GitHub App / custom PAT / GITHUB_TOKEN + a github-sourced repo exist;
// otherwise a local placeholder number so the rest of the flow (linking, auto-status) still works in dev (ADM-10).
export async function createIssueForTask(orgId: string, repoId: string | null, title: string, body: string) {
  const repo = repoId ? await db.repository.findFirst({ where: { id: repoId, orgId } }) : null;
  const token = await getOrgGithubToken(orgId);
  if (repo?.source === "github" && token) {
    const r = await fetch(`https://api.github.com/repos/${repo.location}/issues`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "User-Agent": "brainwhite", Accept: "application/vnd.github+json" },
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

export async function assignIssue(
  orgIdOrRepoLocation: string,
  issueNumberOrRepoLocation?: any,
  loginOrIssueNumber?: any,
  maybeLogin?: string
) {
  let token: string | null = null;
  let repoLocation: string;
  let issueNumber: number;
  let login: string;

  if (typeof maybeLogin === "string") {
    token = await getOrgGithubToken(orgIdOrRepoLocation);
    repoLocation = issueNumberOrRepoLocation;
    issueNumber = loginOrIssueNumber;
    login = maybeLogin;
  } else {
    token = process.env.GITHUB_TOKEN ?? null;
    repoLocation = orgIdOrRepoLocation;
    issueNumber = issueNumberOrRepoLocation;
    login = loginOrIssueNumber;
  }

  if (!token) return;
  await fetch(`https://api.github.com/repos/${repoLocation}/issues/${issueNumber}/assignees`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "User-Agent": "brainwhite", Accept: "application/vnd.github+json" },
    body: JSON.stringify({ assignees: [login] }),
  }).catch(() => {});
}

export function parseIssueUrl(url: string) {
  const m = url.match(/github\.com\/([\w.-]+\/[\w.-]+)\/issues\/(\d+)/);
  return m ? { repo: m[1], number: Number(m[2]) } : null;
}
