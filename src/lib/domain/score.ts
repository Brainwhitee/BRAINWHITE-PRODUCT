// Deterministic PR quality rubric (ADM-18 / AI-05 MVP). Same inputs always give the same score.
// An LLM rubric review against repo conventions plugs in later; sub-scores here stay the explainable base.

export type PrFacts = {
  additions: number;
  deletions: number;
  body: string;
  changedFiles: string[];
  commitMessages: string[];
  ciStatus: string; // pending | success | failure
  ciFirstTryPass: boolean | null;
  reviewRounds: number;
  conflictCount: number;
};

export const WEIGHTS = { size: 0.15, description: 0.2, tests: 0.2, ci: 0.15, review: 0.15, commits: 0.1, conflicts: 0.05 };

const isTest = (f: string) => /(^|\/)(tests?|__tests__|spec)\/|\.(test|spec)\.[a-z]+$|_test\.(py|go)$/i.test(f);
const isDoc = (f: string) => /\.(md|txt|rst)$/i.test(f);

function commitQuality(msgs: string[]) {
  if (!msgs.length) return 60;
  const good = msgs.filter((m) => {
    const first = m.split("\n")[0].trim();
    return first.length >= 12 && !/^(wip|fix|update|changes?|stuff|misc|\.+)$/i.test(first);
  }).length;
  return Math.round((good / msgs.length) * 100);
}

export function scorePr(f: PrFacts) {
  const lines = f.additions + f.deletions;
  const size = lines <= 200 ? 100 : lines <= 400 ? 80 : lines <= 800 ? 50 : 25;
  const l = f.body.trim().length;
  const description = l >= 200 ? 100 : l >= 80 ? 75 : l >= 20 ? 50 : 20;
  const code = f.changedFiles.filter((x) => !isDoc(x));
  const tests = f.changedFiles.some(isTest) ? 100 : code.length === 0 ? 70 : 30;
  const ci = f.ciStatus === "success" ? (f.ciFirstTryPass === false ? 80 : 100) : f.ciStatus === "failure" ? 40 : 60;
  const review = [100, 80, 60][f.reviewRounds] ?? 35;
  const commits = commitQuality(f.commitMessages);
  const conflicts = f.conflictCount === 0 ? 100 : f.conflictCount === 1 ? 75 : 50;
  const parts = { size, description, tests, ci, review, commits, conflicts };
  const score = Math.round(Object.entries(WEIGHTS).reduce((n, [k, w]) => n + parts[k as keyof typeof parts] * w, 0));

  const strengths: string[] = [];
  const improve: string[] = [];
  (size >= 80 ? strengths : improve).push(size >= 80 ? "Small, reviewable PR size" : `Large change (${lines} lines): split into smaller PRs`);
  (description >= 75 ? strengths : improve).push(description >= 75 ? "Clear PR description" : "Add a fuller description: what, why, how to test");
  (tests >= 70 ? strengths : improve).push(tests >= 70 ? "Tests included or not needed" : "No test files changed: add tests for new behaviour");
  if (ci < 80) improve.push(f.ciStatus === "failure" ? "CI is failing: fix before requesting review" : "CI has not passed on the first try");
  else strengths.push("CI passed");
  if (f.reviewRounds >= 2) improve.push(`${f.reviewRounds} review rounds: self-review the diff before requesting review`);
  if (commits < 70) improve.push("Write descriptive commit messages (avoid 'wip', 'fix', 'update')");
  if (f.conflictCount > 0) improve.push(`Hit merge conflicts ${f.conflictCount}x: rebase on main more often`);
  return { score, parts, feedback: JSON.stringify({ strengths, improve }) };
}
