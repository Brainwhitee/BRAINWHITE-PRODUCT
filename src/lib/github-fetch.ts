// fetch() for GitHub with retries: network errors, 5xx, 429 and rate-limit 403s are retried with backoff (honouring
// Retry-After / x-ratelimit-reset). A wait longer than maxWaitMs is not slept through: the response is returned so the
// caller can fail fast with a clear message. Plain 403/404 (permissions, missing file) are never retried.
// Everything is injectable (fetch, sleep, clock, randomness) so the behaviour is unit-tested without a network.

export type RetryOpts = {
  maxAttempts?: number; // total tries, default 4
  baseMs?: number; // first backoff, doubles each time (default 500)
  maxWaitMs?: number; // never sleep longer than this for one retry (default 20s)
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number; // ms since epoch
  random?: () => number; // 0..1, for jitter
  onRetry?: (info: { attempt: number; waitMs: number; reason: string }) => void;
};

const RETRY_STATUS = new Set([500, 502, 503, 504]);

// ms to wait before retrying this response, or null when it must not be retried
export function retryDelay(res: Response, attempt: number, o: Required<Pick<RetryOpts, "baseMs" | "now" | "random">>): { waitMs: number; reason: string } | null {
  const backoff = o.baseMs * 2 ** attempt * (0.75 + 0.5 * o.random());
  const remaining = res.headers.get("x-ratelimit-remaining");
  const rateLimited = res.status === 429 || (res.status === 403 && (remaining === "0" || res.headers.has("retry-after")));
  if (rateLimited) {
    const ra = Number(res.headers.get("retry-after"));
    if (Number.isFinite(ra) && ra > 0) return { waitMs: ra * 1000, reason: `rate limited (Retry-After ${ra}s)` };
    const reset = Number(res.headers.get("x-ratelimit-reset"));
    if (Number.isFinite(reset) && reset > 0) return { waitMs: Math.max(0, reset * 1000 - o.now()) + 1000, reason: "rate limit window exhausted" };
    return { waitMs: backoff, reason: `rate limited (${res.status})` };
  }
  if (RETRY_STATUS.has(res.status)) return { waitMs: backoff, reason: `GitHub ${res.status}` };
  return null;
}

export async function fetchWithRetry(url: string, init: RequestInit = {}, opts: RetryOpts = {}): Promise<Response> {
  const maxAttempts = opts.maxAttempts ?? 4;
  const baseMs = opts.baseMs ?? 500;
  const maxWaitMs = opts.maxWaitMs ?? 20_000;
  const doFetch = opts.fetchImpl ?? fetch;
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const now = opts.now ?? Date.now;
  const random = opts.random ?? Math.random;

  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let res: Response;
    try {
      res = await doFetch(url, init);
    } catch (e) {
      lastErr = e; // DNS failure, connection reset, timeout...
      if (attempt === maxAttempts - 1) break;
      const waitMs = Math.min(baseMs * 2 ** attempt * (0.75 + 0.5 * random()), maxWaitMs);
      opts.onRetry?.({ attempt: attempt + 1, waitMs, reason: `network error: ${e instanceof Error ? e.message : String(e)}` });
      await sleep(waitMs);
      continue;
    }
    const delay = retryDelay(res, attempt, { baseMs, now, random });
    if (!delay || attempt === maxAttempts - 1) return res; // success, a non-retryable error, or out of attempts
    if (delay.waitMs > maxWaitMs) return res; // would block too long: let the caller report it
    opts.onRetry?.({ attempt: attempt + 1, waitMs: delay.waitMs, reason: delay.reason });
    await res.body?.cancel().catch(() => {}); // free the connection before waiting
    await sleep(delay.waitMs);
  }
  throw lastErr instanceof Error ? lastErr : new Error("GitHub request failed");
}

// Human-readable hint for a failed response, e.g. "rate limited, resets in 12 min".
export function rateLimitHint(res: Response, now = Date.now()): string | null {
  if (!(res.status === 429 || (res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0"))) return null;
  const reset = Number(res.headers.get("x-ratelimit-reset"));
  if (Number.isFinite(reset) && reset > 0) return `GitHub rate limit reached, resets in about ${Math.max(1, Math.ceil((reset * 1000 - now) / 60_000))} min. Set GITHUB_TOKEN to raise the limit.`;
  return "GitHub rate limit reached. Set GITHUB_TOKEN to raise the limit.";
}
