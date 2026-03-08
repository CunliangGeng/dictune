# Dictune — Monorepo Design Document

**Version**: v6 (PWA + TUI)
**Date**: 2026-03-08

---

## 1. Overview

Dictune is a pronunciation clarity practice tool available as both a **PWA** (Progressive Web App) and a **TUI** (Terminal User Interface). Both interfaces share a common core of business logic, diffing engine, and AI integration.

The user workflow is the same in both:
1. Select language, CEFR level, reading duration
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
│   │       ├── ai.ts           AI generation (embedded + local + fallback)
│   │       └── index.ts        Barrel export
│   │
│   ├── pwa/               ← Web app (Vite + React + vite-plugin-pwa)
│   │   ├── public/             Static assets (icons, favicon)
│   │   ├── src/
│   │   │   ├── main.jsx        Entry point
│   │   │   └── App.jsx         Full UI (imports from @dictune/core)
│   │   ├── vite.config.js      Vite + PWA config
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
| `types.ts` | All type definitions | Both |
| `config.ts` | `LANGUAGES`, `LEVELS`, `DURATIONS`, `AI_PRESETS`, `DEFAULT_AI_CONFIG`, `UI_STRINGS` | Both |
| `diff.ts` | `compareTexts()`, and internal helpers | Both |
| `ai.ts` | `generateText()`, `testLocalConnection()`, `buildPrompt()` | Both |

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

```
generateText(lang, level, duration, topic, aiConfig)
  │
  ├─ Local AI configured + connected + model?
  │   ├─ YES → generateWithLocal() → success? → return
  │   │                             → fail? → fall through
  │   └─ NO → skip
  │
  └─ generateWithEmbedded() (Anthropic API)
```

**Local AI** uses the OpenAI-compatible `/chat/completions` endpoint. Seven presets are built in:

| Preset | Default URL | Notes |
|--------|-----------|-------|
| Ollama | `localhost:11434/v1` | Default |
| LM Studio | `localhost:1234/v1` | GUI |
| Jan | `localhost:1337/v1` | CORS default |
| GPT4All | `localhost:4891/v1` | CPU-optimized |
| LocalAI | `localhost:8080/v1` | Docker |
| llama.cpp | `localhost:8081/v1` | Minimal |
| vLLM | `localhost:8000/v1` | High-perf |

**Prompt design**: All prompts explicitly request spoken/conversational style text, not written prose. This ensures the generated text mimics natural speech patterns.

---

## 4. PWA (`@dictune/pwa`)

### 4.1 Tech Stack

| Layer | Technology |
|-------|-----------|
| Bundler | Vite 6 |
| Framework | React 19 |
| PWA | vite-plugin-pwa (Workbox) |
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
| AI API calls | Network only | — |

**Update mechanism**: `autoUpdate` — new versions download in background, activate on next load.

**Offline behavior:**
| Capability | Online | Offline (no local AI) | Offline (local AI) |
|-----------|--------|----------------------|-------------------|
| UI / settings | ✅ | ✅ | ✅ |
| Diff / compare | ✅ | ✅ | ✅ |
| Text generation | ✅ | ❌ | ✅ |

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
- `SettingsSidebar` — slide-out panel for local AI configuration

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
- **Same core imports** (`compareTexts`, `generateText`, etc.)
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
1. Toggle local AI on/off
2. Select service preset
3. Edit endpoint URL
4. Edit API key (optional)
5. Test connection (shows spinner → result)
6. Select model (from discovered list)

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
| CEFR levels, durations | ✅ | — | — |
| UI strings (i18n) | ✅ | — | — |
| AI presets & defaults | ✅ | — | — |
| Diff engine (preprocess, tokenize, LCS) | ✅ | — | — |
| Diff refinement (wrong detection) | ✅ | — | — |
| Chinese punctuation spacing | ✅ | — | — |
| Score calculation | ✅ | — | — |
| AI generation + fallback | ✅ | — | — |
| Connection testing | ✅ | — | — |
| Type definitions | ✅ | — | — |
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

- **Browser-internal AI** (WebLLM/Transformers.js): True offline text generation in PWA (~300MB model download)
- **IndexedDB persistence**: Save practice history, settings, AI config across PWA sessions
- **Bun SQLite**: Save practice history locally for TUI
- **Shared React components**: If Ink's Box/Text API converges further with React DOM, some layout components could be abstracted
- **Tauri desktop app**: Third surface sharing the same core, with native performance
- **npm distribution**: Publish `@dictune/tui` to npm for `bunx dictune` installation
