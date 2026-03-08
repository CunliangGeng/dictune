# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dictune is a pronunciation clarity practice tool. Users read AI-generated texts aloud using OS dictation, then the app diffs the original against the dictation result to highlight pronunciation weak spots. Available as a PWA (web) and TUI (terminal).

## Commands

```bash
bun install                  # install all workspace deps
bun run dev:pwa              # Vite dev server at localhost:5173/dictune/
bun run dev:tui              # run TUI directly via Bun
bun run build:pwa            # production build → packages/pwa/dist/
bun run build:tui            # bundle TUI → packages/tui/dist/
bun run typecheck            # typecheck all packages
bun run lint                 # check lint + formatting (Biome)
bun run lint:fix             # auto-fix lint + formatting
bun run format               # format only
```

## Architecture

Bun workspace monorepo with three packages:

```
@dictune/pwa  ──→  @dictune/core  ←──  @dictune/tui
(Vite+React)       (pure TS, 0 deps)    (Ink+Bun)
```

**`@dictune/core`** — All business logic, zero runtime dependencies, environment-agnostic (browser + Bun). Everything exports through `src/index.ts` barrel.

| Module | Purpose |
|--------|---------|
| `types.ts` | All shared type definitions (DiffPart union, AIConfig, ComparisonResult, etc.) |
| `config.ts` | Language configs with prompt builders, CEFR levels, durations, AI presets, i18n UI strings |
| `diff.ts` | Diff engine: preprocess → tokenize → LCS → refineDiff → insertPuncSpaces (Chinese only) |
| `ai.ts` | Text generation: local AI (OpenAI-compatible) with fallback to embedded Anthropic API |

**`@dictune/pwa`** — Single-page React 19 app. All components live in `App.jsx` (Dropdown, DiffView, AutoGrowTextarea, DiffLegend, SettingsSidebar, main Dictune component). Uses inline styles with CSS variables for Nord Aurora theming. No component library.

**`@dictune/tui`** — Ink 5 (React for terminals) app. Entry point `cli.tsx` renders `App.tsx`. Screen-based navigation via state machine (`Screen` type: lang → level → duration → topic → generating → practice → results). Same core imports as PWA.

## Key Patterns

- **Diff modes**: English/Dutch use word-level tokenization (split on whitespace, keep punctuation). Chinese uses char-level tokenization (strip punctuation, each character is a token). Controlled by `LanguageConfig.diffMode`.
- **Substitution detection**: `refineDiff()` pairs adjacent `removed` + `added` segments into `wrong` entries with both `original` and `transcribed` arrays.
- **Chinese spacing**: `insertPuncSpaces()` adds `{type: "space"}` markers at original punctuation positions so both diff panels align.
- **AI fallback chain**: local AI (if enabled + connected + has model) → embedded Anthropic API. Local AI uses any OpenAI-compatible `/chat/completions` endpoint. Seven built-in presets (Ollama, LM Studio, Jan, GPT4All, LocalAI, llama.cpp, vLLM).
- **Theme**: Nord Aurora color palette. PWA uses CSS variables (LIGHT/DARK objects in App.jsx). TUI uses hex colors directly (Ink supports hex).
- **Both surfaces share the same React mental model** (hooks, state, components) but render to different targets (DOM vs terminal ANSI).

## Hard Rules

- **Always commit before making changes.** Before modifying any files, create a commit of the current state so changes can be easily reviewed and reverted.

## Conventions

- Package manager is **Bun** exclusively — not npm/yarn/pnpm
- Core must remain **zero runtime dependencies** and work in both browser and Bun
- All prompts request spoken/conversational style text, not written prose
- PWA uses `.jsx` (no TypeScript in PWA source files). TUI uses `.tsx`
- PWA base path is `/dictune/` (for GitHub Pages deployment)
- **Biome** handles linting and formatting — run `bun run lint:fix` before committing
- No test framework is set up yet
