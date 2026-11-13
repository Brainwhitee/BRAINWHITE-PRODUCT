// Pure decisions for push-driven sync (Phase 6b). No DB, no network: tested in scripts/sync-plan.test.ts.
// Rule of thumb: incremental only when it is provably safe, otherwise fall back to the full sync that is already verified.

export type ChangeSet = {
  added: string[];
  modified: string[];
  removed: string[];
  before?: string | null; // sha the push started from (GitHub "before"); absent for manual triggers
  after?: string | null; // sha the push ended at
  unknown?: boolean; // payload could not tell us the full change list (truncated commits, force push, ...)
};

export const MAX_INCREMENTAL_FILES = 40;

// Changing any of these can change how every import resolves, or which files exist, so the whole graph must be rebuilt.
const CONFIG_FILE = /(^|\/)(tsconfig[^/]*\.json|jsconfig\.json|package\.json|pnpm-workspace\.yaml|pyproject\.toml|setup\.(py|cfg)|pom\.xml|build\.gradle(\.kts)?|\.gitignore|\.brainwhiteignore)$/;
export const isConfigFile = (path: string) => CONFIG_FILE.test(path);

export type SyncPlan =
  | { mode: "full"; reason: string }
  | { mode: "noop"; reason: string }
  | { mode: "incremental"; reason: string; files: string[] };

type Filter = (path: string, size: number) => string | null; // returns a skip reason, or null when the file is kept

export function planSync(a: { lastSha: string | null | undefined; change: ChangeSet; filter: Filter; maxFiles?: number }): SyncPlan {
  const { lastSha, change, filter } = a;
  const max = a.maxFiles ?? MAX_INCREMENTAL_FILES;
  if (!lastSha) return { mode: "full", reason: "repository has never been synced" };
  if (change.unknown) return { mode: "full", reason: "push payload does not list every changed file" };
  if (change.before && change.before !== lastSha) return { mode: "full", reason: "history gap: last synced commit is not the push's parent" };

  const all = [...new Set([...change.added, ...change.modified, ...change.removed])];
  if (all.some(isConfigFile)) return { mode: "full", reason: "a config file changed (imports may resolve differently)" };

  // Ignored files (docs, images, lockfiles, node_modules...) never enter the graph, so they cannot force a rebuild.
  const kept = (p: string) => filter(p, 0) === null;
  if (change.added.some(kept)) return { mode: "full", reason: "files were added (existing imports may now resolve)" };
  if (change.removed.some(kept)) return { mode: "full", reason: "files were removed" };

  const files = [...new Set(change.modified)].filter(kept);
  if (files.length === 0) return { mode: "noop", reason: "only ignored files changed" };
  if (files.length > max) return { mode: "full", reason: `${files.length} files changed (limit ${max})` };
  return { mode: "incremental", reason: `${files.length} modified file(s)`, files };
}

type PushPayload = {
  before?: string; after?: string; forced?: boolean; deleted?: boolean; created?: boolean;
  commits?: { added?: string[]; modified?: string[]; removed?: string[] }[];
  head_commit?: unknown;
};

// GitHub lists at most 20 commits per push; a force push or a new/deleted branch cannot be diffed from the payload alone.
export function changeFromPush(p: PushPayload): ChangeSet {
  const commits = p.commits ?? [];
  const set = (k: "added" | "modified" | "removed") => [...new Set(commits.flatMap((c) => c[k] ?? []))];
  // a file added in one commit and modified in a later one is still "added" for us; one removed later is not there at all
  const removed = set("removed");
  const added = set("added").filter((f) => !removed.includes(f));
  const modified = set("modified").filter((f) => !added.includes(f) && !removed.includes(f));
  const unknown = !!p.forced || !!p.deleted || !!p.created || commits.length === 0 || commits.length >= 20 || /^0+$/.test(p.before ?? "");
  return { added, modified, removed, before: p.before ?? null, after: p.after ?? null, unknown };
}
