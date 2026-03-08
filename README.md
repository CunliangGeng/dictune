# Dictune

**Pronunciation clarity practice tool** — available as a PWA and a terminal TUI.

Practice by reading AI-generated texts aloud using your OS dictation, then compare to find pronunciation weak spots.

## Monorepo Structure

| Package | Description | Stack |
|---------|-------------|-------|
| `@dictune/core` | Shared logic (diff engine, AI, config) | TypeScript |
| `@dictune/pwa` | Installable web app | Vite + React + PWA |
| `@dictune/tui` | Terminal interface | Ink + Bun |

## Quick Start

```bash
bun install

# Web app
bun run dev:pwa      # → http://localhost:5173/dictune/

# Terminal app
bun run dev:tui      # → interactive terminal UI
```

## AI Sources

- **Built-in**: Anthropic API (requires internet)
- **Local**: Ollama, LM Studio, Jan, or any OpenAI-compatible service

Configure via Settings (⚙️ in PWA, `[s]` in TUI).

## Architecture

See [DESIGN.md](./DESIGN.md) for the full design document.
