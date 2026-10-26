import { createHash } from "crypto";
import type { ParsedSymbol } from "./parse";

export type ChunkDraft = {
  id: string;
  title: string;
  startLine: number;
  endLine: number;
  contentHash: string;
  estMinutes: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  symbolNames: string[];
};

const MAX_CHUNK_LINES = 120;
const GROUP_SMALL_UNDER = 25;
const GROUP_UP_TO = 80;
const TEXT_WINDOW = 80;

const h = (s: string) => createHash("sha1").update(s).digest("hex");

function finish(repoId: string, filePath: string, lines: string[], start: number, end: number, names: string[], title: string, seq: number): ChunkDraft {
  const body = lines.slice(start - 1, end).join("\n");
  const n = end - start + 1;
  // id stays stable while the same symbols live in the same file, even if their bodies change
  const id = "ck_" + h(`${repoId}|${filePath}|${names.length ? names.join(",") : `win${seq}`}`).slice(0, 20);
  return {
    id, title, startLine: start, endLine: end, contentHash: h(body),
    estMinutes: Math.max(1, Math.ceil(n / 25)),
    difficulty: n < 40 ? "EASY" : n < 100 ? "MEDIUM" : "HARD",
    symbolNames: names,
  };
}

// Chunks never split a function: oversized classes fall back to one chunk per method.
export function buildChunks(repoId: string, filePath: string, content: string, symbols: ParsedSymbol[]): ChunkDraft[] {
  const lines = content.split("\n");
  if (lines.length === 0 || !content.trim()) return [];
  const base = filePath.split("/").pop()!;
  const out: ChunkDraft[] = [];
  let seq = 0;

  const top = symbols.filter((s) => s.depth === 0).sort((a, b) => a.startLine - b.startLine);
  if (top.length === 0) {
    for (let s = 1; s <= lines.length; s += TEXT_WINDOW) {
      const e = Math.min(lines.length, s + TEXT_WINDOW - 1);
      out.push(finish(repoId, filePath, lines, s, e, [], lines.length > TEXT_WINDOW ? `${base} (part ${++seq})` : base, seq));
    }
    return out;
  }

  // units: top-level symbols; big classes expand into their methods
  type Unit = { start: number; end: number; name: string };
  const units: Unit[] = [];
  for (const s of top) {
    const size = s.endLine - s.startLine + 1;
    if (s.kind === "class" && size > MAX_CHUNK_LINES) {
      const methods = symbols.filter((m) => m.depth > 0 && m.startLine >= s.startLine && m.endLine <= s.endLine);
      let cursor = s.startLine;
      for (const m of methods.sort((a, b) => a.startLine - b.startLine)) {
        units.push({ start: cursor, end: m.endLine, name: `${s.name}.${m.name}` });
        cursor = m.endLine + 1;
      }
      if (cursor <= s.endLine && methods.length === 0) units.push({ start: s.startLine, end: s.endLine, name: s.name });
    } else units.push({ start: s.startLine, end: s.endLine, name: s.name });
  }

  let group: Unit[] = [];
  const flush = () => {
    if (!group.length) return;
    const start = group[0].start;
    const end = group[group.length - 1].end;
    const names = group.map((g) => g.name);
    const title = names.length === 1 ? names[0] : names.length <= 3 ? names.join(", ") : `${names[0]} and ${names.length - 1} more`;
    out.push(finish(repoId, filePath, lines, start, end, names, title, ++seq));
    group = [];
  };
  for (const u of units) {
    const size = u.end - u.start + 1;
    const groupSize = group.length ? u.end - group[0].start + 1 : 0;
    if (size < GROUP_SMALL_UNDER && groupSize + size <= GROUP_UP_TO) {
      group.push(u);
    } else {
      flush();
      if (size < GROUP_SMALL_UNDER) group.push(u);
      else {
        group.push(u);
        flush();
      }
    }
  }
  flush();
  // absorb leading imports/header into the first chunk so the file's context isn't lost
  if (out[0] && out[0].startLine > 1 && out[0].startLine <= 40) out[0].startLine = 1;
  return out;
}
