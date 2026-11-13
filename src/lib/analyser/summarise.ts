import { callAi, isAiConfigured } from "../ai";

export type LlmStats = { calls: number; budget: number; failures: number };
export const newStats = (): LlmStats => ({
  calls: 0,
  budget: Number(process.env.MAX_LLM_SUMMARIES ?? 15),
  failures: 0,
});

export const llmEnabled = () => isAiConfigured();

async function callLlm(
  prompt: string,
  stats: LlmStats,
): Promise<string | null> {
  if (!llmEnabled() || stats.failures >= 2 || stats.calls >= stats.budget)
    return null;
  stats.calls++;
  try {
    const { text } = await callAi({
      task: "summary",
      messages: [
        {
          role: "system",
          content:
            "You are a principal engineer writing codebase onboarding documentation. Explain the architectural purpose, core mechanics, and key problems solved in 2-3 precise, technical sentences. No markdown, no preamble.",
        },
        { role: "user", content: prompt },
      ],
      maxTokens: 250,
      temperature: 0.2,
      timeoutMs: 12000,
    });
    if (!text) {
      stats.failures++;
      return null;
    }
    return text.trim();
  } catch {
    stats.failures++;
    return null;
  }
}

export async function summariseChunk(
  p: { title: string; filePath: string; code: string; heuristic: string },
  stats: LlmStats,
): Promise<{ text: string; llm: boolean }> {
  // Use fast, deep conceptual heuristic first; selectively call LLM for high-value chunks
  if (!llmEnabled() || stats.calls >= stats.budget) {
    return { text: p.heuristic, llm: false };
  }
  const out = await callLlm(
    `File: ${p.filePath}\nSection: ${p.title}\n\n${p.code.slice(0, 3000)}`,
    stats,
  );
  return out ? { text: out, llm: true } : { text: p.heuristic, llm: false };
}

export async function summariseRollup(
  p: {
    kind: "file" | "module" | "repo" | "project";
    name: string;
    parts: string[];
    heuristic: string;
  },
  stats: LlmStats,
): Promise<string> {
  if (!llmEnabled()) return p.heuristic;
  const out = await callLlm(
    `Synthesize a high-level architectural overview for ${p.kind} "${p.name}" based on its core components:\n- ${p.parts.slice(0, 15).join("\n- ")}`,
    stats,
  );
  return out ?? p.heuristic;
}

// Domain inference: identifies the subsystem and architectural responsibility
function inferDomain(filePath: string, title: string): string {
  const p = filePath.toLowerCase();
  const t = title.toLowerCase();

  if (p.includes("auth") || p.includes("session") || p.includes("token") || p.includes("login") || p.includes("jwt") || t.includes("auth")) {
    return "Authentication & Security Perimeter";
  }
  if (p.includes("vscode") || p.includes("extension") || p.includes("client") || t.includes("activate") || t.includes("command")) {
    return "Editor Integration & Developer Tooling";
  }
  if (p.includes("api") || p.includes("route") || p.includes("router") || p.includes("endpoint") || p.includes("controller")) {
    return "API Gateway & Request Ingress";
  }
  if (p.includes("db") || p.includes("prisma") || p.includes("model") || p.includes("schema") || p.includes("migration") || p.includes("repo")) {
    return "Data Persistence & State Management";
  }
  if (p.includes("sdk") || p.includes("client") || p.includes("transport")) {
    return "Public SDK & Client Bindings";
  }
  if (p.includes("integration") || p.includes("webhook") || p.includes("github") || p.includes("adapter")) {
    return "Ecosystem Integrations & Webhooks";
  }
  if (p.includes("shared") || p.includes("types") || p.includes("utils") || p.includes("common") || p.includes("lib")) {
    return "Shared Primitives & Domain Contracts";
  }
  if (p.includes("worker") || p.includes("pipeline") || p.includes("analyser") || p.includes("job") || p.includes("queue")) {
    return "Core Execution & Background Pipeline";
  }
  if (p.includes("ui") || p.includes("components") || p.includes("pages") || p.includes("app/web") || p.includes("view")) {
    return "Frontend Interface & Application Workflows";
  }
  if (p.includes("doc") || p.includes("rfc") || p.includes("guide")) {
    return "Architecture Specifications & Documentation";
  }
  return "System Infrastructure & Tooling";
}

// Concept inference: analyzes what real engineering problem is solved
function inferConcept(
  filePath: string,
  title: string,
  symbols: { name: string; kind: string; signature?: string }[] = [],
  codeSnippet: string = ""
): string {
  const p = filePath.toLowerCase();
  const t = title.toLowerCase();
  const names = symbols.map((s) => s.name.toLowerCase()).join(" ");

  if (p.includes("vscode") || p.includes("extension")) {
    return "Bridges editor events with the core language server, handling extension lifecycle, context keys, and interactive UI views";
  }
  if (names.includes("session") || names.includes("oauth") || names.includes("token") || t.includes("login")) {
    return "Enforces cryptographic session cookies, OAuth redirect token exchanges, and tenant access boundaries";
  }
  if (names.includes("webhook") || p.includes("webhook") || names.includes("signature")) {
    return "Validates external webhook HMAC signatures, parses payload events, and triggers corresponding background synchronization";
  }
  if (names.includes("parse") || names.includes("ast") || names.includes("syntax") || names.includes("tree")) {
    return "Performs concrete syntax tree traversal and symbol extraction, resolving definitions across language boundaries";
  }
  if (names.includes("schema") || names.includes("validate") || codeSnippet.includes("zod") || codeSnippet.includes("z.object")) {
    return "Enforces strict runtime type validation, eliminating malformed payloads before domain processing";
  }
  if (p.includes("pipeline") || names.includes("sync") || names.includes("ingest") || names.includes("worker")) {
    return "Orchestrates batch codebase indexing, secret redaction, and dependency graph edge discovery with retry resilience";
  }
  if (p.includes("sdk") || names.includes("client") || names.includes("request")) {
    return "Exposes high-level typed SDK client methods with automatic header injection and response normalization";
  }
  if (p.includes("shared") || p.includes("types") || symbols.some((s) => s.kind === "interface")) {
    return "Standardizes cross-package type definitions and invariant contracts shared between frontend and backend services";
  }
  if (codeSnippet.includes("export function") || codeSnippet.includes("export const")) {
    return `Implements reusable logic for ${title}, abstracting operational complexity for consumer modules`;
  }
  return `Encapsulates core business rules and data transformations for ${title}`;
}

// Deep, conceptual summary generator for individual learning chunks
export function heuristicChunk(
  filePath: string,
  title: string,
  doc: string,
  kinds: string[],
  lines: number,
  lang: string,
  symbols: { name: string; kind: string; signature?: string }[] = [],
  codeSnippet: string = ""
): string {
  const domain = inferDomain(filePath, title);
  const concept = inferConcept(filePath, title, symbols, codeSnippet);

  // Extract clean docstring if available
  const cleanDoc = doc
    ? doc
        .split("\n")
        .map((l) => l.replace(/^[\s\/*#]+/, "").trim())
        .filter(Boolean)[0]
    : null;

  const docText = cleanDoc && cleanDoc.length > 10 ? ` ${cleanDoc.slice(0, 150)}.` : "";
  const exportNames = symbols.slice(0, 3).map((s) => s.name);
  const exportsDetail = exportNames.length > 0 ? ` Defines ${exportNames.join(", ")}.` : "";

  return `[${domain}] ${concept}.${docText}${exportsDetail} (${lines} lines of ${lang} in ${filePath})`;
}

// Synthesizes architectural profile for a module
export function buildConceptualModuleSummary(
  modName: string,
  modPath: string,
  fileCount: number,
  topFiles: string
): string {
  const domain = inferDomain(modPath, modName);
  let responsibility = "";

  if (modPath.includes("vscode-extension")) {
    responsibility = "VS Code client integration: registers command handlers, language client proxies, and status bar telemetry.";
  } else if (modPath.includes("web") || modPath.includes("apps/web")) {
    responsibility = "Next.js web application: drives executive dashboards, candidate onboarding portals, and real-time visualization.";
  } else if (modPath.includes("sdk")) {
    responsibility = "TypeScript Client SDK: exposes public API contracts, typed HTTP clients, and authentication wrappers.";
  } else if (modPath.includes("shared")) {
    responsibility = "Universal shared layer: centralizes cross-package type contracts, validation utilities, and shared domain constants.";
  } else if (modPath.includes("integrations")) {
    responsibility = "External ecosystem adapters: handles bidirectional synchronization with third-party systems and GitHub Apps.";
  } else if (modPath.includes("docs")) {
    responsibility = "Architecture documentation: developer guides, system RFCs, and API specifications.";
  } else if (modPath === "." || modPath === "Root") {
    responsibility = "Monorepo root: orchestrates workspace packages, build pipelines, dependencies, and environment configuration.";
  } else {
    responsibility = `Subsystem responsible for ${domain.toLowerCase()} across ${fileCount} files.`;
  }

  const fileDetail = topFiles ? ` Key files: ${topFiles}.` : "";
  return `${modName} (${domain}) — ${responsibility}${fileDetail}`;
}
