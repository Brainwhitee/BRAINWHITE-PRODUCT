import { NextRequest, NextResponse } from "next/server";
import { callAi, isAiConfigured, type ChatMessage } from "@/lib/ai";

const SUPPORT_SYSTEM_PROMPT = `You are the BrainWhite AI assistant on the BrainWhite platform website.

You are helpful, friendly, and can answer general questions as well as questions about BrainWhite.

Core Knowledge about BrainWhite:
- BrainWhite is an AI-native developer onboarding platform. It ingests an engineering organisation's codebases, parses ASTs (TypeScript, JavaScript, Python, Java) via WebAssembly Tree-sitter, builds an interactive knowledge graph of modules and dependencies, and enables engineering teams to create tailored learning paths for new hires.
- Key features: Automated Codebase Knowledge Graph, 3-Pane Learning Workspace, GitHub-Linked Tasks & PR Scoring, Manager & Mentor Dashboards, RBAC Roles (Owner, Manager, Mentor, Candidate).
- Visitors can try the demo at /login with pre-seeded accounts (manager@demo.test, candidate@demo.test, mentor@demo.test, owner@demo.test; password: demo12345).

Guidelines:
- If the user asks about BrainWhite, answer knowledgeably using the info above.
- If the user asks a general question (e.g. "who is Virat Kohali"), answer it directly and helpfully — you are not limited to BrainWhite topics.
- Keep answers concise (2-4 sentences).
- Be friendly and conversational.
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

    // Heuristic fallback if AI is not configured or all providers failed
    const lower = message.toLowerCase();
    let fallback =
      "I'm the BrainWhite AI assistant. I can help you learn about BrainWhite's developer onboarding platform, or answer general questions. What would you like to know?";

    if (lower.includes("demo") || lower.includes("try") || lower.includes("login")) {
      fallback =
        "You can explore the interactive demo immediately at /login using demo accounts (e.g. manager@demo.test or candidate@demo.test with password 'demo12345').";
    } else if (lower.includes("brainwhite") || lower.includes("onboarding") || lower.includes("workspace") || lower.includes("pane") || lower.includes("learn")) {
      fallback =
        "BrainWhite is an AI onboarding platform that turns your codebase into an interactive knowledge graph, generates structured learning paths, and scores GitHub PRs automatically.";
    } else if (lower.includes("pr") || lower.includes("score") || lower.includes("github")) {
      fallback =
        "BrainWhite scores PRs across 7 dimensions: diff size, description depth, tests included, CI pass rate, review rounds, commit clarity, and merge conflicts.";
    }

    return NextResponse.json({
      answer: fallback + (isAiConfigured() ? "" : "\n\n(Configure GEMINI_API_KEY or GROQ_API_KEY for conversational AI answers.)"),
      provider: "fallback",
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to process chat message" }, { status: 500 });
  }
}
