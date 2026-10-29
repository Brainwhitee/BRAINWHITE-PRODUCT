import fs from "fs/promises";
import path from "path";
import type { Parser as ParserT, Language as LanguageT, Node } from "web-tree-sitter";
import { extractRefs, type Refs } from "./refs";

export type ParsedSymbol = {
  kind: "class" | "function" | "method" | "interface";
  name: string;
  signature: string;
  doc: string;
  startLine: number; // 1-based
  endLine: number;
  depth: number; // 0 = top-level
};
export type ParseResult = { symbols: ParsedSymbol[]; imports: string[]; refs?: Refs };

// Load the CJS build by absolute path so the bundler never rewrites web-tree-sitter's internal requires.
const nodeRequire: NodeRequire = eval("require");
const nm = (...p: string[]) => path.join(/*turbopackIgnore: true*/ process.cwd(), "node_modules", ...p);
const WASM: Record<string, string> = {
  javascript: "javascript", typescript: "typescript", tsx: "tsx", python: "python", java: "java",
};
const TS = () => nodeRequire(nm("web-tree-sitter", "tree-sitter.cjs")) as { Parser: typeof ParserT; Language: typeof LanguageT };
let ready: Promise<void> | null = null;
const langs = new Map<string, LanguageT>();

async function getLanguage(lang: string): Promise<LanguageT | null> {
  const w = WASM[lang];
  if (!w) return null;
  ready ??= TS().Parser.init({
    locateFile: (f: string) => nm("web-tree-sitter", f),
  });
  await ready;
  if (!langs.has(lang)) langs.set(lang, await TS().Language.load(new Uint8Array(await fs.readFile(nm("tree-sitter-wasms", "out", `tree-sitter-${w}.wasm`)))));
  return langs.get(lang)!;
}

export const isParsable = (lang: string) => lang in WASM;

const firstLine = (n: Node) => n.text.split("\n")[0].trim().replace(/\s*\{$/, "").slice(0, 200);

function nameOf(n: Node): string {
  return n.childForFieldName("name")?.text ?? "anonymous";
}

function docBefore(n: Node, lang: string): string {
  if (lang === "python") {
    const body = n.childForFieldName("body");
    const first = body?.namedChild(0);
    if (first?.type === "expression_statement" && first.firstChild?.type === "string")
      return first.firstChild.text.replace(/^[rbuf]*("""|'''|"|')|("""|'''|"|')$/g, "").trim().slice(0, 400);
    return "";
  }
  let prev = n.previousNamedSibling;
  if (n.parent?.type === "export_statement") prev = n.parent.previousNamedSibling;
  if (prev && (prev.type === "comment" || prev.type === "block_comment" || prev.type === "line_comment"))
    return prev.text.replace(/^\s*(\/\*+|\/\/+|\*+\/?)\s?/gm, "").replace(/\*\/\s*$/, "").trim().slice(0, 400);
  return "";
}

const JS_FN_VALUES = new Set(["arrow_function", "function_expression", "function"]);

function walk(node: Node, lang: string, depth: number, inClass: boolean, out: ParsedSymbol[]) {
  for (let i = 0; i < node.namedChildCount; i++) {
    const c = node.namedChild(i)!;
    let kind: ParsedSymbol["kind"] | null = null;
    let name = "";
    let recurseInto: Node | null = null;
    let isClass = false;

    switch (c.type) {
      case "function_declaration":
      case "generator_function_declaration":
      case "function_definition":
        kind = inClass ? "method" : "function";
        name = nameOf(c);
        break;
      case "method_definition":
      case "method_declaration":
      case "constructor_declaration":
        kind = "method";
        name = nameOf(c);
        break;
      case "class_declaration":
      case "class_definition":
        kind = "class";
        name = nameOf(c);
        recurseInto = c.childForFieldName("body");
        isClass = true;
        break;
      case "interface_declaration":
        kind = "interface";
        name = nameOf(c);
        break;
      case "lexical_declaration":
      case "variable_declaration": {
        // const foo = () => {}
        for (let j = 0; j < c.namedChildCount; j++) {
          const d = c.namedChild(j)!;
          const v = d.childForFieldName("value");
          if (d.type === "variable_declarator" && v && JS_FN_VALUES.has(v.type)) {
            kind = "function";
            name = nameOf(d);
            break;
          }
        }
        break;
      }
      case "export_statement":
      case "decorated_definition":
        // unwrap and handle the inner declaration at the same depth
        walk(c, lang, depth, inClass, out);
        continue;
    }

    if (kind) {
      out.push({
        kind,
        name,
        signature: firstLine(c),
        doc: docBefore(c, lang),
        startLine: (c.parent?.type === "export_statement" || c.parent?.type === "decorated_definition" ? c.parent : c).startPosition.row + 1,
        endLine: c.endPosition.row + 1,
        depth,
      });
      if (isClass && recurseInto) walk(recurseInto, lang, depth + 1, true, out);
    } else if (c.type === "class_body" || c.type === "block") {
      walk(c, lang, depth, inClass, out);
    }
  }
}

const unquote = (t: string) => t.replace(/^["'`]|["'`]$/g, "");

// JS/TS: static imports, re-exports, require("x") and import("x"), found anywhere in the file (not only at top level).
function collectJsImports(node: Node, found: Set<string>) {
  const t = node.type;
  if (t === "import_statement" || t === "export_statement") {
    const src = node.childForFieldName("source");
    if (src) found.add(unquote(src.text));
  } else if (t === "call_expression") {
    const fn = node.childForFieldName("function");
    const args = node.childForFieldName("arguments");
    if (fn && args && (fn.type === "import" || (fn.type === "identifier" && fn.text === "require"))) {
      const a = args.namedChild(0);
      if (a && a.type === "string") found.add(unquote(a.text));
    }
  }
  for (let i = 0; i < node.namedChildCount; i++) collectJsImports(node.namedChild(i)!, found);
}

function collectImports(root: Node, lang: string): string[] {
  if (lang !== "python" && lang !== "java") {
    const found = new Set<string>();
    collectJsImports(root, found);
    return [...found];
  }
  const found: string[] = [];
  for (let i = 0; i < root.namedChildCount; i++) {
    const c = root.namedChild(i)!;
    if (lang === "python") {
      if (c.type === "import_from_statement") {
        const m = c.childForFieldName("module_name");
        if (m) found.push(m.text);
      } else if (c.type === "import_statement") {
        for (let j = 0; j < c.namedChildCount; j++) {
          const n = c.namedChild(j)!;
          found.push(n.type === "aliased_import" ? n.childForFieldName("name")!.text : n.text);
        }
      }
    } else if (c.type === "import_declaration") {
      found.push(c.text.replace(/^import\s+(static\s+)?|;$/g, "").trim());
    }
  }
  return found;
}

export async function parseSource(lang: string, source: string): Promise<ParseResult | null> {
  const language = await getLanguage(lang);
  if (!language) return null;
  const parser = new (TS().Parser)();
  parser.setLanguage(language);
  const tree = parser.parse(source);
  if (!tree) return null;
  const symbols: ParsedSymbol[] = [];
  walk(tree.rootNode, lang, 0, false, symbols);
  const imports = collectImports(tree.rootNode, lang);
  const refs = lang === "python" || lang === "java" ? undefined : extractRefs(tree.rootNode);
  tree.delete();
  parser.delete();
  return { symbols, imports, refs };
}
