import type { Node } from "web-tree-sitter";

// Raw references found in one JS/TS/TSX file (CBA-09). Names only: turning them into graph edges needs the
// whole repo (imports, symbols) and happens in edges.ts.

export type ImportBinding = { local: string; spec: string; imported: string }; // imported: a name, "default" or "*"
export type CallSite = { name: string; receiver: string | null; line: number; kind: "call" | "jsx" | "new" };
export type Heritage = { cls: string; sup: string; kind: "extends" | "implements"; line: number };
export type Refs = { bindings: ImportBinding[]; calls: CallSite[]; heritage: Heritage[] };

const unquote = (t: string) => t.replace(/^["'`]|["'`]$/g, "");
const line = (n: Node) => n.startPosition.row + 1;

function importBindings(node: Node, out: ImportBinding[]) {
  const spec = node.childForFieldName("source");
  if (!spec) return;
  const from = unquote(spec.text);
  for (let i = 0; i < node.namedChildCount; i++) {
    const clause = node.namedChild(i)!;
    if (clause.type !== "import_clause") continue;
    for (let j = 0; j < clause.namedChildCount; j++) {
      const c = clause.namedChild(j)!;
      if (c.type === "identifier") out.push({ local: c.text, spec: from, imported: "default" });
      else if (c.type === "namespace_import") {
        const id = c.namedChild(0);
        if (id) out.push({ local: id.text, spec: from, imported: "*" });
      } else if (c.type === "named_imports") {
        for (let k = 0; k < c.namedChildCount; k++) {
          const s = c.namedChild(k)!;
          if (s.type !== "import_specifier") continue;
          const name = s.childForFieldName("name")?.text;
          const alias = s.childForFieldName("alias")?.text;
          if (name) out.push({ local: alias ?? name, spec: from, imported: name });
        }
      }
    }
  }
}

// const x = require("m")  /  const { a, b: c } = require("m")
function requireBindings(node: Node, out: ImportBinding[]) {
  const value = node.childForFieldName("value");
  const target = node.childForFieldName("name");
  if (!value || !target || value.type !== "call_expression") return;
  const fn = value.childForFieldName("function");
  const arg = value.childForFieldName("arguments")?.namedChild(0);
  if (!fn || fn.text !== "require" || !arg || arg.type !== "string") return;
  const spec = unquote(arg.text);
  if (target.type === "identifier") out.push({ local: target.text, spec, imported: "*" });
  else if (target.type === "object_pattern") {
    for (let i = 0; i < target.namedChildCount; i++) {
      const p = target.namedChild(i)!;
      if (p.type === "shorthand_property_identifier_pattern") out.push({ local: p.text, spec, imported: p.text });
      else if (p.type === "pair_pattern") {
        const key = p.childForFieldName("key")?.text;
        const val = p.childForFieldName("value")?.text;
        if (key && val) out.push({ local: val, spec, imported: key });
      }
    }
  }
}

function callee(fn: Node | null): { name: string; receiver: string | null } | null {
  if (!fn) return null;
  if (fn.type === "identifier") return { name: fn.text, receiver: null };
  if (fn.type === "member_expression") {
    const prop = fn.childForFieldName("property")?.text;
    const obj = fn.childForFieldName("object");
    if (!prop) return null;
    return { name: prop, receiver: obj && (obj.type === "identifier" || obj.type === "this") ? obj.text : null };
  }
  return null;
}

function heritage(cls: Node, out: Heritage[]) {
  const name = cls.childForFieldName("name")?.text;
  if (!name) return;
  for (let i = 0; i < cls.namedChildCount; i++) {
    const h = cls.namedChild(i)!;
    if (h.type !== "class_heritage") continue;
    for (let j = 0; j < h.namedChildCount; j++) {
      const c = h.namedChild(j)!;
      if (c.type === "extends_clause") {
        const v = c.childForFieldName("value");
        if (v) out.push({ cls: name, sup: v.text.split(".").pop()!, kind: "extends", line: line(c) });
      } else if (c.type === "implements_clause") {
        for (let k = 0; k < c.namedChildCount; k++) out.push({ cls: name, sup: c.namedChild(k)!.text, kind: "implements", line: line(c) });
      } else if (c.type === "identifier") {
        out.push({ cls: name, sup: c.text, kind: "extends", line: line(h) }); // plain JS grammar: extends Base
      }
    }
  }
}

export function extractRefs(root: Node): Refs {
  const refs: Refs = { bindings: [], calls: [], heritage: [] };
  const visit = (n: Node) => {
    switch (n.type) {
      case "import_statement": importBindings(n, refs.bindings); break;
      case "variable_declarator": requireBindings(n, refs.bindings); break;
      case "call_expression": {
        const c = callee(n.childForFieldName("function"));
        if (c && c.name !== "require") refs.calls.push({ ...c, line: line(n), kind: "call" });
        break;
      }
      case "new_expression": {
        const c = callee(n.childForFieldName("constructor"));
        if (c) refs.calls.push({ ...c, line: line(n), kind: "new" });
        break;
      }
      case "jsx_opening_element":
      case "jsx_self_closing_element": {
        const name = n.childForFieldName("name");
        const c = name && callee(name);
        // lowercase tags are DOM elements, not components
        if (c && /^[A-Z]/.test(c.receiver ?? c.name)) refs.calls.push({ ...c, line: line(n), kind: "jsx" });
        break;
      }
      case "class_declaration":
      case "class": heritage(n, refs.heritage); break;
    }
    for (let i = 0; i < n.namedChildCount; i++) visit(n.namedChild(i)!);
  };
  visit(root);
  return refs;
}
