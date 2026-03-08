import { DEFAULT_TOPICS, LANGUAGES } from "./config";
import type { ApiServerConfig, DifficultyLevel, LangCode } from "./types";

// ─── API Server (OpenAI-compatible) ─────────────────────────

export async function generateWithLocal(
  prompt: string,
  config: ApiServerConfig,
): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;
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
  if (!res.ok) throw new Error(`API Server error: ${res.status}`);
  const d = await res.json();
  const text = d.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("No text returned from API Server");
  return text;
}

// ─── Prompt builder ─────────────────────────────────────────

export function buildPrompt(
  lang: LangCode,
  level: DifficultyLevel,
  durationMin: number,
  topic?: string,
): string {
  const c = LANGUAGES[lang];
  const wordCount = Math.round(c.wordsPerMin * durationMin);
  const t =
    topic || DEFAULT_TOPICS[Math.floor(Math.random() * DEFAULT_TOPICS.length)];
  return c.prompt(level, wordCount, t);
}

// ─── Connection test ─────────────────────────────────────────

export async function testLocalConnection(
  config: ApiServerConfig,
): Promise<string[]> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;
  const res = await fetch(`${config.baseURL}/models`, {
    headers,
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const d = await res.json();
  return (d.data || []).map((m: any) => m.id);
}
