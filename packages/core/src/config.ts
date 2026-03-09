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
        easy: "Use ONLY simple, common words. Use short sentences (8-15 words each). Use only present tense. No idioms, no phrasal verbs, no complex grammar.",
        medium:
          "Use everyday vocabulary with some less common words. Mix short and medium sentences (10-20 words). Use present, past, and future tenses. You may use common phrasal verbs and simple idioms.",
        hard: "Use rich vocabulary including advanced words, idioms, and phrasal verbs. Use complex sentences with clauses, varied tenses, and nuanced expressions. The text should challenge a fluent speaker.",
      }[level];
      return `Write a coherent paragraph of exactly ${sentences} sentences in English about "${topic || "general daily life"}". The total length must be close to ${length} words. Do not write more or fewer than ${sentences} sentences.

COHERENCE: The sentences must form a connected story, conversation, or narrative — NOT a random list of unrelated sentences. Each sentence should follow naturally from the previous one. The paragraph should have a beginning, middle, and end.

DIFFICULTY: ${diff}

STYLE: Natural SPOKEN style — like someone telling a story or leaving a voice message. Do NOT use contractions (I'm, don't, we've). Write in complete, full sentences — not fragments or isolated words.

LANGUAGE: The entire output must be in English and ONLY English. Every single word, including names, places, and topic-specific terms, must be in English. Do NOT mix in any other language. No foreign words, no translations, no transliterations. If the topic is about another culture, describe it using only English words.

Output ONLY the paragraph. Nothing else. Do NOT include any preamble, introduction, or meta-commentary such as "Here is..." or "Sure,...". Start directly with the first sentence of the paragraph.`;
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
        easy: "Gebruik ALLEEN eenvoudige, veelvoorkomende woorden. Gebruik korte zinnen (8-15 woorden). Gebruik alleen tegenwoordige tijd. Geen spreekwoorden, geen moeilijke grammatica.",
        medium:
          "Gebruik alledaagse woordenschat met enkele minder gebruikelijke woorden. Mix korte en middellange zinnen (10-20 woorden). Gebruik tegenwoordige, verleden en toekomende tijd.",
        hard: "Gebruik rijke woordenschat met geavanceerde woorden, uitdrukkingen en spreekwoorden. Gebruik complexe zinnen met bijzinnen en gevarieerde tijden.",
      }[level];
      return `Schrijf een samenhangende alinea van precies ${sentences} zinnen in het Nederlands over "${topic || "dagelijks leven"}". De totale lengte moet ongeveer ${length} woorden zijn. Schrijf niet meer of minder dan ${sentences} zinnen.

SAMENHANG: De zinnen moeten samen een verbonden verhaal, gesprek of vertelling vormen — GEEN willekeurige losse zinnen. Elke zin moet logisch volgen op de vorige. De alinea moet een begin, midden en einde hebben.

MOEILIJKHEID: ${diff}

STIJL: Natuurlijke SPREEKSTIJL — alsof je een verhaal vertelt of een voicemail inspreekt. Schrijf in volledige, hele zinnen — geen losse woorden of fragmenten.

TAAL: De volledige tekst moet in het Nederlands zijn en ALLEEN in het Nederlands. Elk woord, inclusief namen, plaatsen en onderwerpspecifieke termen, moet in het Nederlands zijn. Gebruik GEEN Engelse of andere buitenlandse woorden. Geen vertalingen, geen transliteraties, geen codeswitching. Als het onderwerp over een andere cultuur gaat, beschrijf het dan alleen met Nederlandse woorden.

Geef ALLEEN de alinea. Niets anders. Geen inleiding, geen meta-commentaar zoals "Hier is..." of "Natuurlijk,...". Begin direct met de eerste zin van de alinea.`;
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
        easy: "只用简单常见的汉字和词语。用短句（8-15个字一句）。只用现在时。不用成语、不用复杂语法。",
        medium:
          "使用日常词汇，可以加入一些不太常见的词。句子长短混合（10-20个字）。可以使用过去和将来的表达。可以用常见的口语表达。",
        hard: "使用丰富的词汇，包括成语、俗语和高级表达。使用复杂句式、多种时态和细腻的表达方式。文本应该对流利的说话者有挑战性。",
      }[level];
      return `写一段连贯的中文段落，正好${sentences}句话，关于"${topic || "日常生活"}"。总长度必须接近${length}个字。不要多写或少写。

连贯性：所有句子必须组成一个完整的故事、对话或叙述——不是随机的、互不相关的句子。每句话都要自然地承接上一句。段落要有开头、中间和结尾。

难度要求：${diff}

风格：自然口语风格——像在讲一个故事或发语音消息。要用完整的句子，不要只写几个零散的词语或片段。

语言：整段文字必须全部使用中文，只能使用中文。每个字、每个词，包括人名、地名和主题相关术语，都必须是中文。绝对不要混入英文、拼音或其他任何语言。不要夹杂外语单词、翻译、音译或注释。如果主题涉及其他文化，请只用中文词汇描述。

只输出这段话。不要其他任何内容。不要加任何开头语或元评论，例如"这是..."或"好的,..."。直接从段落的第一句话开始。`;
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

const _g = globalThis as Record<string, unknown>;
const _p =
  typeof _g.process === "object"
    ? (_g.process as Record<string, unknown>)
    : undefined;
const _env =
  typeof _p?.env === "object" ? (_p.env as Record<string, string>) : undefined;
const LH = _env?.DEVCONTAINER === "true" ? "host.docker.internal" : "localhost";

export const AI_PRESETS: Record<string, AIPreset> = {
  // Self-hosted
  ollama: {
    name: "Ollama",
    baseURL: `http://${LH}:11434/v1`,
    needsKey: false,
    group: "self-hosted",
  },
  "lm-studio": {
    name: "LM Studio",
    baseURL: `http://${LH}:1234/v1`,
    needsKey: false,
    group: "self-hosted",
  },
  jan: {
    name: "Jan",
    baseURL: `http://${LH}:1337/v1`,
    needsKey: false,
    group: "self-hosted",
  },
  gpt4all: {
    name: "GPT4All",
    baseURL: `http://${LH}:4891/v1`,
    needsKey: false,
    group: "self-hosted",
  },
  localai: {
    name: "LocalAI",
    baseURL: `http://${LH}:8080/v1`,
    needsKey: false,
    group: "self-hosted",
  },
  llamacpp: {
    name: "llama.cpp server",
    baseURL: `http://${LH}:8081/v1`,
    needsKey: false,
    group: "self-hosted",
  },
  vllm: {
    name: "vLLM",
    baseURL: `http://${LH}:8000/v1`,
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
  anthropic: {
    name: "Anthropic",
    baseURL: "https://api.anthropic.com/v1/",
    needsKey: true,
    group: "cloud",
  },
  gemini: {
    name: "Google Gemini",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    needsKey: true,
    group: "cloud",
  },
  mistral: {
    name: "Mistral AI",
    baseURL: "https://api.mistral.ai/v1",
    needsKey: true,
    group: "cloud",
  },
  deepseek: {
    name: "DeepSeek",
    baseURL: "https://api.deepseek.com/v1",
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
  baseURL: `http://${LH}:11434/v1`,
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
    placeholder: "Use your dictation tool to transcribe the text...",
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
    welcome: "Choose AI in settings {icon}\nthen generate a test text",
    legendWrong: "Wrong (substituted)",
    legendMissing: "Missing",
    legendExtra: "Extra",
    legendGap: "Gap placeholder",
    levelEasy: "Beginner",
    levelMedium: "Intermediate",
    levelHard: "Advanced",
    updateAvailable: "New version available — tap to update",
    offlineReady: "App ready for offline use",
    reload: "Reload",
    tagline: "Find your best dictation tool",
    selectLanguage: "Select language:",
    selectDifficulty: "Select difficulty:",
    selectDuration: "Select duration:",
    settings: "Settings",
    back: "Back",
    quit: "Quit",
    enterToSkip: "Enter ↵ to skip",
    enterToCompare: "Enter ↵ to compare",
    generatingText: "Generating test text...",
  },
  nl: {
    generate: "Genereer",
    generating: "Genereren...",
    original: "Originele tekst",
    dictation: "Dictaat",
    placeholder: "Gebruik je dicteertool om de tekst om te zetten...",
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
    welcome: "Kies AI in instellingen {icon}\nen genereer een testtekst",
    legendWrong: "Fout (vervangen)",
    legendMissing: "Ontbreekt",
    legendExtra: "Extra",
    legendGap: "Plaatsaanduiding",
    levelEasy: "Beginner",
    levelMedium: "Gemiddeld",
    levelHard: "Gevorderd",
    updateAvailable: "Nieuwe versie beschikbaar — tik om bij te werken",
    offlineReady: "App klaar voor offline gebruik",
    reload: "Herladen",
    tagline: "Vind je beste dicteertool",
    selectLanguage: "Kies taal:",
    selectDifficulty: "Kies moeilijkheid:",
    selectDuration: "Kies duur:",
    settings: "Instellingen",
    back: "Terug",
    quit: "Stoppen",
    enterToSkip: "Enter ↵ om over te slaan",
    enterToCompare: "Enter ↵ om te vergelijken",
    generatingText: "Testtekst genereren...",
  },
  zh: {
    generate: "生成",
    generating: "生成中...",
    original: "原文",
    dictation: "听写",
    placeholder: "使用你的听写工具转录文本...",
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
    welcome: "在设置 {icon} 中选择AI\n然后生成测试文本",
    legendWrong: "错误（替换）",
    legendMissing: "缺失",
    legendExtra: "多余",
    legendGap: "占位标记",
    levelEasy: "初级",
    levelMedium: "中级",
    levelHard: "高级",
    updateAvailable: "新版本可用 — 点击更新",
    offlineReady: "应用已可离线使用",
    reload: "刷新",
    tagline: "找到最懂你的听写工具",
    selectLanguage: "选择语言：",
    selectDifficulty: "选择难度：",
    selectDuration: "选择时长：",
    settings: "设置",
    back: "返回",
    quit: "退出",
    enterToSkip: "按回车跳过",
    enterToCompare: "按回车对比",
    generatingText: "正在生成测试文本...",
  },
};
