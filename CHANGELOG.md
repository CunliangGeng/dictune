# Changelog

## Security, CLI Commands & Docs (2026-03-09)

### API Key Security

- **HTTPS enforcement** — `assertSecureForApiKey()` in `core/ai.ts` refuses to send API keys over unencrypted HTTP, except to localhost/Docker internal addresses
- Applied to both `generateWithLocal()` and `testLocalConnection()`
- Fixed `testLocalConnection()` model list parsing — replaced `any` type with proper `{ id?: string }` and filters out entries without valid string IDs

### PWA Accessibility

- Settings sidebar: added `role="dialog"`, `aria-modal`, `aria-labelledby` attributes
- Form inputs: added `htmlFor`/`id` pairs for Endpoint URL and API Key labels
- Topic input: added `aria-label`

### TUI CLI Commands

- `dictune --help` / `-h` — shows usage and available commands
- `dictune --version` / `-v` — prints current version from package.json
- `dictune update` — self-update by running the install script

### README & Docs

- Added centered logo-wordmark header to README
- Added PWA install instructions (Chrome/Edge/Safari)
- Added terminal app install command (`curl | bash`) and GitHub Releases link
- Updated DESIGN.md to v7 with all recent changes

### Files Changed

| File | Change |
|------|--------|
| `packages/core/src/ai.ts` | API key HTTPS security check, typed model list parsing |
| `packages/pwa/src/App.jsx` | Accessibility attributes on settings sidebar and form inputs |
| `packages/tui/src/cli.tsx` | `--help`, `--version`, `update` command handling |
| `README.md` | Logo, install instructions, PWA screenshot |
| `DESIGN.md` | Updated to v7 |

---

## Rebranding & TUI Overhaul (2026-03-09)

### App Rebranding

Dictune is now positioned as a **dictation tool comparison app** — helping users find which dictation/transcription tool works best for their voice, rather than a pronunciation practice tool.

- New tagline: **"Find your best dictation tool"** (localized: nl "Vind je beste dicteertool", zh "找到最懂你的听写工具")
- Updated descriptions across all `package.json` files, PWA manifest, HTML meta, README, CLAUDE.md, and DESIGN.md
- Dictation hint text updated to "Use your dictation tool to transcribe the text..." (all languages)
- Welcome and generating messages now say "test text" instead of "practice text"

### TUI UX Improvements

- **Auto-connect on generate** — TUI now auto-connects to the AI server and picks the first model if not already connected (matching PWA behavior)
- **Generation status** — shows "Using {model} on {service}" during text generation
- **Grouped AI presets** — settings list separates self-hosted and cloud providers with section headers
- **Smart API key label** — shows "(required)" for cloud providers, "(optional)" for self-hosted
- **Global `[s]` settings shortcut** — accessible from any non-input screen
- **Back navigation** — `[b]` on selection screens, `[Esc]` on text-input screens (topic, dictation)
- **Keyboard shortcuts** — number keys `[1-N]` for selection screens, letter keys `[r][n][b][q]` on results

### TUI Localization

- All hint text now uses localized `UI_STRINGS` instead of hardcoded English
- Added 10 new UI string keys: `tagline`, `selectLanguage`, `selectDifficulty`, `selectDuration`, `settings`, `back`, `quit`, `enterToSkip`, `enterToCompare`, `generatingText`
- Translations added for all three languages (en, nl, zh)

### TUI Visual Design

- **ANSI background colors** for diff highlights — red (wrong), yellow (missing), green (extra), dots (gap)
- **Side-by-side diff panels** with colored borders — purple for original, frost blue for dictation
- **Compact stats row** in dashed silver border with accuracy as first stat
- **Compact legend** with color swatches

### Diff Engine Fix

- **Chinese punctuation preserved** — punctuation is no longer stripped during comparison, so characters like `。`, `，`, `！` appear in diff results

### Prompt Improvements

- **Anti-preamble** — prompts now explicitly forbid filler like "Here is..." or "Sure,..." in all three languages
- **Stronger language enforcement** — prompts forbid mixing languages, transliterations, and foreign words even for topic-specific terms

### PWA Updates

- **Update toast** — PWA now shows a prompt when a new version is available (changed from `autoUpdate` to `prompt` registration)
- **GitHub Actions** — switched PWA build from Node.js to Bun

### TUI Build & Distribution

- **Standalone executable** — `bun run build:exe` compiles TUI to a single binary
- **Install script** — `install.sh` for downloading and installing the TUI binary

### Files Changed

| File | Change |
|------|--------|
| `packages/core/src/config.ts` | Rebranded UI strings, anti-preamble prompts, stronger language rules, new i18n keys |
| `packages/core/src/types.ts` | Added new `UIStrings` fields |
| `packages/core/src/diff.ts` | Removed Chinese punctuation stripping |
| `packages/tui/src/App.tsx` | Full UX overhaul — auto-connect, back nav, ANSI colors, side-by-side diff, localized text |
| `packages/pwa/src/App.jsx` | Update toast component |
| `packages/pwa/vite.config.js` | Manifest rebranding, prompt registration |
| `packages/pwa/index.html` | Updated meta description |
| `package.json` | Rebranded description |
| `packages/pwa/package.json` | Rebranded description |
| `packages/tui/package.json` | Rebranded description, build:exe script |
| `packages/tui/build.ts` | Standalone executable build script |
| `install.sh` | TUI installer script |
| `CLAUDE.md` | Rebranded project overview |
| `README.md` | Rebranded description |
| `DESIGN.md` | Rebranded overview |
| `.github/workflows/deploy.yml` | Switched to Bun |
| `.github/workflows/release-tui.yml` | New release workflow for TUI binary |

---

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
