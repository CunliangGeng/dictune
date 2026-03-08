import {
  AI_PRESETS,
  type ApiServerConfig,
  buildPrompt,
  type ComparisonResult,
  compareTexts,
  DEFAULT_API_SERVER_CONFIG,
  type DifficultyLevel,
  type DiffPart,
  DURATIONS,
  generateWithLocal,
  LANG_CODES,
  LANGUAGES,
  type LangCode,
  LEVELS,
  testLocalConnection,
  UI_STRINGS,
} from "@dictune/core";
import { Box, Text, useApp, useInput } from "ink";
import SelectInput from "ink-select-input";
import Spinner from "ink-spinner";
import TextInput from "ink-text-input";
import { useCallback, useState } from "react";

// ─── Types ───────────────────────────────────────────────────

type Screen =
  | "lang"
  | "level"
  | "duration"
  | "topic"
  | "generating"
  | "practice"
  | "results"
  | "settings";

// ─── Nord colors for terminal ────────────────────────────────

const C = {
  accent: "#B48EAD",
  correct: "#A3BE8C",
  wrong: "#EBCB8B",
  missing: "#BF616A",
  extra: "#5E81AC",
  dim: "#4C566A",
  frost: "#88C0D0",
  muted: "#7B88A1",
};

// ─── Diff renderer for terminal ──────────────────────────────

function DiffLine({
  diff,
  sep,
  side,
}: {
  diff: DiffPart[];
  sep: string;
  side: "original" | "transcription";
}) {
  return (
    <Text wrap="wrap">
      {diff.map((part, i) => {
        if (part.type === "space") return <Text key={i}> </Text>;
        if (part.type === "equal")
          return (
            <Text key={i}>
              {part.value.join(sep)}
              {sep}
            </Text>
          );
        if (part.type === "wrong") {
          const t =
            side === "original"
              ? part.original.join(sep)
              : part.transcribed.join(sep);
          return (
            <Text key={i} color="black" backgroundColor={C.wrong}>
              {t}
            </Text>
          );
        }
        if (part.type === "removed") {
          if (side === "original")
            return (
              <Text key={i} color="white" backgroundColor={C.missing}>
                {part.value.join(sep)}
              </Text>
            );
          return (
            <Text key={i} color={C.muted} dimColor strikethrough>
              {"_".repeat(part.value.join(sep).length)}
            </Text>
          );
        }
        if (part.type === "added") {
          if (side === "transcription")
            return (
              <Text key={i} color="white" backgroundColor={C.extra}>
                {part.value.join(sep)}
              </Text>
            );
          return (
            <Text key={i} color={C.muted} dimColor strikethrough>
              {"_".repeat(part.value.join(sep).length)}
            </Text>
          );
        }
        return null;
      })}
    </Text>
  );
}

// ─── Stat box ────────────────────────────────────────────────

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <Box flexDirection="column" alignItems="center" paddingX={2}>
      <Text bold color={color}>
        {value}
      </Text>
      <Text dimColor>{label}</Text>
    </Box>
  );
}

// ─── Progress bar ────────────────────────────────────────────

function ProgressBar({
  percent,
  width = 30,
  color,
}: {
  percent: number;
  width?: number;
  color: string;
}) {
  const filled = Math.round((percent / 100) * width);
  return (
    <Text>
      <Text color={color}>{"█".repeat(filled)}</Text>
      <Text color={C.dim}>{"░".repeat(width - filled)}</Text>
      <Text bold color={color}>
        {" "}
        {percent}%
      </Text>
    </Text>
  );
}

// ─── Main App ────────────────────────────────────────────────

export function App() {
  const { exit } = useApp();
  const [screen, setScreen] = useState<Screen>("lang");
  const [lang, setLang] = useState<LangCode>("en");
  const [level, setLevel] = useState<DifficultyLevel>("medium");
  const [duration, setDuration] = useState(1);
  const [topic, setTopic] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [transcription, setTranscription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [aiConfig, setAiConfig] = useState<ApiServerConfig>(
    DEFAULT_API_SERVER_CONFIG,
  );
  const [settingsStep, setSettingsStep] = useState<
    "menu" | "preset" | "url" | "key" | "model" | "test"
  >("menu");
  const [testMsg, setTestMsg] = useState<string | null>(null);

  const t = UI_STRINGS[lang];

  // ── Generate ──
  const doGenerate = useCallback(async () => {
    setScreen("generating");
    setError(null);
    setOriginalText("");
    setTranscription("");
    setResult(null);
    try {
      const prompt = buildPrompt(lang, level, duration, topic || undefined);
      const text = await generateWithLocal(prompt, aiConfig);
      setOriginalText(text);
      setScreen("practice");
    } catch (e: any) {
      setError(e.message);
      setScreen("topic"); // go back
    }
  }, [lang, level, duration, topic, aiConfig]);

  // ── Compare ──
  const doCompare = useCallback(() => {
    if (!transcription.trim()) return;
    setResult(compareTexts(originalText, transcription, lang));
    setScreen("results");
  }, [originalText, transcription, lang]);

  // ── Key handler for global shortcuts ──
  useInput((input, _key) => {
    if (input === "q" && (screen === "lang" || screen === "results")) exit();
    if (input === "s" && screen === "lang") {
      setSettingsStep("menu");
      setScreen("settings");
    }
  });

  // ── Lang selection ──
  if (screen === "lang") {
    const items = LANG_CODES.map((c) => ({
      label: `${LANGUAGES[c].flag}  ${LANGUAGES[c].native}`,
      value: c,
    }));
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Text bold color={C.accent}>
            ◉ Dictune
          </Text>
          <Text dimColor> — Pronunciation clarity practice</Text>
        </Box>
        <Text bold>Select language:</Text>
        <SelectInput
          items={items}
          onSelect={(item) => {
            setLang(item.value as LangCode);
            setScreen("level");
          }}
        />
        <Box marginTop={1}>
          <Text dimColor>[s] Settings [q] Quit</Text>
        </Box>
      </Box>
    );
  }

  // ── Level selection ──
  if (screen === "level") {
    const items = LEVELS.map((l) => ({ label: l, value: l }));
    return (
      <Box flexDirection="column" padding={1}>
        <Text dimColor>
          {LANGUAGES[lang].flag} {LANGUAGES[lang].native}
        </Text>
        <Text bold>Select difficulty:</Text>
        <SelectInput
          items={items}
          onSelect={(item) => {
            setLevel(item.value as DifficultyLevel);
            setScreen("duration");
          }}
        />
      </Box>
    );
  }

  // ── Duration selection ──
  if (screen === "duration") {
    const items = DURATIONS.map((d) => ({
      label: d.label,
      value: String(d.value),
    }));
    return (
      <Box flexDirection="column" padding={1}>
        <Text dimColor>
          {LANGUAGES[lang].flag} {LANGUAGES[lang].native} · {level}
        </Text>
        <Text bold>Select duration:</Text>
        <SelectInput
          items={items}
          onSelect={(item) => {
            setDuration(Number(item.value));
            setScreen("topic");
          }}
        />
      </Box>
    );
  }

  // ── Topic input ──
  if (screen === "topic") {
    return (
      <Box flexDirection="column" padding={1}>
        <Text dimColor>
          {LANGUAGES[lang].flag} {LANGUAGES[lang].native} · {level} ·{" "}
          {DURATIONS.find((d) => d.value === duration)?.label}
        </Text>
        {error && <Text color={C.missing}>Error: {error}</Text>}
        <Box marginTop={1}>
          <Text bold>Topic (optional, press Enter to skip): </Text>
        </Box>
        <Box>
          <Text color={C.accent}>❯ </Text>
          <TextInput
            value={topic}
            onChange={setTopic}
            onSubmit={() => doGenerate()}
            placeholder="e.g. travel, cooking..."
          />
        </Box>
      </Box>
    );
  }

  // ── Generating ──
  if (screen === "generating") {
    return (
      <Box flexDirection="column" padding={1}>
        <Box>
          <Text color={C.accent}>
            <Spinner type="dots" />
          </Text>
          <Text> Generating practice text...</Text>
        </Box>
      </Box>
    );
  }

  // ── Practice: show text, get dictation ──
  if (screen === "practice") {
    return (
      <Box flexDirection="column" padding={1}>
        <Box
          borderStyle="round"
          borderColor={C.accent}
          paddingX={2}
          paddingY={1}
          flexDirection="column"
        >
          <Text bold color={C.accent}>
            ORIGINAL TEXT
          </Text>
          <Text>
            {"\n"}
            {originalText}
          </Text>
        </Box>
        <Box marginTop={1} flexDirection="column">
          <Text bold>Your dictation (paste or type, then press Enter):</Text>
          <Box marginTop={1}>
            <Text color={C.frost}>❯ </Text>
            <TextInput
              value={transcription}
              onChange={setTranscription}
              onSubmit={() => {
                if (transcription.trim()) doCompare();
              }}
              placeholder="Type or paste dictation result here..."
            />
          </Box>
        </Box>
      </Box>
    );
  }

  // ── Results ──
  if (screen === "results" && result) {
    const scoreColor =
      result.accuracy >= 90
        ? C.correct
        : result.accuracy >= 70
          ? C.wrong
          : C.missing;
    return (
      <Box flexDirection="column" padding={1}>
        {/* Diff panels */}
        <Box
          borderStyle="round"
          borderColor={C.dim}
          paddingX={2}
          paddingY={1}
          flexDirection="column"
        >
          <Text bold dimColor>
            ORIGINAL
          </Text>
          <DiffLine diff={result.diff} sep={result.sep} side="original" />
        </Box>
        <Box
          borderStyle="round"
          borderColor={C.dim}
          paddingX={2}
          paddingY={1}
          flexDirection="column"
          marginTop={-1}
        >
          <Text bold dimColor>
            DICTATION
          </Text>
          <DiffLine diff={result.diff} sep={result.sep} side="transcription" />
        </Box>

        {/* Legend */}
        <Box marginTop={1} gap={2}>
          <Text backgroundColor={C.wrong} color="black">
            {" "}
            abc{" "}
          </Text>
          <Text dimColor> {t.legendWrong}</Text>
          <Text backgroundColor={C.missing} color="white">
            {" "}
            abc{" "}
          </Text>
          <Text dimColor> {t.legendMissing}</Text>
          <Text backgroundColor={C.extra} color="white">
            {" "}
            abc{" "}
          </Text>
          <Text dimColor> {t.legendExtra}</Text>
        </Box>

        {/* Score */}
        <Box marginTop={1} flexDirection="column">
          <ProgressBar percent={result.accuracy} color={scoreColor} />
          <Box marginTop={1} gap={1}>
            <StatBox label={t.total} value={result.total} />
            <StatBox
              label={t.matched}
              value={result.matched}
              color={C.correct}
            />
            <StatBox label={t.wrong} value={result.wrong} color={C.wrong} />
            <StatBox
              label={t.missing}
              value={result.missing}
              color={C.missing}
            />
            <StatBox label={t.extra} value={result.extra} color={C.extra} />
          </Box>
        </Box>

        {/* Actions */}
        <Box marginTop={1}>
          <SelectInput
            items={[
              { label: `↻  ${t.tryAgain}`, value: "retry" },
              { label: `▸  ${t.generateNew}`, value: "new" },
              { label: "←  Change settings", value: "setup" },
              { label: "✕  Quit", value: "quit" },
            ]}
            onSelect={(item) => {
              if (item.value === "retry") {
                setTranscription("");
                setResult(null);
                setScreen("practice");
              } else if (item.value === "new") doGenerate();
              else if (item.value === "setup") {
                setResult(null);
                setScreen("lang");
              } else exit();
            }}
          />
        </Box>
      </Box>
    );
  }

  // ── Settings ──
  if (screen === "settings") {
    const statusDot =
      aiConfig.status === "connected"
        ? "🟢"
        : aiConfig.status === "error"
          ? "🔴"
          : "⚪";
    const statusText =
      aiConfig.status === "connected"
        ? `Connected (${aiConfig.model})`
        : aiConfig.status === "error"
          ? "Error"
          : "Not connected";

    if (settingsStep === "menu") {
      return (
        <Box flexDirection="column" padding={1}>
          <Text bold color={C.accent}>
            ⚙ API Server Settings
          </Text>
          <Box marginTop={1}>
            <Text>
              {statusDot} {statusText}
            </Text>
          </Box>
          <Box marginTop={1}>
            <SelectInput
              items={[
                {
                  label: `Service: ${AI_PRESETS[aiConfig.preset]?.name || aiConfig.preset}`,
                  value: "preset",
                },
                {
                  label: `Endpoint: ${aiConfig.baseURL || "(not set)"}`,
                  value: "url",
                },
                {
                  label: `API Key: ${aiConfig.apiKey ? "••••" : "(none)"}`,
                  value: "key",
                },
                { label: "Test Connection", value: "test" },
                ...(aiConfig.models.length > 0
                  ? [
                      {
                        label: `Model: ${aiConfig.model || "(select)"}`,
                        value: "model",
                      },
                    ]
                  : []),
                { label: "← Back", value: "back" },
              ]}
              onSelect={(item) => {
                if (item.value === "back") setScreen("lang");
                else if (item.value === "test") {
                  setSettingsStep("test");
                  setTestMsg("Testing...");
                  testLocalConnection(aiConfig)
                    .then((models) => {
                      setAiConfig((c) => ({
                        ...c,
                        status: "connected",
                        models,
                        model: c.model || models[0] || "",
                      }));
                      setTestMsg(
                        `Connected! ${models.length} model(s): ${models.slice(0, 3).join(", ")}${models.length > 3 ? "..." : ""}`,
                      );
                      setTimeout(() => setSettingsStep("menu"), 2000);
                    })
                    .catch((e) => {
                      setAiConfig((c) => ({
                        ...c,
                        status: "error",
                        models: [],
                      }));
                      setTestMsg(`Failed: ${e.message}`);
                      setTimeout(() => setSettingsStep("menu"), 2000);
                    });
                } else setSettingsStep(item.value as any);
              }}
            />
          </Box>
        </Box>
      );
    }

    if (settingsStep === "test") {
      return (
        <Box flexDirection="column" padding={1}>
          <Text bold color={C.accent}>
            ⚙ Testing connection...
          </Text>
          <Box marginTop={1}>
            {testMsg?.startsWith("Connected") ? (
              <Text color={C.correct}>{testMsg}</Text>
            ) : testMsg?.startsWith("Failed") ? (
              <Text color={C.missing}>{testMsg}</Text>
            ) : (
              <>
                <Text color={C.frost}>
                  <Spinner type="dots" />
                </Text>
                <Text> {testMsg}</Text>
              </>
            )}
          </Box>
        </Box>
      );
    }

    if (settingsStep === "preset") {
      const items = Object.entries(AI_PRESETS).map(([k, v]) => ({
        label: v.name,
        value: k,
      }));
      return (
        <Box flexDirection="column" padding={1}>
          <Text bold>Select AI service:</Text>
          <SelectInput
            items={items}
            onSelect={(item) => {
              const p = AI_PRESETS[item.value];
              setAiConfig((c) => ({
                ...c,
                preset: item.value,
                baseURL: p.baseURL,
                model: "",
                status: "disconnected",
                models: [],
              }));
              setSettingsStep("menu");
            }}
          />
        </Box>
      );
    }

    if (settingsStep === "url") {
      return (
        <Box flexDirection="column" padding={1}>
          <Text bold>Endpoint URL:</Text>
          <Box>
            <Text color={C.accent}>❯ </Text>
            <TextInput
              value={aiConfig.baseURL}
              onChange={(v) =>
                setAiConfig((c) => ({
                  ...c,
                  baseURL: v,
                  status: "disconnected",
                  models: [],
                }))
              }
              onSubmit={() => setSettingsStep("menu")}
            />
          </Box>
        </Box>
      );
    }

    if (settingsStep === "key") {
      return (
        <Box flexDirection="column" padding={1}>
          <Text bold>API Key (optional, Enter to skip):</Text>
          <Box>
            <Text color={C.accent}>❯ </Text>
            <TextInput
              value={aiConfig.apiKey}
              onChange={(v) => setAiConfig((c) => ({ ...c, apiKey: v }))}
              onSubmit={() => setSettingsStep("menu")}
            />
          </Box>
        </Box>
      );
    }

    if (settingsStep === "model" && aiConfig.models.length > 0) {
      const items = aiConfig.models.map((m) => ({ label: m, value: m }));
      return (
        <Box flexDirection="column" padding={1}>
          <Text bold>Select model:</Text>
          <SelectInput
            items={items}
            onSelect={(item) => {
              setAiConfig((c) => ({ ...c, model: item.value }));
              setSettingsStep("menu");
            }}
          />
        </Box>
      );
    }

    // fallback
    setSettingsStep("menu");
    return null;
  }

  return null;
}
