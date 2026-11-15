// Symbol-edge expectations written by hand from the fixture source below (not copied from tool output).
import { describe, expect, test } from "vitest";
import { languageOf } from "../src/lib/analyser/filter";
import { parseSource } from "../src/lib/analyser/parse";
import { createResolver } from "../src/lib/analyser/resolve-ts";
import { buildSymbolEdges, withSymbolIds, type FileFacts } from "../src/lib/analyser/edges";

const FILES: Record<string, string> = {
  "src/auth.ts": `export function createSession() { return hash("x"); }
function hash(s: string) { return s; }
export class Base {}
export interface Store {}`,
  "src/api.ts": `import { createSession, Base, type Store } from "./auth";
import * as auth from "./auth";
export class Api extends Base implements Store {
  login() { return createSession(); }
  other() { return this.login(); }
  viaNs() { return auth.createSession(); }
}
export function top() { return new Api(); }
createSession();`,
  "src/ui.tsx": `import { top } from "./api";
export function Page() { return <div>{top()}</div>; }
export function App() { return <Page />; }`,
};

async function edges() {
  const resolve = createResolver(new Set(Object.keys(FILES)), (p) => FILES[p]);
  const facts: FileFacts[] = [];
  for (const [path, code] of Object.entries(FILES)) {
    const lang = languageOf(path);
    const res = await parseSource(lang, code);
    facts.push({ path, lang, fileId: "file:" + path, symbols: withSymbolIds("r", path, res?.symbols ?? []), refs: res?.refs });
  }
  const name = new Map<string, string>();
  for (const f of facts) for (const s of f.symbols) name.set(s.id, `${s.name}@${f.path}`);
  return buildSymbolEdges(facts, resolve).map((e) => `${e.fromKind === "file" ? e.fromId : name.get(e.fromId)} -${e.type}/${e.confidence}-> ${name.get(e.toId)}`);
}

describe("symbol edges", () => {
  test("calls, new, jsx, extends, implements", async () => {
    const got = new Set(await edges());
    const want = [
      "createSession@src/auth.ts -CALLS/EXACT-> hash@src/auth.ts", // same-file call
      "login@src/api.ts -CALLS/EXACT-> createSession@src/auth.ts", // via import binding
      "viaNs@src/api.ts -CALLS/EXACT-> createSession@src/auth.ts", // namespace import
      "file:src/api.ts -CALLS/EXACT-> createSession@src/auth.ts", // top-level call
      "top@src/api.ts -CALLS/EXACT-> Api@src/api.ts", // new Api()
      "Api@src/api.ts -EXTENDS/EXACT-> Base@src/auth.ts",
      "Api@src/api.ts -IMPLEMENTS/EXACT-> Store@src/auth.ts",
      "Page@src/ui.tsx -CALLS/EXACT-> top@src/api.ts",
      "App@src/ui.tsx -REFERENCES/EXACT-> Page@src/ui.tsx", // <Page />
    ];
    for (const w of want) expect(got, w).toContain(w);
  });
  test("this.method() is only a name match, never exact", async () => {
    const got = await edges();
    expect(got).toContain("other@src/api.ts -CALLS/NAME_MATCH-> login@src/api.ts");
    expect(got.filter((e) => e.startsWith("other@") && e.includes("EXACT"))).toEqual([]);
  });
});
