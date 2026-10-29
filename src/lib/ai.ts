// Multi-provider AI Gateway supporting Google Gemini, Groq, xAI (Grok), and Anthropic.
// Automatically splits workloads across providers to maximize free quotas and provides automatic failover.

export type AiTask = "summary" | "chat" | "report" | "public_chat";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AiRequestOptions = {
  task: AiTask;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
};

export type ProviderName = "gemini" | "groq" | "grok" | "anthropic";

export function isAiConfigured(): boolean {
  return Boolean(
    process.env.GEMINI_API_KEY ||
      process.env.GROQ_API_KEY ||
      process.env.GROK_API_KEY ||
      process.env.XAI_API_KEY ||
      process.env.ANTHROPIC_API_KEY
  );
}

// Determine configured providers
export function getConfiguredProviders(): ProviderName[] {
  const providers: ProviderName[] = [];
  if (process.env.GEMINI_API_KEY) providers.push("gemini");
  if (process.env.GROQ_API_KEY) providers.push("groq");
  if (process.env.GROK_API_KEY || process.env.XAI_API_KEY) providers.push("grok");
  if (process.env.ANTHROPIC_API_KEY) providers.push("anthropic");
  return providers;
}

// Workload distribution:
// - Codebase summaries & reports: Gemini primary (1,500 daily requests, huge context, highly grounded)
// - Interactive candidate chat & public chat widget: Groq primary (ultra-low latency, blazing fast responses)
function getPriorityOrderForTask(task: AiTask): ProviderName[] {
  const configured = getConfiguredProviders();
  if (configured.length === 0) return [];

  let preferred: ProviderName[];
  switch (task) {
    case "summary":
    case "report":
      // Prefer Gemini for deep analysis, summaries and strictly grounded reports
      preferred = ["groq", "gemini", "grok", "anthropic"];
      break;
    case "chat":
    case "public_chat":
      // Prefer Groq for ultra-fast conversational latency
      preferred = ["groq", "gemini", "grok", "anthropic"];
      break;
  }

  // Filter by available keys while preserving optimal priority order
  return preferred.filter((p) => configured.includes(p));
}

async function callOpenAiCompatible(
  endpoint: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  maxTokens: number,
  temperature: number
): Promise<string | null> {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      signal: AbortSignal.timeout(5000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.warn(`[AI Gateway] ${model} at ${endpoint} failed (${res.status}): ${err.slice(0, 150)}`);
      return null;
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    return typeof text === "string" ? text.trim() : null;
  } catch (err) {
    console.warn(`[AI Gateway] Network error calling ${endpoint}:`, err);
    return null;
  }
}

async function callAnthropic(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  maxTokens: number
): Promise<string | null> {
  try {
    const system = messages.find((m) => m.role === "system")?.content;
    const chatMsgs = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content }));

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: AbortSignal.timeout(5000),
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system,
        messages: chatMsgs,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const text = data.content?.[0]?.text;
    return typeof text === "string" ? text.trim() : null;
  } catch {
    return null;
  }
}

// Execute AI call with automatic multi-provider failover
export async function callAi(options: AiRequestOptions): Promise<{ text: string | null; providerUsed?: ProviderName }> {
  const priority = getPriorityOrderForTask(options.task);
  if (priority.length === 0) {
    return { text: null };
  }

  const maxTokens = options.maxTokens ?? 700;
  const temperature = options.temperature ?? 0.2;

  for (const provider of priority) {
    let result: string | null = null;

    if (provider === "gemini" && process.env.GEMINI_API_KEY) {
      const model =
        options.task === "report"
          ? process.env.GEMINI_REPORT_MODEL || "gemini-2.5-pro"
          : process.env.GEMINI_MODEL || "gemini-3.8-flash";

      const geminiModels = [model, "gemini-2.5-flash", "gemini-2.0-flash"].filter(
        (v, i, a) => a.indexOf(v) === i
      );
      for (const m of geminiModels) {
        result = await callOpenAiCompatible(
          "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
          process.env.GEMINI_API_KEY,
          m,
          options.messages,
          maxTokens,
          temperature
        );
        if (result) break;
      }
    } else if (provider === "groq" && process.env.GROQ_API_KEY) {
      const model =
        options.task === "public_chat"
          ? process.env.GROQ_FAST_MODEL || "openai/gpt-oss-20b"
          : process.env.GROQ_MODEL || "qwen/qwen3.8-27b";

      const groqModels = [...new Set([model, "qwen/qwen3.8-27b", "openai/gpt-oss-20b", "openai/gpt-oss-120b"])].filter(Boolean);
      for (const m of groqModels) {
        result = await callOpenAiCompatible(
          "https://api.groq.com/openai/v1/chat/completions",
          process.env.GROQ_API_KEY,
          m,
          options.messages,
          maxTokens,
          temperature
        );
        if (result) break;
      }
    } else if (provider === "grok") {
      const key = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
      if (key) {
        const model = process.env.GROK_MODEL || "grok-2";
        result = await callOpenAiCompatible(
          "https://api.x.ai/v1/chat/completions",
          key,
          model,
          options.messages,
          maxTokens,
          temperature
        );
      }
    } else if (provider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
      const model =
        options.task === "report"
          ? process.env.REPORT_MODEL || "claude-sonnet-5-5"
          : process.env.SUMMARY_MODEL || "claude-haiku-5-5";

      result = await callAnthropic(process.env.ANTHROPIC_API_KEY, model, options.messages, maxTokens);
    }

    if (result) {
      return { text: result, providerUsed: provider };
    }
  }

  return { text: null };
}
