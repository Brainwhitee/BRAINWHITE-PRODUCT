// Ranker tests (no DB, no network). Expectations are hand-written from the intent of each case.
import { test } from "vitest";
import assert from "node:assert/strict";
import { rankDocs, terms, queryTerms, type RankDoc } from "../src/lib/domain/rank";

const doc = (id: string, path: string, title: string, body: string, summary = "", fileKey = path): RankDoc => ({ id, fileKey, path, title, summary, body });

test("terms splits camelCase, snake_case and paths, and stems plurals", () => {
  assert.deepEqual(terms("syncRepository"), ["sync", "repository"]);
  assert.deepEqual(terms("SYNC_RUN_ID"), ["sync", "run", "id"]);
  assert.deepEqual(terms("src/lib/auth.ts"), ["src", "lib", "auth", "ts"]);
  assert.deepEqual(queryTerms("How does the sessions work?"), ["session"]);
});

test("a camelCase symbol in the question finds the function that defines it", () => {
  const docs = [
    doc("a", "src/auth.ts", "createSession", "export function createSession(user) { return sign(user) }"),
    doc("b", "src/mail.ts", "sendMail", "export function sendMail(to) { return post(to) }"),
    doc("c", "src/ui.ts", "Button", "export const Button = () => null"),
  ];
  const r = rankDocs(docs, "where is the session created? createSession");
  assert.equal(r[0].doc.id, "a");
  assert.ok(!r.some((x) => x.doc.id === "c"));
});

test("title and path hits beat a single body mention", () => {
  const docs = [
    doc("body", "src/misc.ts", "helper", "// we call retry here once"),
    doc("title", "src/retry.ts", "retryWithBackoff", "export async function retryWithBackoff(fn) {}"),
  ];
  assert.equal(rankDocs(docs, "retry backoff")[0].doc.id, "title");
});

test("graph boost: of two equal lexical hits, the one linked to the current file wins", () => {
  // "far" sorts first alphabetically, so only the graph can put "near" on top
  const docs = [
    doc("cur", "src/page.ts", "Page", "render page"),
    doc("far", "src/a/token.ts", "parse", "parse token value"),
    doc("near", "src/z/token.ts", "parse", "parse token value"),
  ];
  const edges: [string, string][] = [["src/page.ts", "src/z/token.ts"]];
  assert.equal(rankDocs(docs, "parse token")[0].doc.id, "far");
  const r = rankDocs(docs, "parse token", { currentId: "cur", edges });
  assert.equal(r[0].doc.id, "near");
  assert.ok(r[0].graph > r[1].graph);
});

test("graph boost: a hit linked to another hit beats an isolated hit", () => {
  const docs = [
    doc("iso", "src/a/lonely.ts", "load config", "load config file"),
    doc("x", "src/z/loader.ts", "load config", "load config file"),
    doc("y", "src/z/schema.ts", "config schema", "config shape"),
  ];
  const r = rankDocs(docs, "load config", { edges: [["src/z/loader.ts", "src/z/schema.ts"]] });
  assert.equal(r.findIndex((x) => x.doc.id === "x") < r.findIndex((x) => x.doc.id === "iso"), true);
});

test("token budget and per-file diversity are enforced", () => {
  const big = "x ".repeat(4000) + "needle";
  const docs = [
    doc("1", "f.ts", "needle one", big, "", "f.ts"), doc("2", "f.ts", "needle two", big, "", "f.ts"), doc("3", "f.ts", "needle three", big, "", "f.ts"),
    doc("4", "g.ts", "needle four", big, "", "g.ts"),
  ];
  const r = rankDocs(docs, "needle", { limit: 10, budgetTokens: 10_000 });
  assert.equal(r.filter((x) => x.doc.fileKey === "f.ts").length, 2);
  const tight = rankDocs(docs, "needle", { limit: 10, budgetTokens: 700 });
  assert.equal(tight.length, 1); // first doc always allowed, the rest exceed the budget
});

test("no query terms or no hits returns nothing", () => {
  assert.deepEqual(rankDocs([doc("a", "a.ts", "a", "a")], "the and for"), []);
  assert.deepEqual(rankDocs([doc("a", "a.ts", "alpha", "alpha")], "zebra"), []);
});
