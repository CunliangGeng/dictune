# Changelog

## UI Polish & Prompt Improvements (2026-03-08)

### Prompt Coherence
- Prompts now require a **coherent paragraph** (story, conversation, or narrative) instead of random unrelated sentences
- Each paragraph must have a beginning, middle, and end
- Prompts enforce **complete, full sentences** — not fragments or isolated words

### Localized Difficulty Labels
- Difficulty levels displayed in each language's native words:
  - English: Beginner / Intermediate / Advanced
  - Dutch: Beginner / Gemiddeld / Gevorderd
  - Chinese: 初级 / 中级 / 高级
- Applied to both PWA dropdowns and TUI select menus

### PWA Layout Improvements
- **Controls bar moved above panels** — dropdowns, topic input, and generate button now sit above the original/dictation grid, so both panels are equal width
- **Rounded corners** on both panels (previously only top/bottom rounded where they joined)
- **Header redesign** — uses project logo (`logo.svg`) + wordmark (`wordmark.svg`) from `public/`
- **GitHub icon** added to header (left of theme toggle)
- **Favicon** updated to use the actual project logo SVG

### UI String Updates
- Welcome text now says "Choose AI in settings [gear icon], then generate a practice text"
- Dictation placeholder updated to reference "original text" instead of "text above"
- All UI string changes applied across English, Dutch, and Chinese

### Files Changed

| File | Change |
|------|--------|
| `packages/core/src/config.ts` | Coherent paragraph prompts, localized level labels, updated UI strings |
| `packages/core/src/types.ts` | Added `levelEasy`, `levelMedium`, `levelHard` to `UIStrings` |
| `packages/pwa/src/App.jsx` | Controls bar above grid, logo header, GitHub link, rounded panels, localized dropdowns |
| `packages/pwa/vite.config.js` | SVG logo in PWA manifest, precache logo/wordmark |
| `packages/pwa/index.html` | Relative favicon path for dev mode compatibility |
| `packages/pwa/public/` | Added `logo.svg`, `wordmark.svg`, `logo-wordmark.svg`; replaced `favicon.svg`; removed PNG icons |
| `packages/tui/src/App.tsx` | Localized level labels in select menu and breadcrumbs |

---

## TUI Improvements (2026-03-08)

### Ink v6 Upgrade
- Upgraded Ink from v5 to v6 for **React 19 compatibility** — Ink 5 used `react-reconciler@0.29` (React 18), causing version mismatches

### Side-by-Side Diff Panels
- Results screen now shows ORIGINAL and DICTATION panels **side-by-side** instead of stacked vertically, making it easier to compare differences at a glance

### Dev Script Fix
- Changed `dev:tui` from `bun run --filter` to `bun run --cwd` to preserve **TTY raw mode**, which Ink needs for keyboard input

### Devcontainer Support
- AI preset URLs automatically use `host.docker.internal` instead of `localhost` when running inside a devcontainer (`DEVCONTAINER=true` env var)

### Files Changed

| File | Change |
|------|--------|
| `packages/tui/package.json` | Ink v5 → v6 |
| `packages/tui/src/App.tsx` | Side-by-side diff layout |
| `package.json` | `dev:tui` uses `--cwd` for TTY raw mode |
| `packages/core/src/config.ts` | Devcontainer host detection for AI preset URLs |
| `bun.lock` | Updated dependencies |

---

## Browser-Based AI & Provider Unification (2026-03-08)

### Problem

The PWA relied on a hidden Anthropic API fallback when no local AI server was configured, meaning it couldn't work offline. Users had no control over which AI provider was used — the app silently fell back without telling them.

### Solution

Replaced the three-tier AI system (Local AI → hidden Anthropic fallback) with two explicit, user-controlled providers:

#### 1. In-browser AI (new)
- **WebLLM** — runs AI inference entirely in the browser using WebGPU
- **Qwen3 models** — two options selectable in settings:
  - Qwen3 0.6B (~350MB, default) — fast download, good multilingual quality
  - Qwen3 1.7B (~1GB) — higher quality
- Model downloaded once, cached in browser for offline use
- First-time download shows confirmation dialog with model name and size
- Progress bar during download, status text during generation
- `/no_think` system message + regex fallback to strip Qwen3's `<think>` tags

#### 2. Local or Cloud AI (unified)
- Merged "Local AI" concept with cloud providers into one option
- **Self-hosted presets**: Ollama, LM Studio, Jan, GPT4All, LocalAI, llama.cpp, vLLM
- **Cloud presets** (new): OpenAI, Anthropic, Google Gemini, Mistral AI, DeepSeek, Together AI, Groq
- Same config: baseURL + apiKey + model
- Auto-connects and selects a model on first generate (no manual "Test Connection" needed)
- Helpful error when a non-chat model (e.g. embedding model) is selected

#### Removed
- Hidden embedded Anthropic API fallback — no more silent behavior
- `generateWithEmbedded()` and `generateText()` unified function from core
- `AIConfig.enabled` toggle — provider selection is now explicit

### Files Changed

| File | Change |
|------|--------|
| `packages/pwa/src/browser-ai.js` | **New** — WebLLM wrapper with lazy dynamic imports |
| `packages/core/src/ai.ts` | Removed Anthropic fallback, kept `generateWithLocal` + `buildPrompt` |
| `packages/core/src/types.ts` | Renamed `AIConfig` → `ApiServerConfig`, added `DifficultyLevel`, added `group` to `AIPreset` |
| `packages/core/src/config.ts` | Added cloud presets, default topics, difficulty-based prompts |
| `packages/pwa/src/App.jsx` | Redesigned settings sidebar, new provider selector, download dialog, progress UI |
| `packages/pwa/package.json` | Added `@mlc-ai/web-llm` dependency |
| `packages/pwa/vite.config.js` | WebLLM code-splitting, Workbox cache limit increase |
| `packages/tui/src/App.tsx` | Updated to use new core API (`ApiServerConfig`, `buildPrompt`, `generateWithLocal`) |

---

## Difficulty Levels & Prompt Improvements (2026-03-08)

### Problem

CEFR levels (A1–C2) weren't effective — small models like Qwen3-0.6B don't understand abstract language proficiency standards, so generated text didn't vary meaningfully between levels.

### Solution

Replaced CEFR with **Easy / Medium / Hard** using concrete prompt constraints:

| Level | Constraints |
|-------|------------|
| **Easy** | Simple common words only, short sentences (5–8 words), present tense, no idioms |
| **Medium** | Everyday vocabulary with some less common words, mixed sentence lengths (8–15 words), multiple tenses |
| **Hard** | Rich vocabulary, idioms, complex sentences with clauses, varied tenses |

### Other Prompt Improvements

- **Sentence counts**: Prompts now specify exact sentence counts (e.g. "Write exactly 6 sentences") instead of vague word counts — small models follow this much better
- **Random default topics**: When no topic is provided, a random topic is picked from a list (cats, cooking, travel, etc.) instead of generic "daily life"
- **Single-language enforcement**: Each prompt explicitly forbids mixing languages
- **Generation status**: Shows which model/server is being used during generation (e.g. "Using llama3 on Ollama to generate...")

---

## UX Flow

### In-browser AI — First Use
1. User clicks "Generate"
2. Dialog: "Download Qwen3 0.6B (~350MB) for offline use?" → "Download & Generate" / "Use Local or Cloud AI"
3. Download progress bar with percentage
4. Text generates, model stays cached

### In-browser AI — Subsequent Use
1. User clicks "Generate"
2. Loading dots + "Using Qwen3 0.6B to generate..."
3. Text appears

### Local or Cloud AI
1. User selects provider in settings (or app auto-connects on generate)
2. Clicks "Generate" → auto-connects if needed, selects model, generates
3. Shows "Using llama3 on Ollama to generate..." during generation
4. On error: clear message shown (no silent fallback)
