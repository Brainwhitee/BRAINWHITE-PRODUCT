// Fixture repos: tiny repos under scripts/fixtures/<name>/ with a hand-written expected.json.
// The test runs the real parse + resolve code over each repo and compares the import graph to what a person expects.
import fs from "fs";
import path from "path";
import { describe, expect, test } from "vitest";
import { languageOf } from "../src/lib/analyser/filter";
import { isParsable, parseSource } from "../src/lib/analyser/parse";
import { createResolver } from "../src/lib/analyser/resolve-ts";

const ROOT = path.join(__dirname, "fixtures");

function walk(dir: string, rel = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) Object.assign(out, walk(dir, r));
    else if (e.name !== "expected.json") out[r] = fs.readFileSync(path.join(dir, r), "utf8");
  }
  return out;
}

describe("fixture repos", () => {
  for (const name of fs.readdirSync(ROOT).sort()) {
    test(name, async () => {
      const files = walk(path.join(ROOT, name));
      const expected = JSON.parse(fs.readFileSync(path.join(ROOT, name, "expected.json"), "utf8")) as {
        edges: [string, string][]; unresolved: [string, string][]; external: string[];
      };
      const resolve = createResolver(new Set(Object.keys(files)), (p) => files[p]);
      const edges = new Set<string>(), unresolved = new Set<string>(), external = new Set<string>();
      for (const [file, code] of Object.entries(files)) {
        const lang = languageOf(file);
        if (!isParsable(lang)) continue;
        for (const spec of (await parseSource(lang, code))?.imports ?? []) {
          const r = resolve(file, spec, lang);
          if (r.kind === "internal") edges.add(`${file} -> ${r.target}`);
          else if (r.kind === "unresolved") unresolved.add(`${file} :: ${spec}`);
          else external.add(spec);
        }
      }
      expect([...edges].sort()).toEqual(expected.edges.map(([a, b]) => `${a} -> ${b}`).sort());
      expect([...unresolved].sort()).toEqual(expected.unresolved.map(([a, b]) => `${a} :: ${b}`).sort());
      expect([...external].sort()).toEqual([...expected.external].sort());
    });
  }
});
