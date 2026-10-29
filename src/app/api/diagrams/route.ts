import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { callAi, type ChatMessage, type AiTask } from "@/lib/ai";

// Mermaid diagram types supported
export type DiagramType =
  | "flowchart"
  | "sequence"
  | "class"
  | "state"
  | "er"
  | "journey"
  | "gantt"
  | "pie"
  | "architecture"
  | "system";

export type GenerateDiagramInput = {
  description: string;
  type: DiagramType;
  orgId: string;
  userId: string;
};

const DIAGRAM_SYSTEM_PROMPT = `You are an expert diagram designer. Generate Mermaid.js diagram code based on the description and type provided.

Return ONLY valid JSON with this structure:
{
  "title": "Diagram Title",
  "type": "flowchart",
  "code": "graph TD; A[Start] --> B[Process]; B --> C[End]",
  "description": "Brief description of what the diagram shows"
}

Rules:
- Output ONLY valid JSON, no markdown fences, no extra text
- Use valid Mermaid.js syntax for the specified diagram type
- Keep diagrams clean and readable
- Use meaningful node labels
- For flowchart: use graph TD or graph LR
- For sequence: use sequenceDiagram
- For class: use classDiagram
- For state: use stateDiagram-v2
- For er: use erDiagram
- For journey: use journey
- For gantt: use gantt
- For pie: use pie
- For architecture: use graph TD with subgraphs
- For system: use graph TD with system boundaries

Available diagram types: flowchart, sequence, class, state, er, journey, gantt, pie, architecture, system`;

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body: GenerateDiagramInput = await req.json();

    if (!body.description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    const messages: ChatMessage[] = [
      { role: "system", content: DIAGRAM_SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          description: body.description,
          type: body.type,
        }),
      },
    ];

    const result = await callAi({
      task: "summary",
      messages,
      maxTokens: 2000,
      temperature: 0.3,
    });

    if (!result.text) {
      return NextResponse.json(
        { error: "Failed to generate diagram. Please configure GEMINI_API_KEY or GROQ_API_KEY." },
        { status: 500 }
      );
    }

    let parsed: any;
    try {
      parsed = JSON.parse(result.text);
    } catch {
      const match = result.text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Invalid AI response format");
      parsed = JSON.parse(match[0]);
    }

    const diagram = {
      id: `diagram_${Date.now()}`,
      title: parsed.title || "Diagram",
      type: body.type,
      code: parsed.code || "",
      description: parsed.description || body.description,
      orgId: user.orgId,
      userId: user.id,
      createdAt: new Date(),
    };

    return NextResponse.json({ diagram });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to generate diagram";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
