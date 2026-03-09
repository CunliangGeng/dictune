import { DEFAULT_TOPICS, LANGUAGES } from "./config";
import type { ApiServerConfig, DifficultyLevel, LangCode } from "./types";

// ─── API Server (OpenAI-compatible) ─────────────────────────

function assertSecureForApiKey(baseURL: string, apiKey: string): void {
  if (!apiKey) return;
  try {
    const url = new URL(baseURL);
    if (url.protocol === "https:") return;
    const h = url.hostname;
    if (
      h === "localhost" ||
      h === "127.0.0.1" ||
      h === "::1" ||
      h === "[::1]" ||
      h === "host.docker.internal"
    )
      return;
    throw new Error(
      "Refusing to send API key over unencrypted HTTP. Use HTTPS or remove the API key.",
    );
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Refusing")) throw e;
  }
}

export async function generateWithLocal(
  prompt: string,
  config: ApiServerConfig,
): Promise<string> {
  assertSecureForApiKey(config.baseURL, config.apiKey);
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
  if (!res.ok) {
    if (res.status === 400) {
      throw new Error(
        `Model "${config.model}" does not support text generation. Try a different model (e.g. llama, qwen, gemma).`,
      );
    }
    throw new Error(`API Server error: ${res.status}`);
  }
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
  assertSecureForApiKey(config.baseURL, config.apiKey);
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
  return (d.data || [])
    .map((m: { id?: string }) => m.id)
    .filter((id: unknown): id is string => typeof id === "string");
}
