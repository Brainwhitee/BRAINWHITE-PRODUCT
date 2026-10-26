import ignore from "ignore";

export const IGNORED_DIRS = new Set([
  "node_modules", "vendor", "dist", "build", "out", ".next", ".git", "target", "bin", "obj",
  "__pycache__", ".venv", "venv", "coverage", ".idea", ".vscode", "site-packages",
]);
const BINARY_EXT = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "ico", "svg", "pdf", "zip", "gz", "tar", "jar", "class", "exe", "dll",
  "so", "dylib", "woff", "woff2", "ttf", "eot", "mp3", "mp4", "mov", "wasm", "pyc", "bin", "lock", "map",
]);
const LOCK_FILES = new Set(["package-lock.json", "yarn.lock", "pnpm-lock.yaml", "poetry.lock", "Cargo.lock", "go.sum"]);
const MAX_FILE_BYTES = 300_000;

const LANG_BY_EXT: Record<string, string> = {
  js: "javascript", jsx: "javascript", mjs: "javascript", cjs: "javascript",
  ts: "typescript", tsx: "tsx", py: "python", java: "java", go: "go", rb: "ruby", rs: "rust",
  cs: "csharp", php: "php", kt: "kotlin", swift: "swift", c: "c", h: "c", cpp: "cpp",
  md: "markdown", json: "json", yml: "yaml", yaml: "yaml", sql: "sql", sh: "shell",
  css: "css", scss: "css", html: "html", prisma: "prisma", toml: "toml",
};

export const extOf = (p: string) => (p.includes(".") ? p.split(".").pop()!.toLowerCase() : "");
export const languageOf = (p: string) => LANG_BY_EXT[extOf(p)] ?? "text";

export function makeFilter(gitignore: string, customIgnore: string) {
  const ig = ignore().add(gitignore).add(customIgnore);
  return function skipReason(path: string, size: number): string | null {
    const parts = path.split("/");
    const name = parts[parts.length - 1];
    if (parts.slice(0, -1).some((d) => IGNORED_DIRS.has(d))) return "ignored-dir";
    if (BINARY_EXT.has(extOf(name))) return "binary";
    if (LOCK_FILES.has(name)) return "lockfile";
    if (/\.min\.(js|css)$/.test(name)) return "minified";
    if (size > MAX_FILE_BYTES) return "too-large";
    if (ig.ignores(path)) return "gitignored";
    return null;
  };
}
