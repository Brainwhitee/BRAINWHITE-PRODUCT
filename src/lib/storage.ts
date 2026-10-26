import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// Local-disk storage for the MVP (PLT-09). Files are never served directly: the API route checks auth first.
// Swap these two functions for S3/R2 signed URLs later.
const ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), "storage");

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
export const ALLOWED_EXT = new Set(["pdf", "docx", "pptx", "png", "jpg", "jpeg", "txt", "md"]);

export async function saveFile(orgId: string, bytes: Buffer): Promise<string> {
  const key = `${orgId}/${randomUUID()}`;
  await fs.mkdir(path.join(ROOT, orgId), { recursive: true });
  await fs.writeFile(path.join(ROOT, key), bytes);
  return key;
}

export async function readFile(key: string): Promise<Buffer> {
  const full = path.resolve(ROOT, key);
  if (!full.startsWith(ROOT)) throw new Error("bad key");
  return fs.readFile(full);
}
