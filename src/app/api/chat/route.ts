import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { retrieve } from "@/lib/domain/retrieve";
import { callAi, isAiConfigured, type ChatMessage } from "@/lib/ai";
import { enforceShape, fallbackAnswer, systemPrompt } from "@/lib/domain/chat-prompt";

async function askAi(question: string, level: string, context: string, history: { role: string; content: string }[]) {
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt(level) },
    ...history.slice(-6).map((h) => ({
      role: (h.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
      content: h.content,
    })),
    { role: "user", content: `Context:\n${context}\n\nQuestion: ${question}` },
  ];

  const { text } = await callAi({
    task: "chat",
    messages,
    maxTokens: 750,
    temperature: 0.2,
  });

  return text;
}

export async function POST(req: NextRequest) {
  const me = await getUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();

  if (body.action === "feedback") {
    await db.chatMessage.updateMany({ where: { id: String(body.id), userId: me.id }, data: { feedback: body.value === 1 ? 1 : -1 } });
    return NextResponse.json({ ok: true });
  }

  const question = String(body.question ?? "").slice(0, 2000).trim();
  const item = await db.pathItem.findFirst({ where: { id: String(body.itemId), section: { path: { orgId: me.orgId } } } });
  if (!question || !item) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const selection = body.selection ? `\nSelected code (${body.selection.path}:${body.selection.start}-${body.selection.end}):\n${String(body.selection.text).slice(0, 1500)}` : "";

  const snippets = await retrieve(me.orgId, question + " " + (body.selection?.text ?? "").slice(0, 200), { currentChunkId: item.refId });
  await db.chatMessage.create({ data: { userId: me.id, itemId: item.id, role: "user", content: question } });

  const context = snippets.map((s) => `[${s.n}] ${s.path}:${s.start}-${s.end} (${s.title})\n${s.text}`).join("\n\n") + selection;
  const history = (await db.chatMessage.findMany({ where: { userId: me.id, itemId: item.id }, orderBy: { ts: "desc" }, take: 8 }))
    .reverse().slice(0, -1).map((m) => ({ role: m.role, content: m.content }));

  let answer: string | null = null;
  if (isAiConfigured() && snippets.length) {
    try { answer = await askAi(question, me.experienceLevel, context, history); } catch { answer = null; }
    if (answer) answer = enforceShape(answer, snippets, me.experienceLevel);
  }
  if (!answer) answer = fallbackAnswer(snippets, isAiConfigured(), me.experienceLevel);

  const citations = snippets.map((s) => ({ n: s.n, kind: s.kind, repoId: s.repoId, path: s.path, start: s.start, end: s.end, title: s.title }));
  const msg = await db.chatMessage.create({
    data: { userId: me.id, itemId: item.id, role: "assistant", content: answer, citations: JSON.stringify(citations) },
  });
  return NextResponse.json({ id: msg.id, answer, citations });
}
