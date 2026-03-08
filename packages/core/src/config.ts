import type {
  AIPreset,
  ApiServerConfig,
  DifficultyLevel,
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
    prompt: (level, length, topic) => {
      const sentences = Math.max(3, Math.round(length / 12));
      const diff = {
        easy: "Use ONLY simple, common words (like: go, eat, big, happy, house, water). Use short sentences (5-8 words each). Use only present tense. No idioms, no phrasal verbs, no complex grammar.",
        medium:
          "Use everyday vocabulary with some less common words. Mix short and medium sentences (8-15 words). Use present, past, and future tenses. You may use common phrasal verbs and simple idioms.",
        hard: "Use rich vocabulary including advanced words, idioms, and phrasal verbs. Use complex sentences with clauses, varied tenses, and nuanced expressions. The text should challenge a fluent speaker.",
      }[level];
      return `Write exactly ${sentences} sentences in English about "${topic || "general daily life"}". The total length must be close to ${length} words. Do not write more or fewer than ${sentences} sentences.

DIFFICULTY: ${diff}

STYLE: Natural SPOKEN style — like a conversation, story, or voice message. Use contractions (I'm, don't, we've). Sound like real speech.

Output ONLY the ${sentences} sentences. Nothing else.`;
    },
  },
  nl: {
    native: "Nederlands",
    flag: "🇳🇱",
    diffMode: "word",
    wordsPerMin: 130,
    prompt: (level, length, topic) => {
      const sentences = Math.max(3, Math.round(length / 11));
      const diff = {
        easy: "Gebruik ALLEEN eenvoudige, veelvoorkomende woorden. Gebruik korte zinnen (5-8 woorden). Gebruik alleen tegenwoordige tijd. Geen spreekwoorden, geen moeilijke grammatica.",
        medium:
          "Gebruik alledaagse woordenschat met enkele minder gebruikelijke woorden. Mix korte en middellange zinnen (8-15 woorden). Gebruik tegenwoordige, verleden en toekomende tijd.",
        hard: "Gebruik rijke woordenschat met geavanceerde woorden, uitdrukkingen en spreekwoorden. Gebruik complexe zinnen met bijzinnen en gevarieerde tijden.",
      }[level];
      return `Schrijf precies ${sentences} zinnen in het Nederlands over "${topic || "dagelijks leven"}". De totale lengte moet ongeveer ${length} woorden zijn. Schrijf niet meer of minder dan ${sentences} zinnen.

MOEILIJKHEID: ${diff}

STIJL: Natuurlijke SPREEKSTIJL — als een gesprek, verhaal, of voicemail. Klink als echt gesproken Nederlands.

Geef ALLEEN de ${sentences} zinnen. Niets anders.`;
    },
  },
  zh: {
    native: "中文",
    flag: "🇨🇳",
    diffMode: "char",
    wordsPerMin: 250,
    prompt: (level, length, topic) => {
      const sentences = Math.max(3, Math.round(length / 18));
      const diff = {
        easy: "只用最简单常见的汉字和词语（如：吃、喝、大、小、开心、家）。用短句（5-10个字一句）。只用现在时。不用成语、不用复杂语法。",
        medium:
          "使用日常词汇，可以加入一些不太常见的词。句子长短混合（10-20个字）。可以使用过去和将来的表达。可以用常见的口语表达。",
        hard: "使用丰富的词汇，包括成语、俗语和高级表达。使用复杂句式、多种时态和细腻的表达方式。文本应该对流利的说话者有挑战性。",
      }[level];
      return `写正好${sentences}句中文，关于"${topic || "日常生活"}"。总长度必须接近${length}个字。不要多写或少写。

难度要求：${diff}

风格：自然口语风格——像聊天、讲故事或发语音消息。读出来像真实的说话。

只输出这${sentences}句话。不要其他任何内容。`;
    },
  },
};

export const LANG_CODES: LangCode[] = ["en", "nl", "zh"];

export const LEVELS: DifficultyLevel[] = ["easy", "medium", "hard"];

export const DURATIONS: DurationOption[] = [
  { label: "0.5 min", value: 0.5 },
  { label: "1 min", value: 1 },
  { label: "2 min", value: 2 },
  { label: "3 min", value: 3 },
];

export const DEFAULT_TOPICS = [
  "cats",
  "dogs",
  "cooking",
  "travel",
  "weather",
  "coffee",
  "weekend plans",
  "movies",
  "music",
  "childhood memories",
  "morning routines",
  "grocery shopping",
  "neighbors",
  "birthdays",
  "seasons",
];

// ─── AI Presets ──────────────────────────────────────────────

export const AI_PRESETS: Record<string, AIPreset> = {
  // Self-hosted
  ollama: {
    name: "Ollama",
    baseURL: "http://localhost:11434/v1",
    needsKey: false,
    group: "self-hosted",
  },
  "lm-studio": {
    name: "LM Studio",
    baseURL: "http://localhost:1234/v1",
    needsKey: false,
    group: "self-hosted",
  },
  jan: {
    name: "Jan",
    baseURL: "http://localhost:1337/v1",
    needsKey: false,
    group: "self-hosted",
  },
  gpt4all: {
    name: "GPT4All",
    baseURL: "http://localhost:4891/v1",
    needsKey: false,
    group: "self-hosted",
  },
  localai: {
    name: "LocalAI",
    baseURL: "http://localhost:8080/v1",
    needsKey: false,
    group: "self-hosted",
  },
  llamacpp: {
    name: "llama.cpp server",
    baseURL: "http://localhost:8081/v1",
    needsKey: false,
    group: "self-hosted",
  },
  vllm: {
    name: "vLLM",
    baseURL: "http://localhost:8000/v1",
    needsKey: false,
    group: "self-hosted",
  },
  // Cloud
  openai: {
    name: "OpenAI",
    baseURL: "https://api.openai.com/v1",
    needsKey: true,
    group: "cloud",
  },
  together: {
    name: "Together AI",
    baseURL: "https://api.together.xyz/v1",
    needsKey: true,
    group: "cloud",
  },
  groq: {
    name: "Groq",
    baseURL: "https://api.groq.com/openai/v1",
    needsKey: true,
    group: "cloud",
  },
  // Custom
  custom: {
    name: "Custom",
    baseURL: "",
    needsKey: false,
    group: "self-hosted",
  },
};

export const DEFAULT_API_SERVER_CONFIG: ApiServerConfig = {
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
