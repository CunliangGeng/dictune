import type { LangCode, CEFRLevel, AIConfig } from "./types";
import { LANGUAGES } from "./config";

// ─── Embedded AI (Anthropic API) ─────────────────────────────

export async function generateWithEmbedded(prompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Embedded AI error: ${res.status}`);
  const d = await res.json();
  const text = d.content?.find((x: any) => x.type === "text")?.text?.trim();
  if (!text) throw new Error("No text returned from embedded AI");
  return text;
}

// ─── Local AI (OpenAI-compatible) ────────────────────────────

export async function generateWithLocal(prompt: string, config: AIConfig): Promise<string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.apiKey) headers["Authorization"] = `Bearer ${config.apiKey}`;
  const res = await fetch(`${config.baseURL}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.7,
      stream: false,
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`Local AI error: ${res.status}`);
  const d = await res.json();
  const text = d.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("No text returned from local AI");
  return text;
}

// ─── Unified generation with fallback ────────────────────────

export function buildPrompt(lang: LangCode, level: CEFRLevel, durationMin: number, topic?: string): string {
  const c = LANGUAGES[lang];
  const wordCount = Math.round(c.wordsPerMin * durationMin);
  return c.prompt(level, wordCount, topic);
}

export async function generateText(
  lang: LangCode,
  level: CEFRLevel,
  durationMin: number,
  topic: string | undefined,
  aiConfig: AIConfig
): Promise<string> {
  const prompt = buildPrompt(lang, level, durationMin, topic);

  // Try local AI first if configured and connected
  if (aiConfig.enabled && aiConfig.status === "connected" && aiConfig.model) {
    try {
      return await generateWithLocal(prompt, aiConfig);
    } catch (e: any) {
      console.warn("Local AI failed, falling back to embedded:", e.message);
    }
  }

  return await generateWithEmbedded(prompt);
}

// ─── Connection test ─────────────────────────────────────────

export async function testLocalConnection(config: AIConfig): Promise<string[]> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.apiKey) headers["Authorization"] = `Bearer ${config.apiKey}`;
  const res = await fetch(`${config.baseURL}/models`, {
    headers,
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const d = await res.json();
  return (d.data || []).map((m: any) => m.id);
}
