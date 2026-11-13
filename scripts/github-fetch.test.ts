// Retry / backoff / rate-limit behaviour of fetchWithRetry (fake fetch + fake clock: no network, no real waiting).
import { test } from "vitest";
import assert from "node:assert/strict";
import { fetchWithRetry, rateLimitHint } from "../src/lib/github-fetch";

const res = (status: number, headers: Record<string, string> = {}) => new Response(status === 204 ? null : "body", { status, headers });
function harness(script: (Response | Error)[]) {
  const waits: number[] = [];
  let calls = 0;
  const fetchImpl = (async () => { const r = script[Math.min(calls++, script.length - 1)]; if (r instanceof Error) throw r; return r; }) as unknown as typeof fetch;
  return { waits, calls: () => calls, opts: { fetchImpl, sleep: async (ms: number) => { waits.push(ms); }, random: () => 0.5, now: () => 1_000_000_000_000 } };
}

test("success returns immediately without waiting", async () => {
  const h = harness([res(200)]);
  assert.equal((await fetchWithRetry("u", {}, h.opts)).status, 200);
  assert.equal(h.calls(), 1); assert.deepEqual(h.waits, []);
});

test("5xx is retried with doubling backoff, then succeeds", async () => {
  const h = harness([res(503), res(502), res(200)]);
  assert.equal((await fetchWithRetry("u", {}, { ...h.opts, baseMs: 100 })).status, 200);
  assert.equal(h.calls(), 3);
  assert.deepEqual(h.waits, [100, 200]); // jitter factor is exactly 1.0 when random() = 0.5
});

test("429 honours Retry-After", async () => {
  const h = harness([res(429, { "retry-after": "7" }), res(200)]);
  assert.equal((await fetchWithRetry("u", {}, h.opts)).status, 200);
  assert.deepEqual(h.waits, [7000]);
});

test("403 with an exhausted rate-limit window waits until x-ratelimit-reset (+1s)", async () => {
  const resetAt = 1_000_000_000 + 5; // 5 seconds after the fake clock
  const h = harness([res(403, { "x-ratelimit-remaining": "0", "x-ratelimit-reset": String(resetAt) }), res(200)]);
  assert.equal((await fetchWithRetry("u", {}, h.opts)).status, 200);
  assert.deepEqual(h.waits, [6000]);
});

test("a plain 403 (permissions) and a 404 are returned at once, never retried", async () => {
  for (const status of [403, 404, 401]) {
    const h = harness([res(status), res(200)]);
    assert.equal((await fetchWithRetry("u", {}, h.opts)).status, status);
    assert.equal(h.calls(), 1);
  }
});

test("a rate-limit reset farther away than maxWaitMs is not slept through", async () => {
  const h = harness([res(403, { "x-ratelimit-remaining": "0", "x-ratelimit-reset": String(1_000_000_000 + 3600) }), res(200)]);
  const r = await fetchWithRetry("u", {}, { ...h.opts, maxWaitMs: 20_000 });
  assert.equal(r.status, 403);
  assert.equal(h.calls(), 1); assert.deepEqual(h.waits, []);
  assert.match(rateLimitHint(r, 1_000_000_000_000)!, /resets in about 60 min.*GITHUB_TOKEN/);
});

test("network errors are retried, and the last error is thrown when attempts run out", async () => {
  const ok = harness([new TypeError("fetch failed"), res(200)]);
  assert.equal((await fetchWithRetry("u", {}, ok.opts)).status, 200);
  assert.equal(ok.calls(), 2);

  const bad = harness([new TypeError("down")]);
  await assert.rejects(fetchWithRetry("u", {}, { ...bad.opts, maxAttempts: 3 }), /down/);
  assert.equal(bad.calls(), 3);
});

test("persistent 5xx returns the last response after the attempts are used", async () => {
  const h = harness([res(500)]);
  const r = await fetchWithRetry("u", {}, { ...h.opts, maxAttempts: 3 });
  assert.equal(r.status, 500); assert.equal(h.calls(), 3); assert.equal(h.waits.length, 2);
});

test("onRetry reports each retry with its reason", async () => {
  const seen: string[] = [];
  const h = harness([res(429, { "retry-after": "1" }), res(200)]);
  await fetchWithRetry("u", {}, { ...h.opts, onRetry: (i) => seen.push(`${i.attempt}:${i.reason}`) });
  assert.deepEqual(seen, ["1:rate limited (Retry-After 1s)"]);
});
