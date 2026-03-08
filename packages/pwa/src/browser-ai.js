let engine = null;
let currentModelId = null;

export const BROWSER_AI_MODELS = [
  {
    id: "Qwen3-0.6B-q4f16_1-MLC",
    label: "Qwen3 0.6B (~350MB)",
    size: "~350MB",
  },
  { id: "Qwen3-1.7B-q4f16_1-MLC", label: "Qwen3 1.7B (~1GB)", size: "~1GB" },
];

export const DEFAULT_BROWSER_MODEL = BROWSER_AI_MODELS[0].id;

export function isWebGPUSupported() {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

export async function isBrowserAIModelCached(modelId) {
  if (typeof caches === "undefined") return false;
  try {
    const cache = await caches.open("webllm/model");
    const keys = await cache.keys();
    return keys.some((r) => r.url.includes(modelId));
  } catch {
    return false;
  }
}

async function getWebLLM() {
  return await import("@mlc-ai/web-llm");
}

export async function initBrowserAI(modelId, onProgress) {
  if (engine && currentModelId === modelId) return engine;

  if (engine) {
    await engine.unload();
    engine = null;
    currentModelId = null;
  }

  const { CreateMLCEngine } = await getWebLLM();
  engine = await CreateMLCEngine(modelId, {
    initProgressCallback: (progress) => {
      onProgress?.({
        progress: Math.round(progress.progress * 100),
        text: progress.text,
      });
    },
  });
  currentModelId = modelId;
  return engine;
}

export async function generateWithBrowserAI(prompt) {
  if (!engine) throw new Error("Browser AI not initialized");

  const response = await engine.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "/no_think\nYou are a text generator. Output ONLY the requested text. Never use <think> tags. Never explain your reasoning.",
      },
      { role: "user", content: prompt },
    ],
    max_tokens: 1000,
    temperature: 0.7,
  });

  let text = response.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("No text returned from Browser AI");
  // Qwen3 outputs <think>...</think> reasoning tags — strip them
  text = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  return text;
}

export async function unloadBrowserAI() {
  if (engine) {
    await engine.unload();
    engine = null;
    currentModelId = null;
  }
}

export async function deleteCachedModel(modelId) {
  if (typeof caches === "undefined") return;
  try {
    const cache = await caches.open("webllm/model");
    const keys = await cache.keys();
    for (const req of keys) {
      if (req.url.includes(modelId)) {
        await cache.delete(req);
      }
    }
  } catch {
    // ignore
  }
}
