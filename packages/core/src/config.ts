import type {
  AIConfig,
  AIPreset,
  CEFRLevel,
  DurationOption,
  LangCode,
  LanguageConfig,
  UIStrings,
} from "./types";

// ─── Languages ───────────────────────────────────────────────

export const LANGUAGES: Record<LangCode, LanguageConfig> = {
  en: {
    native: "English",
    flag: "🇬🇧",
    diffMode: "word",
    wordsPerMin: 150,
    prompt: (level, length, topic) =>
      `Generate a ${level} CEFR level English text for pronunciation practice, about ${length} words. ${topic ? `Topic: ${topic}.` : "Topic: general daily life."}

IMPORTANT: Write in a natural SPOKEN style, as if someone is talking in a conversation, giving a casual presentation, telling a story, or leaving a voice message. Use contractions (I'm, don't, we've), filler-free but natural sentence flow, everyday vocabulary, and the kind of rhythm people actually use when speaking. Avoid formal written language, literary phrasing, essay-style structures, or stiff grammar. It should sound like real speech when read aloud.

Output ONLY the text, nothing else. No title, no quotes, no stage directions.`,
  },
  nl: {
    native: "Nederlands",
    flag: "🇳🇱",
    diffMode: "word",
    wordsPerMin: 130,
    prompt: (level, length, topic) =>
      `Genereer een ${level} niveau Nederlandse tekst voor uitspraakoefening, ongeveer ${length} woorden. ${topic ? `Onderwerp: ${topic}.` : "Onderwerp: dagelijks leven."}

BELANGRIJK: Schrijf in een natuurlijke SPREEKSTIJL, alsof iemand in een gesprek zit, een informele presentatie geeft, een verhaal vertelt, of een voicemail inspreekt. Gebruik alledaagse woorden, natuurlijke zinsstructuren en het ritme dat mensen echt gebruiken als ze praten. Vermijd formeel schrijftaal, literaire formuleringen, of stijve grammatica. Het moet klinken als echt gesproken Nederlands wanneer het hardop wordt voorgelezen.

Geef ALLEEN de tekst, niets anders. Geen titel, geen aanhalingstekens, geen regie-aanwijzingen.`,
  },
  zh: {
    native: "中文",
    flag: "🇨🇳",
    diffMode: "char",
    wordsPerMin: 250,
    prompt: (level, length, topic) =>
      `生成一段${level}难度的中文文本用于发音练习，约${length}个字。${topic ? `主题：${topic}。` : "主题：日常生活。"}

重要：请用自然的口语风格写，就像一个人在聊天、做非正式分享、讲故事或发语音消息。使用日常口语词汇和自然的句式节奏，比如"其实""然后""挺好的""嘛"这类口语表达。避免书面语、文学化表达、正式公文或作文风格。读出来应该像真实的说话。

只输出文本内容，不要标题，不要引号，不要舞台指示或说明文字。`,
  },
};

export const LANG_CODES: LangCode[] = ["en", "nl", "zh"];

export const LEVELS: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const DURATIONS: DurationOption[] = [
  { label: "0.5 min", value: 0.5 },
  { label: "1 min", value: 1 },
  { label: "2 min", value: 2 },
  { label: "3 min", value: 3 },
];

// ─── AI Presets ──────────────────────────────────────────────

export const AI_PRESETS: Record<string, AIPreset> = {
  ollama: {
    name: "Ollama",
    baseURL: "http://localhost:11434/v1",
    needsKey: false,
  },
  "lm-studio": {
    name: "LM Studio",
    baseURL: "http://localhost:1234/v1",
    needsKey: false,
  },
  jan: { name: "Jan", baseURL: "http://localhost:1337/v1", needsKey: false },
  gpt4all: {
    name: "GPT4All",
    baseURL: "http://localhost:4891/v1",
    needsKey: false,
  },
  localai: {
    name: "LocalAI",
    baseURL: "http://localhost:8080/v1",
    needsKey: false,
  },
  llamacpp: {
    name: "llama.cpp server",
    baseURL: "http://localhost:8081/v1",
    needsKey: false,
  },
  vllm: { name: "vLLM", baseURL: "http://localhost:8000/v1", needsKey: false },
  custom: { name: "Custom", baseURL: "", needsKey: false },
};

export const DEFAULT_AI_CONFIG: AIConfig = {
  enabled: false,
  preset: "ollama",
  baseURL: "http://localhost:11434/v1",
  apiKey: "",
  model: "",
  status: "disconnected",
  models: [],
};

// ─── UI Strings ──────────────────────────────────────────────

export const UI_STRINGS: Record<LangCode, UIStrings> = {
  en: {
    generate: "Generate",
    generating: "Generating...",
    original: "Original Text",
    dictation: "Dictation",
    placeholder: "Start your system dictation and speak the text above...",
    compare: "Compare",
    tryAgain: "Try Again",
    generateNew: "Generate New",
    accuracy: "Accuracy",
    total: "Total",
    matched: "Correct",
    wrong: "Wrong",
    missing: "Missing",
    extra: "Extra",
    topicPlaceholder: "Topic (optional)  e.g. travel, cooking...",
    welcome: "Choose your settings and generate a practice text",
    legendWrong: "Wrong (substituted)",
    legendMissing: "Missing",
    legendExtra: "Extra",
    legendGap: "Gap placeholder",
  },
  nl: {
    generate: "Genereer",
    generating: "Genereren...",
    original: "Originele tekst",
    dictation: "Dictaat",
    placeholder: "Start systeemdicteren en spreek de bovenstaande tekst uit...",
    compare: "Vergelijk",
    tryAgain: "Opnieuw",
    generateNew: "Nieuwe genereren",
    accuracy: "Nauwkeurigheid",
    total: "Totaal",
    matched: "Correct",
    wrong: "Fout",
    missing: "Ontbreekt",
    extra: "Extra",
    topicPlaceholder: "Onderwerp (optioneel)  bijv. reizen, koken...",
    welcome: "Kies je instellingen en genereer een oefentekst",
    legendWrong: "Fout (vervangen)",
    legendMissing: "Ontbreekt",
    legendExtra: "Extra",
    legendGap: "Plaatsaanduiding",
  },
  zh: {
    generate: "生成",
    generating: "生成中...",
    original: "原文",
    dictation: "听写",
    placeholder: "开启系统听写功能，朗读上方文本...",
    compare: "对比",
    tryAgain: "再试一次",
    generateNew: "生成新的",
    accuracy: "准确率",
    total: "总数",
    matched: "正确",
    wrong: "错误",
    missing: "缺失",
    extra: "多余",
    topicPlaceholder: "主题（可选）例如：旅行、美食、科技...",
    welcome: "选择设置并生成练习文本",
    legendWrong: "错误（替换）",
    legendMissing: "缺失",
    legendExtra: "多余",
    legendGap: "占位标记",
  },
};
