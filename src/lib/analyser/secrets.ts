// Redact secrets before anything is stored or sent to an LLM (CBA-21).
const PATTERNS: RegExp[] = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g,
  /\bsk-[A-Za-z0-9_-]{20,}\b/g,
  /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g,
  /\bAIza[0-9A-Za-z_-]{35}\b/g,
  /(?<=(?:api[_-]?key|secret|password|passwd|token|auth)["']?\s*[:=]\s*["'])[^"'\s]{8,}(?=["'])/gi,
];

export function redactSecrets(text: string): { text: string; count: number } {
  let count = 0;
  let out = text;
  for (const re of PATTERNS) {
    out = out.replace(re, () => {
      count++;
      return "[REDACTED]";
    });
  }
  return { text: out, count };
}
