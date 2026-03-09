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

// ─── Colors ─────────────────────────────────────────────────

const C = {
  accent: "#B48EAD",
  correct: "#A3BE8C",
  wrong: "red", // ANSI red bg — substituted
  missing: "yellow", // ANSI yellow bg — removed/missing
  extra: "green", // ANSI green bg — added/extra
  dim: "#4C566A",
  frost: "#88C0D0",
  muted: "#7B88A1",
  silver: "#C0C0C0",
};

const DASHED_BOX = {
  topLeft: "┌",
  top: "╌",
  topRight: "┐",
  right: "╎",
  bottomRight: "┘",
  bottom: "╌",
  bottomLeft: "└",
  left: "╎",
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
            <Text key={i}>
              <Text backgroundColor={C.wrong} color="white" bold>
                {t}
              </Text>
              {sep}
            </Text>
          );
        }
        if (part.type === "removed") {
          if (side === "original")
            return (
              <Text key={i}>
                <Text backgroundColor={C.missing} color="black">
                  {part.value.join(sep)}
                </Text>
                {sep}
              </Text>
            );
          const dots = "·".repeat(
            part.value.join(sep).length + (sep === " " ? 1 : 0),
          );
          return (
            <Text key={i} dimColor>
              {dots}
            </Text>
          );
        }
        if (part.type === "added") {
          if (side === "transcription")
            return (
              <Text key={i}>
                <Text backgroundColor={C.extra} color="black">
                  {part.value.join(sep)}
                </Text>
                {sep}
              </Text>
            );
          const dots = "·".repeat(
            part.value.join(sep).length + (sep === " " ? 1 : 0),
          );
          return (
            <Text key={i} dimColor>
              {dots}
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
  suffix,
}: {
  label: string;
  value: number;
  color?: string;
  suffix?: string;
}) {
  return (
    <Box flexDirection="column" alignItems="center" paddingX={2}>
      <Text bold color={color}>
        {value}
        {suffix || ""}
      </Text>
      <Text dimColor>{label}</Text>
    </Box>
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
  const [prevScreen, setPrevScreen] = useState<Screen>("lang");
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const [genStatus, setGenStatus] = useState("");

  const t = UI_STRINGS[lang];
  const levelLabel = {
    easy: t.levelEasy,
    medium: t.levelMedium,
    hard: t.levelHard,
  }[level];

  // ── Generate ──
  const doGenerate = useCallback(async () => {
    setScreen("generating");
    setError(null);
    setOriginalText("");
    setTranscription("");
    setResult(null);
    setGenStatus("");
    try {
      const prompt = buildPrompt(lang, level, duration, topic || undefined);
      // Auto-connect if needed (same as PWA)
      let config = aiConfig;
      if (!config.model || config.status !== "connected") {
        try {
          const models = await testLocalConnection(config);
          const model = config.model || models[0] || "";
          config = { ...config, status: "connected", models, model };
          setAiConfig(config);
        } catch {
          throw new Error(
            `Cannot connect to ${AI_PRESETS[config.preset]?.name || config.baseURL}. Check settings [s] and try again.`,
          );
        }
      }
      const serviceName = AI_PRESETS[config.preset]?.name || config.baseURL;
      setGenStatus(`Using ${config.model} on ${serviceName}`);
      const text = await generateWithLocal(prompt, config);
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

  // ── Navigate to settings (available from any non-input screen) ──
  const openSettings = useCallback(() => {
    setSettingsStep("menu");
    setPrevScreen(screen);
    setScreen("settings");
  }, [screen]);

  // ── Key handler for global shortcuts ──
  useInput((input, key) => {
    if (input === "q" && (screen === "lang" || screen === "results")) exit();
    if (
      input === "s" &&
      screen !== "settings" &&
      screen !== "topic" &&
      screen !== "practice" &&
      screen !== "generating"
    ) {
      openSettings();
    }

    // Back navigation with [b] for selection screens, Escape for text-input screens
    if (input === "b" && screen === "level") setScreen("lang");
    if (input === "b" && screen === "duration") setScreen("level");
    if (key.escape && screen === "topic") setScreen("duration");
    if (key.escape && screen === "practice") {
      setTranscription("");
      setScreen("topic");
    }

    // Number shortcuts for selection screens
    if (screen === "lang") {
      const idx = Number(input) - 1;
      if (idx >= 0 && idx < LANG_CODES.length) {
        setLang(LANG_CODES[idx]);
        setScreen("level");
      }
    }
    if (screen === "level") {
      const idx = Number(input) - 1;
      if (idx >= 0 && idx < LEVELS.length) {
        setLevel(LEVELS[idx]);
        setScreen("duration");
      }
    }
    if (screen === "duration") {
      const idx = Number(input) - 1;
      if (idx >= 0 && idx < DURATIONS.length) {
        setDuration(DURATIONS[idx].value);
        setScreen("topic");
      }
    }

    // Letter shortcuts for results actions
    if (screen === "results") {
      if (input === "r") {
        setTranscription("");
        setResult(null);
        setScreen("practice");
      } else if (input === "n") doGenerate();
      else if (input === "b") {
        setResult(null);
        setScreen("lang");
      }
    }
  });

  // ── Lang selection ──
  if (screen === "lang") {
    const items = LANG_CODES.map((c, i) => ({
      label: `[${i + 1}] ${LANGUAGES[c].flag}  ${LANGUAGES[c].native}`,
      value: c,
    }));
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Text bold color={C.accent}>
            ◉ Dictune
          </Text>
          <Text dimColor> — {t.tagline}</Text>
        </Box>
        <Text bold>{t.selectLanguage}</Text>
        <SelectInput
          items={items}
          onSelect={(item) => {
            setLang(item.value as LangCode);
            setScreen("level");
          }}
        />
        <Box marginTop={1}>
          <Text dimColor>
            [s] {t.settings} [q] {t.quit}
          </Text>
        </Box>
      </Box>
    );
  }

  // ── Level selection ──
  if (screen === "level") {
    const levelLabels = {
      easy: t.levelEasy,
      medium: t.levelMedium,
      hard: t.levelHard,
    };
    const items = LEVELS.map((l, i) => ({
      label: `[${i + 1}] ${levelLabels[l]}`,
      value: l,
    }));
    return (
      <Box flexDirection="column" padding={1}>
        <Text dimColor>
          {LANGUAGES[lang].flag} {LANGUAGES[lang].native}
        </Text>
        <Text bold>{t.selectDifficulty}</Text>
        <SelectInput
          items={items}
          onSelect={(item) => {
            setLevel(item.value as DifficultyLevel);
            setScreen("duration");
          }}
        />
        <Box marginTop={1}>
          <Text dimColor>
            [b] {t.back} [s] {t.settings}
          </Text>
        </Box>
      </Box>
    );
  }

  // ── Duration selection ──
  if (screen === "duration") {
    const items = DURATIONS.map((d, i) => ({
      label: `[${i + 1}] ${d.label}`,
      value: String(d.value),
    }));
    return (
      <Box flexDirection="column" padding={1}>
        <Text dimColor>
          {LANGUAGES[lang].flag} {LANGUAGES[lang].native} · {levelLabel}
        </Text>
        <Text bold>{t.selectDuration}</Text>
        <SelectInput
          items={items}
          onSelect={(item) => {
            setDuration(Number(item.value));
            setScreen("topic");
          }}
        />
        <Box marginTop={1}>
          <Text dimColor>
            [b] {t.back} [s] {t.settings}
          </Text>
        </Box>
      </Box>
    );
  }

  // ── Topic input ──
  if (screen === "topic") {
    return (
      <Box flexDirection="column" padding={1}>
        <Text dimColor>
          {LANGUAGES[lang].flag} {LANGUAGES[lang].native} · {levelLabel} ·{" "}
          {DURATIONS.find((d) => d.value === duration)?.label}
        </Text>
        {error && <Text color={C.missing}>Error: {error}</Text>}
        <Box marginTop={1}>
          <Text bold>{t.topicPlaceholder}</Text>
        </Box>
        <Box>
          <Text color={C.accent}>❯ </Text>
          <TextInput
            value={topic}
            onChange={setTopic}
            onSubmit={() => doGenerate()}
            placeholder={t.enterToSkip}
          />
        </Box>
        <Box marginTop={1}>
          <Text dimColor>[Esc] {t.back}</Text>
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
          <Text> {t.generatingText}</Text>
        </Box>
        {genStatus && (
          <Box marginTop={0}>
            <Text dimColor> {genStatus}</Text>
          </Box>
        )}
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
          flexShrink={0}
        >
          <Text bold color={C.accent}>
            {t.original.toUpperCase()}
          </Text>
          <Text wrap="wrap">
            {"\n"}
            {originalText}
          </Text>
        </Box>
        <Box marginTop={1} flexDirection="column" flexShrink={0}>
          <Text bold>{t.dictation}</Text>
          <Text dimColor>{t.placeholder}</Text>
          <Box marginTop={1}>
            <Text color={C.frost}>❯ </Text>
            <TextInput
              value={transcription}
              onChange={setTranscription}
              onSubmit={() => {
                if (transcription.trim()) doCompare();
              }}
              placeholder={t.enterToCompare}
            />
          </Box>
          <Box marginTop={1}>
            <Text dimColor>[Esc] {t.back}</Text>
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
        {/* Diff panels (side-by-side) */}
        <Box flexDirection="row" gap={1}>
          <Box
            borderStyle="round"
            borderColor={C.accent}
            paddingX={1}
            paddingY={1}
            flexDirection="column"
            width="50%"
          >
            <Text bold color={C.accent}>
              {t.original.toUpperCase()}
            </Text>
            <DiffLine diff={result.diff} sep={result.sep} side="original" />
          </Box>
          <Box
            borderStyle="round"
            borderColor={C.frost}
            paddingX={1}
            paddingY={1}
            flexDirection="column"
            width="50%"
          >
            <Text bold color={C.frost}>
              {t.dictation.toUpperCase()}
            </Text>
            <DiffLine
              diff={result.diff}
              sep={result.sep}
              side="transcription"
            />
          </Box>
        </Box>

        {/* Legend */}
        <Box marginTop={1} gap={2}>
          <Text backgroundColor={C.wrong} color="white">
            {" "}
          </Text>
          <Text dimColor>{t.legendWrong}</Text>
          <Text backgroundColor={C.missing} color="black">
            {" "}
          </Text>
          <Text dimColor>{t.legendMissing}</Text>
          <Text backgroundColor={C.extra} color="black">
            {" "}
          </Text>
          <Text dimColor>{t.legendExtra}</Text>
          <Text dimColor>· {t.legendGap}</Text>
        </Box>

        {/* Stats */}
        <Box marginTop={1} alignSelf="flex-start">
          <Box
            borderStyle={DASHED_BOX}
            borderColor={C.silver}
            paddingX={1}
            gap={1}
          >
            <StatBox
              label={t.accuracy}
              value={result.accuracy}
              color={scoreColor}
              suffix="%"
            />
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
              { label: `[r] ${t.tryAgain}`, value: "retry" },
              { label: `[n] ${t.generateNew}`, value: "new" },
              { label: `[s] ${t.settings}`, value: "settings" },
              { label: `[b] ${t.back}`, value: "setup" },
              { label: `[q] ${t.quit}`, value: "quit" },
            ]}
            onSelect={(item) => {
              if (item.value === "retry") {
                setTranscription("");
                setResult(null);
                setScreen("practice");
              } else if (item.value === "new") doGenerate();
              else if (item.value === "settings") {
                openSettings();
              } else if (item.value === "setup") {
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
            ⚙ AI Settings
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
                if (item.value === "back") setScreen(prevScreen);
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
      const selfHosted = Object.entries(AI_PRESETS).filter(
        ([, v]) => v.group === "self-hosted",
      );
      const cloud = Object.entries(AI_PRESETS).filter(
        ([, v]) => v.group === "cloud",
      );
      const items = [
        { label: "── Self-hosted ──", value: "__header_sh" },
        ...selfHosted.map(([k, v]) => ({ label: `  ${v.name}`, value: k })),
        { label: "── Cloud ──", value: "__header_cl" },
        ...cloud.map(([k, v]) => ({ label: `  ${v.name}`, value: k })),
      ];
      return (
        <Box flexDirection="column" padding={1}>
          <Text bold>Select AI service:</Text>
          <SelectInput
            items={items}
            onSelect={(item) => {
              if (item.value.startsWith("__header")) return;
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
          <Text bold>
            API Key{" "}
            {AI_PRESETS[aiConfig.preset]?.needsKey
              ? "(required)"
              : "(optional, Enter to skip)"}
            :
          </Text>
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
