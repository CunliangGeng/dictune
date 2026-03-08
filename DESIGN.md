# Dictune — Monorepo Design Document

**Version**: v6 (PWA + TUI)
**Date**: 2026-03-08

---

## 1. Overview

Dictune is a pronunciation clarity practice tool available as both a **PWA** (Progressive Web App) and a **TUI** (Terminal User Interface). Both interfaces share a common core of business logic, diffing engine, and AI integration.

The user workflow is the same in both:
1. Select language, difficulty level, reading duration
2. AI generates a spoken-style practice text
3. User reads aloud into their OS dictation system
4. App compares original vs dictation, highlighting differences
5. User reviews accuracy, tries again or generates a new text

---

## 2. Monorepo Architecture

```
dictune/
├── packages/
│   ├── core/              ← Shared logic (TypeScript, zero dependencies)
│   │   └── src/
│   │       ├── types.ts        Type definitions
│   │       ├── config.ts       Languages, levels, durations, presets, UI strings
│   │       ├── diff.ts         Diff engine (preprocess, tokenize, LCS, refine, scoring)
│   │       ├── ai.ts           AI generation (OpenAI-compatible API)
│   │       └── index.ts        Barrel export
│   │
│   ├── pwa/               ← Web app (Vite + React + vite-plugin-pwa)
│   │   ├── public/             Static assets (icons, favicon)
│   │   ├── src/
│   │   │   ├── main.jsx        Entry point
│   │   │   ├── App.jsx         Full UI (imports from @dictune/core)
│   │   │   └── browser-ai.js   WebLLM wrapper (in-browser AI inference)
│   │   ├── vite.config.js      Vite + PWA config (WebLLM code-splitting)
│   │   └── index.html          Shell
│   │
│   └── tui/               ← Terminal app (Ink + Bun)
│       └── src/
│           ├── cli.tsx         Entry point (#!/usr/bin/env bun)
│           └── App.tsx         Full TUI (imports from @dictune/core)
│
├── .github/workflows/
│   └── deploy.yml          GitHub Pages for PWA
└── package.json            Bun workspace root
```

### Package Manager: Bun

Bun is used as the monorepo manager via `workspaces`. It handles:
- Workspace dependency linking (`workspace:*`)
- TypeScript execution without compilation step (TUI runs directly via `bun run`)
- Fast installs and builds

### Dependency Graph

```
@dictune/pwa  ──→  @dictune/core  ←──  @dictune/tui

                    Pure TypeScript
                    No runtime deps
                    Works in browser + Bun
```

---

## 3. Shared Core (`@dictune/core`)

The core package contains **all business logic** with zero runtime dependencies. Every function is pure and environment-agnostic (works in both browser `fetch` and Bun `fetch`).

### 3.1 Module Map

| File | Exports | Used By |
|------|---------|---------|
| `types.ts` | All type definitions (`ApiServerConfig`, `DifficultyLevel`, etc.) | Both |
| `config.ts` | `LANGUAGES`, `LEVELS`, `DURATIONS`, `AI_PRESETS`, `DEFAULT_API_SERVER_CONFIG`, `DEFAULT_TOPICS`, `UI_STRINGS` | Both |
| `diff.ts` | `compareTexts()`, and internal helpers | Both |
| `ai.ts` | `generateWithLocal()`, `testLocalConnection()`, `buildPrompt()` | Both |

### 3.2 Diff Engine Pipeline

```
Original ─┐                                              ┌─ equal
           ├→ preprocess → tokenize → LCS → refineDiff → ├─ wrong (substitution)
Dictation ─┘                                              ├─ removed (missing)
                                          │               ├─ added (extra)
                                          ↓               └─ space (Chinese only)
                                  insertPuncSpaces()
                                  (Chinese: space at
                                   punctuation positions)
```

**Preprocessing rules:**
| Language | Punctuation | Case | Tokenization |
|----------|------------|------|-------------|
| English | **Kept** | Lower | Word (split on whitespace) |
| Dutch | **Kept** | Lower | Word (split on whitespace) |
| Chinese | **Stripped** | N/A | Char (each character = token) |

**Substitution detection (`refineDiff`):**
Adjacent `removed` + `added` segments are paired into `wrong` entries:
- `removed: [a,b,c]` + `added: [x,y]` → `wrong(orig:[a,b], trans:[x,y])` + `removed:[c]`

**Chinese spacing (`insertPuncSpaces`):**
Scans original text for punctuation positions, inserts `{type: "space"}` markers in the diff array at those positions. Both panels render the same markers for alignment.

### 3.3 AI Generation

The user selects one of two AI providers:

**1. In-browser AI** (PWA only) — via WebLLM + WebGPU, runs entirely in the browser:

```
doGenerate()
  │
  ├─ Model cached? → load engine → generate → return
  └─ Not cached? → show download dialog → download model → generate → return
```

- Uses `@mlc-ai/web-llm` with Qwen3 models (0.6B default, 1.7B optional)
- Model downloaded once (~350MB), cached in browser via Cache API for offline use
- Strips Qwen3's `<think>` tags via `/no_think` system message + regex fallback
- Lazy-loaded via dynamic imports to avoid 6MB bundle on page load

**2. Local or Cloud AI** — any OpenAI-compatible `/chat/completions` endpoint:

```
doGenerate()
  │
  ├─ Not connected? → auto-connect (fetch /models, select first) → generate → return
  └─ Connected? → generate → return
```

Presets are grouped into self-hosted and cloud:

| Preset | Default URL | Group |
|--------|-----------|-------|
| Ollama | `localhost:11434/v1` | Self-hosted |
| LM Studio | `localhost:1234/v1` | Self-hosted |
| Jan | `localhost:1337/v1` | Self-hosted |
| GPT4All | `localhost:4891/v1` | Self-hosted |
| LocalAI | `localhost:8080/v1` | Self-hosted |
| llama.cpp | `localhost:8081/v1` | Self-hosted |
| vLLM | `localhost:8000/v1` | Self-hosted |
| OpenAI | `api.openai.com/v1` | Cloud |
| Anthropic | `api.anthropic.com/v1/` | Cloud |
| Google Gemini | `generativelanguage.googleapis.com/v1beta/openai/` | Cloud |
| Mistral AI | `api.mistral.ai/v1` | Cloud |
| DeepSeek | `api.deepseek.com/v1` | Cloud |
| Together AI | `api.together.xyz/v1` | Cloud |
| Groq | `api.groq.com/openai/v1` | Cloud |

**Prompt design:**
- All prompts request spoken/conversational style text, not written prose
- Exact sentence counts (e.g. "Write exactly 6 sentences") instead of vague word counts — small models follow this much better
- Difficulty levels use concrete constraints (word complexity, sentence length, grammar rules) instead of abstract CEFR standards
- Random default topics (cats, cooking, travel, etc.) when no topic is provided
- Strict single-language enforcement in every prompt

---

## 4. PWA (`@dictune/pwa`)

### 4.1 Tech Stack

| Layer | Technology |
|-------|-----------|
| Bundler | Vite 6 |
| Framework | React 19 |
| PWA | vite-plugin-pwa (Workbox) |
| In-browser AI | @mlc-ai/web-llm (WebGPU, lazy-loaded) |
| Styling | Inline styles + CSS variables |
| Fonts | Google Fonts (DM Sans, Source Serif 4, Noto Serif SC) |
| Deploy | GitHub Pages + GitHub Actions |

### 4.2 PWA Capabilities

**Caching strategy:**

| Resource | Strategy | TTL |
|----------|----------|-----|
| App shell (HTML/JS/CSS) | Precache (install-time) | Until update |
| Icons, SVG | Precache | Until update |
| Google Fonts CSS | CacheFirst (runtime) | 1 year |
| Google Fonts WOFF2 | CacheFirst (runtime) | 1 year |
| WebLLM chunk (~6MB) | Precache | Until update |
| AI models (Qwen3) | Cache API (managed by WebLLM) | Until deleted |
| AI API calls | Network only | — |

**Update mechanism**: `autoUpdate` — new versions download in background, activate on next load.

**Offline behavior:**
| Capability | Online | Offline (browser AI cached) | Offline (no AI) |
|-----------|--------|---------------------------|----------------|
| UI / settings | ✅ | ✅ | ✅ |
| Diff / compare | ✅ | ✅ | ✅ |
| Text generation | ✅ | ✅ | ❌ |

### 4.3 UI Design

**Color scheme**: Nord Aurora (light + dark mode with toggle)

| Role | Light | Dark | Aurora |
|------|-------|------|--------|
| Accent | `#B48EAD` | `#B48EAD` | Purple |
| Correct | `#A3BE8C` | `#A3BE8C` | Green |
| Wrong | `#EBCB8B` | `#EBCB8B` | Yellow |
| Missing | `#BF616A` | `#BF616A` | Red |
| Extra | `#5E81AC` | `#81A1C1` | Frost |

**Layout**: Single-page, two stacked panels (mobile: vertical, desktop: side-by-side)

**Components** (all in `App.jsx`):
- `Dropdown` — click-to-open option selector
- `DiffView` — renders 5 diff types with color/gap placeholders
- `AutoGrowTextarea` — textarea that grows with content
- `DiffLegend` — color key for diff types
- `SettingsSidebar` — slide-out panel with AI provider selector, browser AI model picker, API server config with grouped presets

**Browser AI module** (`browser-ai.js`):
- `BROWSER_AI_MODELS` — available Qwen3 models with labels and sizes
- `initBrowserAI(modelId, onProgress)` — download/load model, returns engine
- `generateWithBrowserAI(prompt)` — generate text with loaded model
- `isBrowserAIModelCached(modelId)` — check Cache API for cached model
- `isWebGPUSupported()` — detect WebGPU availability

---

## 5. TUI (`@dictune/tui`)

### 5.1 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Bun |
| Framework | Ink 5 (React for terminals) |
| Input | ink-text-input, ink-select-input |
| Feedback | ink-spinner |
| Language | TypeScript |

### 5.2 Why Ink + Bun

Ink renders React components to the terminal using ANSI escape codes. This means:
- **Same mental model** as the PWA (React components, hooks, state)
- **Same core imports** (`compareTexts`, `buildPrompt`, `generateWithLocal`, etc.)
- **Rich interactivity** (select menus, text input, spinners, colors)

Bun provides:
- Native TypeScript execution (no compile step for development)
- Fast startup (~50ms)
- Built-in `fetch` compatible with the core AI module
- Workspace support for the monorepo

### 5.3 Screen Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Language  │ →  │  Level   │ →  │ Duration │ →  │  Topic   │
│ (select)  │    │ (select) │    │ (select) │    │ (input)  │
└──────────┘    └──────────┘    └──────────┘    └────┬─────┘
                                                     │ Enter
                                                     ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│ ╭─ ORIGINAL TEXT ──────────╮ │    │  Results                     │
│ │ The text appears here... │ │    │  ████████████░░░░ 78%        │
│ ╰──────────────────────────╯ │    │                              │
│                              │    │  Total  Correct Wrong Miss   │
│ Your dictation:              │ →  │   45     35      5    3      │
│ ❯ _                          │    │                              │
│                              │    │  ↻ Try Again                 │
└──────────────────────────────┘    │  ▸ Generate New              │
                                    │  ← Change settings           │
                                    │  ✕ Quit                      │
                                    └──────────────────────────────┘
```

### 5.4 Terminal Colors

Uses Nord hex colors directly (Ink supports hex in modern terminals):

| Element | Color | Rendering |
|---------|-------|-----------|
| Wrong text | `#EBCB8B` bg | Black text on yellow |
| Missing text | `#BF616A` bg | White text on red |
| Extra text | `#5E81AC` bg | White text on blue |
| Missing gap | `#7B88A1` | Dim strikethrough underscores |
| Accent | `#B48EAD` | Logo, active selection |
| Info | `#88C0D0` | Prompts, cursor |

### 5.5 Settings

Accessible via `[s]` from the language selection screen. Multi-step menu:
1. Select service preset (Ollama, LM Studio, etc.)
2. Edit endpoint URL
3. Edit API key (optional)
4. Test connection (shows spinner → result)
5. Select model (from discovered list)

Note: TUI only supports Local or Cloud AI (no in-browser AI). The `doGenerate` function calls `buildPrompt()` + `generateWithLocal()` directly.

### 5.6 Running

```bash
# Development
cd packages/tui
bun run dev          # or: bun run src/cli.tsx

# Build standalone
bun run build        # → dist/cli.js

# Install globally (from repo)
bun link
dictune              # runs from anywhere
```

---

## 6. Code Sharing Analysis

| Component | Core | PWA | TUI |
|-----------|:----:|:---:|:---:|
| Language configs & prompts | ✅ | — | — |
| Difficulty levels, durations | ✅ | — | — |
| Default topics | ✅ | — | — |
| UI strings (i18n) | ✅ | — | — |
| AI presets & defaults | ✅ | — | — |
| Diff engine (preprocess, tokenize, LCS) | ✅ | — | — |
| Diff refinement (wrong detection) | ✅ | — | — |
| Chinese punctuation spacing | ✅ | — | — |
| Score calculation | ✅ | — | — |
| AI generation (OpenAI-compatible) | ✅ | — | — |
| Connection testing | ✅ | — | — |
| Type definitions | ✅ | — | — |
| In-browser AI (WebLLM) | — | ✅ | — |
| Nord theme CSS variables | — | ✅ | — |
| Nord terminal hex colors | — | — | ✅ |
| React DOM components | — | ✅ | — |
| Ink terminal components | — | — | ✅ |
| PWA manifest + service worker | — | ✅ | — |
| CLI entry point | — | — | ✅ |

**Reuse ratio**: ~60% of total logic is in `@dictune/core`. The remaining 40% is platform-specific rendering, which inherently cannot be shared between DOM and terminal.

---

## 7. Development Workflow

```bash
# Initial setup
bun install                  # installs all workspace deps

# PWA development
bun run dev:pwa              # Vite dev server at localhost:5173

# TUI development
bun run dev:tui              # Runs Ink app directly

# Type checking
bun run typecheck            # Checks all packages

# PWA production build
bun run build:pwa            # → packages/pwa/dist/

# TUI production build
bun run build:tui            # → packages/tui/dist/
```

---

## 8. Future Considerations

- **IndexedDB persistence**: Save practice history, settings, AI config across PWA sessions
- **Bun SQLite**: Save practice history locally for TUI
- **Shared React components**: If Ink's Box/Text API converges further with React DOM, some layout components could be abstracted
- **Tauri desktop app**: Third surface sharing the same core, with native performance
- **npm distribution**: Publish `@dictune/tui` to npm for `bunx dictune` installation
- **Additional browser AI models**: Support more WebLLM-compatible models as they become available
