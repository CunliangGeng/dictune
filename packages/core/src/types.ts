// ─── Language & Config Types ─────────────────────────────────

export type LangCode = "en" | "nl" | "zh";
export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type DifficultyLevel = "easy" | "medium" | "hard";
export type DiffMode = "word" | "char";

export interface LanguageConfig {
  native: string;
  flag: string;
  diffMode: DiffMode;
  wordsPerMin: number;
  prompt: (level: DifficultyLevel, length: number, topic?: string) => string;
}

export interface DurationOption {
  label: string;
  value: number;
}

// ─── AI Types ────────────────────────────────────────────────

export type AIConnectionStatus = "disconnected" | "connected" | "error";

export interface ApiServerConfig {
  preset: string;
  baseURL: string;
  apiKey: string;
  model: string;
  status: AIConnectionStatus;
  models: string[];
}

export interface AIPreset {
  name: string;
  baseURL: string;
  needsKey: boolean;
  group: "self-hosted" | "cloud";
}

// ─── Diff Types ──────────────────────────────────────────────

export interface DiffPartEqual {
  type: "equal";
  value: string[];
}

export interface DiffPartWrong {
  type: "wrong";
  original: string[];
  transcribed: string[];
}

export interface DiffPartRemoved {
  type: "removed";
  value: string[];
}

export interface DiffPartAdded {
  type: "added";
  value: string[];
}

export interface DiffPartSpace {
  type: "space";
}

export type DiffPart =
  | DiffPartEqual
  | DiffPartWrong
  | DiffPartRemoved
  | DiffPartAdded
  | DiffPartSpace;

export interface ComparisonResult {
  diff: DiffPart[];
  accuracy: number;
  total: number;
  matched: number;
  wrong: number;
  missing: number;
  extra: number;
  sep: string;
}

// ─── UI Text Types ───────────────────────────────────────────

export interface UIStrings {
  generate: string;
  generating: string;
  original: string;
  dictation: string;
  placeholder: string;
  compare: string;
  tryAgain: string;
  generateNew: string;
  accuracy: string;
  total: string;
  matched: string;
  wrong: string;
  missing: string;
  extra: string;
  topicPlaceholder: string;
  welcome: string;
  legendWrong: string;
  legendMissing: string;
  legendExtra: string;
  legendGap: string;
}
