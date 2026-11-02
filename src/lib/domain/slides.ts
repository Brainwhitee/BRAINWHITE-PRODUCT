// Slides module: generates slide decks from content using AI with robust heuristic fallback
// Supports Mermaid diagrams, code slides, and content slides

import { callAi, type ChatMessage } from "@/lib/ai";
import { db } from "@/lib/db";

export type SlideType = "title" | "content" | "diagram" | "code" | "quote" | "two-column";

export type Slide = {
  id: string;
  type: SlideType;
  title: string;
  content: string;
  speakerNotes?: string;
  diagramCode?: string; // Mermaid syntax
  codeSnippet?: string;
  codeLanguage?: string;
  order: number;
};

export type SlideDeck = {
  id: string;
  title: string;
  description: string;
  slides: Slide[];
  createdAt: Date;
  updatedAt: Date;
  orgId: string;
  userId: string;
};

export type GenerateSlidesInput = {
  topic: string;
  audience: "engineers" | "managers" | "executives" | "mixed";
  slideCount?: number;
  includeDiagrams?: boolean;
  includeCode?: boolean;
  orgId: string;
  userId: string;
};

const SYSTEM_PROMPT = `You are an expert presentation designer. Create a professional slide deck based on the topic provided.
Return a JSON object with the following structure:
{
  "title": "Presentation Title",
  "description": "Brief description of the presentation",
  "slides": [
    {
      "type": "title",
      "title": "Main title",
      "content": "Subtitle or presenter name",
      "order": 1
    },
    {
      "type": "content",
      "title": "Section title",
      "content": "Bullet points or content separated by newlines",
      "speakerNotes": "Notes for the presenter",
      "order": 2
    },
    {
      "type": "diagram",
      "title": "Diagram title",
      "content": "Description of what the diagram shows",
      "diagramCode": "graph TD; A-->B; B-->C;",
      "order": 3
    },
    {
      "type": "code",
      "title": "Code example",
      "content": "Description of the code",
      "codeSnippet": "const x = 1;",
      "codeLanguage": "typescript",
      "order": 4
    }
  ]
}

Rules:
- Title slide must be first
- Include a mix of content, diagram, and code slides
- For diagram type, include valid Mermaid.js syntax in diagramCode
- For code type, include codeSnippet and codeLanguage
- Each slide needs a unique order number starting from 1
- Be concise but informative
- Output ONLY valid JSON, no markdown fences, no extra text`;

function generateHeuristicDeck(input: GenerateSlidesInput): SlideDeck {
  const topic = input.topic.trim();
  const audience = input.audience;
  const now = Date.now();

  const slides: Slide[] = [
    {
      id: `slide_${now}_1`,
      type: "title",
      title: topic,
      content: `Architectural Blueprint & Engineering Deep Dive · Prepared for ${audience.toUpperCase()}`,
      order: 1,
      speakerNotes: `Welcome everyone. In this presentation, we walk through ${topic}, covering system architecture, key invariants, and execution strategy.`,
    },
    {
      id: `slide_${now}_2`,
      type: "content",
      title: "Core Objectives & System Requirements",
      content: `• High-throughput, resilient execution across distributed runtimes\n• Deterministic telemetry, audit trails, and strict type safety\n• Scalable architecture designed for rapid onboarding and low cognitive load\n• Clear separation between ingress gateways, workers, and persistent stores`,
      order: 2,
      speakerNotes: `This slide anchors the presentation in core business goals and engineering constraints.`,
    },
    {
      id: `slide_${now}_3`,
      type: "diagram",
      title: "End-to-End Architecture Flow",
      content: "Component interaction topology and data pipeline",
      diagramCode: `graph TD
    Client["Client / Web UI"] --> Gateway["API Gateway & Auth Layer"]
    Gateway --> Engine["Core Domain Service"]
    Engine --> Cache["In-Memory Cache"]
    Engine --> DB[("PostgreSQL Storage")]
    Gateway --> Worker["Background Task Worker"]
    Worker --> Queue["Event Stream / Queue"]
    Worker --> DB`,
      order: 3,
      speakerNotes: `Walk through the request lifecycle from edge client through gateway, asynchronous workers, and persistence layers.`,
    },
    {
      id: `slide_${now}_4`,
      type: "code",
      title: "Production Implementation Pattern",
      content: `Type-safe, defensive execution pipeline for ${topic}`,
      codeLanguage: "typescript",
      codeSnippet: `export interface ExecutionContext {\n  readonly traceId: string;\n  readonly tenantId: string;\n  readonly timeoutMs: number;\n}\n\nexport async function runPipeline<T>(input: T, ctx: ExecutionContext): Promise<Result<T>> {\n  const session = await createAuthenticatedSession(ctx);\n  try {\n    return await session.executeWithTelemetry(input);\n  } finally {\n    await session.cleanup();\n  }\n}`,
      order: 4,
      speakerNotes: `Highlight the strict typing, defensive resource cleanup, and observability telemetry embedded in this pattern.`,
    },
    {
      id: `slide_${now}_5`,
      type: "two-column",
      title: "Engineering Trade-offs & Best Practices",
      content: `Recommended Practices\n• Strict schema validation at runtime boundaries\n• Deterministic idempotency keys for distributed tasks\n• Graceful degradation on upstream rate limits||Common Pitfalls\n• Fire-and-forget background jobs in ephemeral lambdas\n• Unbounded memory consumption in batch processing\n• Incomplete multi-tenant scoping on database queries`,
      order: 5,
      speakerNotes: `Discuss the key architectural trade-offs made during development and pitfalls the team must avoid.`,
    },
    {
      id: `slide_${now}_6`,
      type: "quote",
      title: "Core Engineering Principle",
      content: `Simplicity is prerequisite for reliability. Complex architectures fail in complex, unobservable ways.`,
      order: 6,
      speakerNotes: `A guiding reminder for team discipline during code reviews and design iterations.`,
    },
    {
      id: `slide_${now}_7`,
      type: "content",
      title: "Implementation Roadmap & Next Milestones",
      content: `1. Finalize interface contracts and unit test coverage\n2. Run automated load and chaos engineering benchmarks\n3. Establish p99 latency alerts and error budgets\n4. Execute phased production rollout and team walkthrough`,
      order: 7,
      speakerNotes: `Wrap up the presentation by reviewing the clear next steps and ownership assignments.`,
    },
  ];

  return {
    id: `deck_${now}`,
    title: topic,
    description: `A comprehensive overview of ${topic} customized for ${audience}.`,
    slides,
    createdAt: new Date(),
    updatedAt: new Date(),
    orgId: input.orgId,
    userId: input.userId,
  };
}

export async function generateSlides(input: GenerateSlidesInput): Promise<SlideDeck> {
  let deck: SlideDeck | null = null;

  try {
    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          topic: input.topic,
          audience: input.audience,
          slideCount: input.slideCount ?? 7,
          includeDiagrams: input.includeDiagrams ?? true,
          includeCode: input.includeCode ?? true,
        }),
      },
    ];

    const result = await callAi({
      task: "summary",
      messages,
      maxTokens: 3500,
      temperature: 0.3,
      timeoutMs: 35000,
    });

    if (result.text) {
      let parsed: any;
      try {
        parsed = JSON.parse(result.text);
      } catch {
        const match = result.text.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
      }

      if (parsed && Array.isArray(parsed.slides) && parsed.slides.length > 0) {
        const now = Date.now();
        deck = {
          id: `deck_${now}`,
          title: parsed.title || input.topic,
          description: parsed.description || `A presentation about ${input.topic}`,
          slides: parsed.slides.map((s: any, i: number) => ({
            id: `slide_${now}_${i}`,
            type: s.type || "content",
            title: s.title || `Slide ${i + 1}`,
            content: s.content || "",
            speakerNotes: s.speakerNotes,
            diagramCode: s.diagramCode,
            codeSnippet: s.codeSnippet,
            codeLanguage: s.codeLanguage,
            order: s.order ?? i + 1,
          })),
          createdAt: new Date(),
          updatedAt: new Date(),
          orgId: input.orgId,
          userId: input.userId,
        };
      }
    }
  } catch (err) {
    console.warn("[generateSlides] AI generation failed, falling back to heuristic slides:", err);
  }

  // Graceful fallback: guarantees user never gets blocked by missing API keys or provider timeouts
  if (!deck) {
    deck = generateHeuristicDeck(input);
  }

  // Persist to database
  await (db as any).slideDeck.create({
    data: {
      id: deck.id,
      title: deck.title,
      description: deck.description,
      orgId: deck.orgId,
      userId: deck.userId,
      slides: JSON.stringify(deck.slides),
    },
  });

  return deck;
}

export async function getSlideDecks(orgId: string): Promise<SlideDeck[]> {
  const decks = await (db as any).slideDeck.findMany({
    where: { orgId },
    orderBy: { updatedAt: "desc" },
  });
  return decks.map((d: any) => ({
    id: d.id,
    title: d.title,
    description: d.description,
    slides: JSON.parse(d.slides ?? "[]"),
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    orgId: d.orgId,
    userId: d.userId,
  }));
}

export async function getSlideDeck(id: string, orgId?: string): Promise<SlideDeck | null> {
  const where: any = { id };
  if (orgId) where.orgId = orgId;
  const d = await (db as any).slideDeck.findFirst({ where });
  if (!d) return null;
  return {
    id: d.id,
    title: d.title,
    description: d.description,
    slides: JSON.parse(d.slides ?? "[]"),
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    orgId: d.orgId,
    userId: d.userId,
  };
}

export async function updateSlideDeck(id: string, orgId: string, updates: Partial<SlideDeck>): Promise<void> {
  const data: any = {};
  if (updates.title) data.title = updates.title;
  if (updates.description) data.description = updates.description;
  if (updates.slides) data.slides = JSON.stringify(updates.slides);
  data.updatedAt = new Date();

  await (db as any).slideDeck.updateMany({ where: { id, orgId }, data });
}

export async function deleteSlideDeck(id: string, orgId: string): Promise<void> {
  await (db as any).slideDeck.deleteMany({ where: { id, orgId } });
}
