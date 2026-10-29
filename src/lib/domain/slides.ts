// Slides module: generates slide decks from content using AI
// Supports Mermaid diagrams, code slides, and content slides

import { callAi, type ChatMessage, type AiTask } from "@/lib/ai";
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

export async function generateSlides(input: GenerateSlidesInput): Promise<SlideDeck> {
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
    maxTokens: 4000,
    temperature: 0.4,
  });

  if (!result.text) {
    throw new Error("Failed to generate slides. Please configure GEMINI_API_KEY or GROQ_API_KEY.");
  }

  let parsed: any;
  try {
    parsed = JSON.parse(result.text);
  } catch {
    // Try to extract JSON from the response
    const match = result.text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Invalid AI response format");
    parsed = JSON.parse(match[0]);
  }

  const deck: SlideDeck = {
    id: `deck_${Date.now()}`,
    title: parsed.title || input.topic,
    description: parsed.description || `A presentation about ${input.topic}`,
    slides: (parsed.slides || []).map((s: any, i: number) => ({
      id: `slide_${Date.now()}_${i}`,
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

  // Save to database (run `prisma generate` after merging to update Prisma client types)
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

export async function getSlideDeck(id: string): Promise<SlideDeck | null> {
  const d = await (db as any).slideDeck.findUnique({ where: { id } });
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

export async function updateSlideDeck(id: string, updates: Partial<SlideDeck>): Promise<void> {
  const data: any = {};
  if (updates.title) data.title = updates.title;
  if (updates.description) data.description = updates.description;
  if (updates.slides) data.slides = JSON.stringify(updates.slides);
  data.updatedAt = new Date();

  await (db as any).slideDeck.update({ where: { id }, data });
}

export async function deleteSlideDeck(id: string): Promise<void> {
  await (db as any).slideDeck.delete({ where: { id } });
}
