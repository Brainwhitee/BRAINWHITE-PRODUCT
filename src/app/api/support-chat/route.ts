import { NextRequest, NextResponse } from "next/server";
import { callAi, isAiConfigured, type ChatMessage } from "@/lib/ai";

const SUPPORT_SYSTEM_PROMPT = `You are the BrainWhite AI assistant on the BrainWhite platform website.
You help engineers, engineering managers, CTOs, and visitors understand how BrainWhite works and how it accelerates developer onboarding.

Core Knowledge about BrainWhite:
1. What BrainWhite is:
   BrainWhite is an AI-native developer onboarding platform. It ingests an engineering organisation's codebases, parses ASTs (TypeScript, JavaScript, Python, Java) via WebAssembly Tree-sitter, builds an interactive knowledge graph of modules and dependencies, and enables engineering teams to create tailored learning paths for new hires.

2. Key Features:
   - Automated Codebase Knowledge Graph: Ingests GitHub or local repos, redacts secrets, extracts classes/functions/symbols, and generates module summaries.
   - 3-Pane Learning Workspace: Provides new hires with an IDE-like 3-pane experience (Code Viewer, Deep Explanations/Handouts, and Grounded AI Q&A with line-number citations).
   - GitHub-Linked Tasks & PR Scoring: Real-time webhook integration that monitors candidate PRs and scores them across 7 pillars (size, description, tests, CI status, review rounds, commits, merge conflicts).
   - Manager & Mentor Dashboards: Progress timelines, schedule adherence, blocker alerts, and auto-generated weekly & final onboarding evaluation reports.
   - RBAC Roles: Owner, Manager, Mentor, and Candidate.

3. Trying the Platform:
   Visitors can try the interactive demo anytime by clicking "Sign in" or visiting /login.
   Pre-seeded demo accounts (password: demo12345):
   - manager@demo.test (Manager view)
   - candidate@demo.test (Candidate learning workspace)
   - mentor@demo.test (Mentor dashboard)
   - owner@demo.test (Organisation admin)

Tone and Guidelines:
- Be concise, technical yet accessible, friendly, and helpful.
- Keep answers to 2-4 focused sentences or bullet points.
- If asked about pricing or custom enterprise deployments, mention that BrainWhite offers flexible cloud and self-hosted options and encourage them to connect via the Contact page or test the demo.
- Never output markdown headers larger than ###.
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = String(body.message ?? "").slice(0, 1500).trim();
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const history: { role: string; content: string }[] = Array.isArray(body.history)
      ? body.history.slice(-8)
      : [];

    const messages: ChatMessage[] = [
      { role: "system", content: SUPPORT_SYSTEM_PROMPT },
      ...history.map((h) => ({
        role: (h.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
        content: String(h.content).slice(0, 1000),
      })),
      { role: "user", content: message },
    ];

    if (isAiConfigured()) {
      const { text, providerUsed } = await callAi({
        task: "public_chat",
        messages,
        maxTokens: 500,
        temperature: 0.3,
      });

      if (text) {
        return NextResponse.json({ answer: text, provider: providerUsed });
      }
    }

    // Heuristic fallback if no AI key configured or rate limited
    const lower = message.toLowerCase();
    let fallback =
      "BrainWhite is an AI onboarding platform that turns your codebase into an interactive knowledge graph, generates structured learning paths, and scores GitHub PRs automatically.";

    if (lower.includes("demo") || lower.includes("try") || lower.includes("login")) {
      fallback =
        "You can explore the interactive demo immediately at /login using demo accounts (e.g. manager@demo.test or candidate@demo.test with password 'demo12345').";
    } else if (lower.includes("workspace") || lower.includes("pane") || lower.includes("learn")) {
      fallback =
        "The BrainWhite 3-pane learning workspace gives new joiners an active code viewer, deep architecture notes, and a contextual AI mentor that cites exact lines of code.";
    } else if (lower.includes("pr") || lower.includes("score") || lower.includes("github")) {
      fallback =
        "BrainWhite scores PRs objectively across 7 dimensions: diff size, description depth, tests included, CI pass rate, review rounds, commit clarity, and merge conflicts.";
    }

    return NextResponse.json({
      answer: fallback + (isAiConfigured() ? "" : "\n\n(Configure GEMINI_API_KEY or GROQ_API_KEY for conversational AI answers.)"),
      provider: "fallback",
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to process chat message" }, { status: 500 });
  }
}
