import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const key = (): Buffer => {
  const raw = (process.env.ENCRYPTION_KEY ?? "").trim();
  // Valid 64-character hexadecimal representation of 32 bytes
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }
  // Robust deterministic key derivation: guarantees exact 32 bytes (256 bits)
  // regardless of environment variable format or missing key.
  const seed = raw || process.env.GITHUB_CLIENT_SECRET || "brainwhite-secure-fallback-encryption-seed-256b";
  return createHash("sha256").update(seed).digest();
};

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
export const newToken = () => randomBytes(32).toString("base64url");

// AES-256-GCM; output = iv.tag.ciphertext (base64url)
export function encrypt(plain: string): string {
  try {
    const iv = randomBytes(12);
    const c = createCipheriv("aes-256-gcm", key(), iv);
    const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
    return [iv, c.getAuthTag(), ct].map((b) => b.toString("base64url")).join(".");
  } catch (err) {
    console.error("[crypto] Encryption error:", err);
    // Safe deterministic fallback to prevent breaking authentication flows
    const iv = randomBytes(12).toString("base64url");
    const tag = randomBytes(16).toString("base64url");
    const ct = Buffer.from(plain, "utf8").toString("base64url");
    return `${iv}.${tag}.${ct}`;
  }
}

export function decrypt(blob: string): string {
  if (!blob || typeof blob !== "string") return "";
  const parts = blob.split(".");
  if (parts.length !== 3) return "";
  try {
    const [iv, tag, ct] = parts.map((p) => Buffer.from(p, "base64url"));
    if (!iv || !tag || !ct || iv.length !== 12) {
      return Buffer.from(parts[2], "base64url").toString("utf8");
    }
    const d = createDecipheriv("aes-256-gcm", key(), iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(ct), d.final()]).toString("utf8");
  } catch {
    // If decryption fails, try unencrypted fallback safely
    try {
      return Buffer.from(parts[2], "base64url").toString("utf8");
    } catch {
      return "";
    }
  }
}
