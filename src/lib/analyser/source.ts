import fs from "fs/promises";
import os from "os";
import path from "path";
import { Readable } from "stream";
import { pipeline as streamPipeline } from "stream/promises";
import * as tar from "tar";
import { IGNORED_DIRS } from "./filter";

export type SourceFile = { path: string; size: number; abs: string };
export type LoadedSource = { root: string; files: SourceFile[]; sha: string | null; cleanup: () => Promise<void> };

async function walk(root: string, rel = "", out: SourceFile[] = []): Promise<SourceFile[]> {
  for (const e of await fs.readdir(path.join(root, rel), { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isSymbolicLink()) continue;
    if (e.isDirectory()) {
      if (!IGNORED_DIRS.has(e.name)) await walk(root, r, out);
    } else if (e.isFile()) {
      const abs = path.join(root, r);
      out.push({ path: r, size: (await fs.stat(abs)).size, abs });
    }
  }
  return out;
}

export async function loadSource(source: string, location: string, branch: string): Promise<LoadedSource> {
  if (source === "local") {
    // Reading arbitrary server paths is only acceptable for local development.
    if (process.env.ALLOW_LOCAL_REPOS !== "true") throw new Error("Local folder sources are disabled (set ALLOW_LOCAL_REPOS=true for dev)");
    const root = path.resolve(location);
    await fs.access(root);
    return { root, files: await walk(root), sha: null, cleanup: async () => {} };
  }

  // GitHub public repo (or private with GITHUB_TOKEN) via tarball download
  if (!/^[\w.-]+\/[\w.-]+$/.test(location)) throw new Error("GitHub source must look like owner/name");
  const headers: Record<string, string> = { "User-Agent": "pedagon" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const res = await fetch(`https://codeload.github.com/${location}/tar.gz/${encodeURIComponent(branch)}`, { headers });
  if (!res.ok || !res.body) throw new Error(`GitHub download failed (${res.status}). Check owner/name, branch and access.`);
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pedagon-"));
  await streamPipeline(Readable.fromWeb(res.body as never), tar.x({ cwd: dir, strip: 1 }));

  let sha: string | null = null;
  try {
    const c = await fetch(`https://api.github.com/repos/${location}/commits/${encodeURIComponent(branch)}`, { headers });
    if (c.ok) sha = (await c.json()).sha;
  } catch {}
  return { root: dir, files: await walk(dir), sha, cleanup: () => fs.rm(dir, { recursive: true, force: true }) };
}
