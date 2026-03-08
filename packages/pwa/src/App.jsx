import { useState, useRef, useEffect, useCallback } from "react";
import {
  LANGUAGES, LANG_CODES, LEVELS, DURATIONS, UI_STRINGS,
  AI_PRESETS, DEFAULT_AI_CONFIG,
  compareTexts, generateText, testLocalConnection,
} from "@dictune/core";

// ─── Nord Aurora Themes (PWA-specific) ───────────────────────
const LIGHT = {
  "--bg": "#ECEFF4", "--surface": "#FFFFFF", "--surface-elevated": "#E5E9F0",
  "--border": "#D8DEE9", "--border-focus": "#B48EAD",
  "--text-primary": "#2E3440", "--text-secondary": "#4C566A",
  "--text-tertiary": "#7B88A1", "--text-placeholder": "#B0B8C8",
  "--accent": "#B48EAD", "--accent-hover": "#A3799C",
  "--accent-subtle": "rgba(180,142,173,0.10)",
  "--diff-wrong-bg": "rgba(235,203,139,0.22)", "--diff-wrong-text": "#8B6D1F", "--diff-wrong-border": "rgba(235,203,139,0.50)",
  "--diff-removed-bg": "rgba(191,97,106,0.16)", "--diff-removed-text": "#A3424D", "--diff-removed-border": "rgba(191,97,106,0.40)",
  "--diff-added-bg": "rgba(94,129,172,0.14)", "--diff-added-text": "#3D6494", "--diff-added-border": "rgba(94,129,172,0.35)",
  "--color-correct": "#A3BE8C", "--color-wrong": "#D4A740", "--color-missing": "#BF616A", "--color-extra": "#5E81AC",
  "--bar-bg": "#D8DEE9", "--score-great": "#A3BE8C", "--score-good": "#EBCB8B", "--score-needs-work": "#BF616A",
  "--btn-primary-bg": "rgba(180,142,173,0.13)", "--btn-primary-text": "#9B6F93", "--btn-primary-hover": "rgba(180,142,173,0.22)",
  "--btn-secondary-bg": "transparent", "--btn-secondary-hover": "rgba(46,52,64,0.05)",
  "--shadow-dropdown": "0 8px 24px rgba(46,52,64,0.10), 0 2px 8px rgba(46,52,64,0.06)",
  "--status-green": "#A3BE8C", "--status-red": "#BF616A", "--status-gray": "#7B88A1",
};
const DARK = {
  "--bg": "#242933", "--surface": "#2E3440", "--surface-elevated": "#3B4252",
  "--border": "#434C5E", "--border-focus": "#B48EAD",
  "--text-primary": "#ECEFF4", "--text-secondary": "#D8DEE9",
  "--text-tertiary": "#7B88A1", "--text-placeholder": "#5A6478",
  "--accent": "#B48EAD", "--accent-hover": "#C49EBD",
  "--accent-subtle": "rgba(180,142,173,0.10)",
  "--diff-wrong-bg": "rgba(235,203,139,0.18)", "--diff-wrong-text": "#EBCB8B", "--diff-wrong-border": "rgba(235,203,139,0.40)",
  "--diff-removed-bg": "rgba(191,97,106,0.22)", "--diff-removed-text": "#E8838C", "--diff-removed-border": "rgba(191,97,106,0.45)",
  "--diff-added-bg": "rgba(129,161,193,0.20)", "--diff-added-text": "#9DBAD6", "--diff-added-border": "rgba(129,161,193,0.40)",
  "--color-correct": "#A3BE8C", "--color-wrong": "#EBCB8B", "--color-missing": "#BF616A", "--color-extra": "#81A1C1",
  "--bar-bg": "#434C5E", "--score-great": "#A3BE8C", "--score-good": "#EBCB8B", "--score-needs-work": "#BF616A",
  "--btn-primary-bg": "rgba(180,142,173,0.14)", "--btn-primary-text": "#C49EBD", "--btn-primary-hover": "rgba(180,142,173,0.24)",
  "--btn-secondary-bg": "transparent", "--btn-secondary-hover": "rgba(236,239,244,0.05)",
  "--shadow-dropdown": "0 8px 24px rgba(0,0,0,0.30), 0 2px 8px rgba(0,0,0,0.18)",
  "--status-green": "#A3BE8C", "--status-red": "#BF616A", "--status-gray": "#5A6478",
};

// ─── Dropdown ────────────────────────────────────────────────
function Dropdown({ options, value, onChange, renderTrigger, renderOption }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { if (!open) return; const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, [open]);
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => setOpen(!open)} className="dd-trigger" style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "6px 10px 6px 12px", borderRadius: "8px", border: open ? "1.5px solid var(--accent)" : "1.5px solid var(--border)", background: open ? "var(--accent-subtle)" : "transparent", color: "var(--text-primary)", fontFamily: "var(--font-ui)", fontSize: "13px", fontWeight: 500, cursor: "pointer", transition: "all 0.15s ease", whiteSpace: "nowrap", userSelect: "none" }}>
        {renderTrigger(value)}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none", opacity: 0.4 }}><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, minWidth: "100%", width: "max-content", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", boxShadow: "var(--shadow-dropdown)", zIndex: 100, padding: "4px", animation: "dropIn 0.15s ease" }}>
          {options.map((opt) => { const val = typeof opt === "object" ? opt.value : opt; const active = val === value; return (
            <button key={val} onClick={() => { onChange(val); setOpen(false); }} style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "8px 12px", border: "none", borderRadius: "6px", background: active ? "var(--accent-subtle)" : "transparent", color: active ? "var(--accent)" : "var(--text-primary)", fontFamily: "var(--font-ui)", fontSize: "13px", fontWeight: active ? 600 : 400, cursor: "pointer", transition: "background 0.1s", textAlign: "left", whiteSpace: "nowrap" }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--surface-elevated)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = active ? "var(--accent-subtle)" : "transparent"; }}
            ><svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ opacity: active ? 1 : 0, flexShrink: 0 }}><path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              {renderOption ? renderOption(opt) : (typeof opt === "object" ? opt.label : opt)}</button>); })}
        </div>
      )}
    </div>
  );
}

// ─── Diff View ───────────────────────────────────────────────
function DiffView({ diff, sep, side }) {
  return (
    <div style={{ lineHeight: 2, fontSize: "16px", fontFamily: "var(--font-text)" }}>
      {diff.map((part, i) => {
        const sp = sep;
        if (part.type === "space") return <span key={i}>{" "}</span>;
        if (part.type === "equal") return <span key={i}>{part.value.join(sp)}{sp}</span>;
        if (part.type === "wrong") { const t = side === "original" ? part.original.join(sp) : part.transcribed.join(sp); return <span key={i} style={{ background: "var(--diff-wrong-bg)", color: "var(--diff-wrong-text)", borderRadius: "3px", padding: "1px 4px" }}>{t}{sp}</span>; }
        if (part.type === "removed") { const j = part.value.join(sp); return side === "original" ? <span key={i} style={{ background: "var(--diff-removed-bg)", color: "var(--diff-removed-text)", borderRadius: "3px", padding: "1px 4px" }}>{j}{sp}</span> : <span key={i} style={{ display: "inline-block", borderBottom: "2px dashed var(--diff-removed-border)", padding: "1px 4px", minWidth: "1.2em" }}><span style={{ visibility: "hidden" }}>{j}</span>{sp}</span>; }
        if (part.type === "added") { const j = part.value.join(sp); return side === "transcription" ? <span key={i} style={{ background: "var(--diff-added-bg)", color: "var(--diff-added-text)", borderRadius: "3px", padding: "1px 4px" }}>{j}{sp}</span> : <span key={i} style={{ display: "inline-block", borderBottom: "2px dashed var(--diff-added-border)", padding: "1px 4px", minWidth: "1.2em" }}><span style={{ visibility: "hidden" }}>{j}</span>{sp}</span>; }
        return null;
      })}
    </div>
  );
}

function AutoGrowTextarea({ value, onChange, placeholder, onKeyDown, textareaRef, minHeight }) {
  const adj = useCallback(() => { const el = textareaRef?.current; if (!el) return; el.style.height = "auto"; el.style.height = Math.max(el.scrollHeight, minHeight || 160) + "px"; }, [textareaRef, minHeight]);
  useEffect(() => { adj(); }, [value, adj]);
  return <textarea ref={textareaRef} className="dictune-textarea" placeholder={placeholder} value={value} onChange={(e) => { onChange(e); adj(); }} onKeyDown={onKeyDown} style={{ minHeight: minHeight || 160 }} />;
}

function DiffLegend({ lang }) {
  const t = UI_STRINGS[lang];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", padding: "10px 20px", borderTop: "1px solid var(--border)" }}>
      {[ { bg: "var(--diff-wrong-bg)", fg: "var(--diff-wrong-text)", label: t.legendWrong }, { bg: "var(--diff-removed-bg)", fg: "var(--diff-removed-text)", label: t.legendMissing }, { bg: "var(--diff-added-bg)", fg: "var(--diff-added-text)", label: t.legendExtra } ].map((it, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--text-tertiary)" }}>
          <span style={{ display: "inline-block", padding: "0 5px", borderRadius: 3, background: it.bg, color: it.fg, fontSize: "11px", fontWeight: 500, lineHeight: "18px" }}>abc</span>{it.label}
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--text-tertiary)" }}>
        <span style={{ display: "inline-block", width: 24, borderBottom: "2px dashed var(--diff-removed-border)" }} />{t.legendGap}
      </div>
    </div>
  );
}

// ─── Settings Sidebar ────────────────────────────────────────
function SettingsSidebar({ open, onClose, aiConfig, setAiConfig }) {
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState(null);
  const presetOpts = Object.entries(AI_PRESETS).map(([k, v]) => ({ value: k, label: v.name }));
  const handlePresetChange = (preset) => { const p = AI_PRESETS[preset]; setAiConfig((c) => ({ ...c, preset, baseURL: p.baseURL, model: "", status: "disconnected", models: [] })); setTestMsg(null); };
  const handleTest = async () => {
    setTesting(true); setTestMsg(null);
    try { const models = await testLocalConnection(aiConfig); setAiConfig((c) => ({ ...c, status: "connected", models, model: c.model || models[0] || "" })); setTestMsg({ ok: true, text: `Connected! ${models.length} model(s) found.` }); }
    catch (e) { setAiConfig((c) => ({ ...c, status: "error", models: [] })); setTestMsg({ ok: false, text: e.message }); }
    finally { setTesting(false); }
  };
  const inputStyle = { width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border)", background: "transparent", color: "var(--text-primary)", fontFamily: "var(--font-ui)", fontSize: "13px", outline: "none" };
  const statusDot = aiConfig.status === "connected" ? "var(--status-green)" : aiConfig.status === "error" ? "var(--status-red)" : "var(--status-gray)";
  const statusLabel = aiConfig.status === "connected" ? "Connected" : aiConfig.status === "error" ? "Error" : "Not connected";
  return (
    <>
      {open && <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", zIndex: 50 }} />}
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "340px", maxWidth: "90vw", background: "var(--surface)", borderLeft: "1px solid var(--border)", boxShadow: open ? "-8px 0 32px rgba(0,0,0,0.12)" : "none", transform: open ? "translateX(0)" : "translateX(100%)", transition: "transform 0.3s cubic-bezier(0.22,1,0.36,1)", zIndex: 60, display: "flex", flexDirection: "column", overflow: "auto" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "15px", fontWeight: 600 }}>AI Settings</span>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", color: "var(--text-tertiary)", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg></button>
        </div>
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div><div style={{ fontSize: "13px", fontWeight: 600 }}>Use Local AI</div><div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "2px" }}>Connect to Ollama, LM Studio, etc.</div></div>
            <button onClick={() => setAiConfig((c) => ({ ...c, enabled: !c.enabled }))} style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", background: aiConfig.enabled ? "var(--accent)" : "var(--border)", position: "relative", transition: "background 0.2s" }}><div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: aiConfig.enabled ? 23 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} /></button>
          </div>
          {aiConfig.enabled && (<>
            <div><label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-tertiary)", display: "block", marginBottom: "6px" }}>Service</label><select value={aiConfig.preset} onChange={(e) => handlePresetChange(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>{presetOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
            <div><label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-tertiary)", display: "block", marginBottom: "6px" }}>Endpoint URL</label><input style={inputStyle} value={aiConfig.baseURL} onChange={(e) => setAiConfig((c) => ({ ...c, baseURL: e.target.value, status: "disconnected", models: [] }))} placeholder="http://localhost:11434/v1" /></div>
            <div><label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-tertiary)", display: "block", marginBottom: "6px" }}>API Key (optional)</label><input style={inputStyle} type="password" value={aiConfig.apiKey} onChange={(e) => setAiConfig((c) => ({ ...c, apiKey: e.target.value }))} placeholder="Usually not needed" /></div>
            <button className="btn-accent" onClick={handleTest} disabled={testing || !aiConfig.baseURL} style={{ width: "100%", padding: "10px", fontSize: "13px" }}>{testing ? "Testing..." : "Test Connection"}</button>
            {testMsg && <div style={{ padding: "10px 14px", borderRadius: "8px", fontSize: "12px", background: testMsg.ok ? "rgba(163,190,140,0.12)" : "rgba(191,97,106,0.12)", color: testMsg.ok ? "var(--status-green)" : "var(--status-red)" }}>{testMsg.text}</div>}
            {aiConfig.models.length > 0 && <div><label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-tertiary)", display: "block", marginBottom: "6px" }}>Model</label><select style={{ ...inputStyle, cursor: "pointer" }} value={aiConfig.model} onChange={(e) => setAiConfig((c) => ({ ...c, model: e.target.value }))}>{aiConfig.models.map((m) => <option key={m} value={m}>{m}</option>)}</select></div>}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text-tertiary)" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: statusDot }} />{statusLabel}{aiConfig.model && aiConfig.status === "connected" && <span style={{ marginLeft: "auto", fontSize: "11px", opacity: 0.7 }}>{aiConfig.model}</span>}</div>
            <div style={{ fontSize: "11px", color: "var(--text-tertiary)", lineHeight: 1.5, padding: "12px", background: "var(--surface-elevated)", borderRadius: "8px" }}><strong style={{ color: "var(--text-secondary)" }}>Connection trouble?</strong><br/>Ollama: set <code style={{ fontSize: "10px", background: "var(--border)", padding: "1px 4px", borderRadius: "3px" }}>OLLAMA_ORIGINS=*</code><br/>LM Studio: enable CORS in settings<br/>Jan: CORS enabled by default</div>
          </>)}
          {!aiConfig.enabled && <div style={{ fontSize: "12px", color: "var(--text-tertiary)", lineHeight: 1.6 }}>Using the built-in AI model. Enable Local AI to use your own models via Ollama, LM Studio, or any OpenAI-compatible service.</div>}
        </div>
      </div>
    </>
  );
}

// ─── Main ────────────────────────────────────────────────────
export default function Dictune() {
  const [lang, setLang] = useState("en");
  const [level, setLevel] = useState("B1");
  const [duration, setDuration] = useState(1);
  const [topic, setTopic] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [transcription, setTranscription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [dark, setDark] = useState(() => typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aiConfig, setAiConfig] = useState(DEFAULT_AI_CONFIG);
  const textareaRef = useRef(null);
  const origRef = useRef(null);
  const [origHeight, setOrigHeight] = useState(160);
  const t = UI_STRINGS[lang];
  const theme = dark ? DARK : LIGHT;

  useEffect(() => { const mq = window.matchMedia?.("(prefers-color-scheme: dark)"); if (!mq) return; const h = (e) => setDark(e.matches); mq.addEventListener("change", h); return () => mq.removeEventListener("change", h); }, []);
  useEffect(() => { if (origRef.current) setOrigHeight(Math.max(origRef.current.scrollHeight, 160)); }, [originalText, lang]);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true); setError(null); setOriginalText(""); setTranscription(""); setComparisonResult(null);
    try { setOriginalText(await generateText(lang, level, duration, topic || undefined, aiConfig)); }
    catch (e) { setError(e.message); } finally { setIsGenerating(false); }
  }, [lang, level, duration, topic, aiConfig]);
  const handleCompare = useCallback(() => { if (!transcription.trim()) return; setComparisonResult(compareTexts(originalText, transcription, lang)); }, [originalText, transcription, lang]);
  const handleTryAgain = useCallback(() => { setTranscription(""); setComparisonResult(null); setTimeout(() => textareaRef.current?.focus(), 50); }, []);
  const handleReset = useCallback(() => { setOriginalText(""); setTranscription(""); setComparisonResult(null); setError(null); }, []);
  useEffect(() => { if (originalText && !comparisonResult) setTimeout(() => textareaRef.current?.focus(), 100); }, [originalText, comparisonResult]);

  const hasText = originalText.length > 0;
  const isCompared = comparisonResult !== null;
  const langOpts = LANG_CODES.map((k) => ({ value: k, label: `${LANGUAGES[k].flag} ${LANGUAGES[k].native}` }));
  const pcs = { padding: "20px", minHeight: "160px", display: "flex", flexDirection: "column" };
  const pls = { fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-tertiary)", marginBottom: "12px", userSelect: "none" };
  const scoreColor = comparisonResult ? comparisonResult.accuracy >= 90 ? "var(--score-great)" : comparisonResult.accuracy >= 70 ? "var(--score-good)" : "var(--score-needs-work)" : "var(--accent)";

  return (
    <div style={{ ...theme, "--font-ui": "'DM Sans', 'Segoe UI', system-ui, sans-serif", "--font-text": "'Source Serif 4', 'Georgia', 'Noto Serif SC', serif", minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font-ui)", color: "var(--text-primary)", transition: "background 0.3s, color 0.3s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,400&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .dictune-textarea{width:100%;padding:0;border:none;font-family:var(--font-text);font-size:16px;line-height:2;color:var(--text-primary);background:transparent;resize:none;outline:none;overflow:hidden}
        .dictune-textarea::placeholder{color:var(--text-placeholder)}
        .btn-soft{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 24px;border-radius:10px;border:1.5px solid var(--border);background:var(--btn-secondary-bg);color:var(--text-secondary);font-family:var(--font-ui);font-size:14px;font-weight:500;cursor:pointer;transition:all 0.15s ease;white-space:nowrap}
        .btn-soft:hover:not(:disabled){background:var(--btn-secondary-hover);border-color:var(--text-tertiary)}.btn-soft:disabled{opacity:0.4;cursor:not-allowed}
        .btn-accent{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 24px;border-radius:10px;border:1.5px solid transparent;background:var(--btn-primary-bg);color:var(--btn-primary-text);font-family:var(--font-ui);font-size:14px;font-weight:600;cursor:pointer;transition:all 0.15s ease;white-space:nowrap}
        .btn-accent:hover:not(:disabled){background:var(--btn-primary-hover)}.btn-accent:disabled{opacity:0.4;cursor:not-allowed}
        .btn-lg{padding:15px 36px;font-size:15px;border-radius:12px}
        .topic-input{flex:1;padding:7px 12px;border:1.5px solid var(--border);border-radius:8px;font-family:var(--font-ui);font-size:13px;color:var(--text-primary);background:transparent;outline:none;transition:border-color 0.2s;min-width:0}
        .topic-input:focus{border-color:var(--border-focus)}.topic-input::placeholder{color:var(--text-placeholder)}
        .dd-trigger:hover{border-color:var(--text-tertiary)!important;background:var(--surface-elevated)!important}
        select{appearance:none;background-image:url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%237B88A1' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:30px}
        @keyframes dropIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse-dot{0%,100%{opacity:.3}50%{opacity:1}}.loading-dots span{animation:pulse-dot 1.4s infinite both}.loading-dots span:nth-child(2){animation-delay:.2s}.loading-dots span:nth-child(3){animation-delay:.4s}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.fade-in{animation:fadeIn .35s ease forwards}
        @keyframes growBar{from{width:0%}}.progress-fill{animation:growBar .8s cubic-bezier(.22,1,.36,1) forwards}
        @media(min-width:768px){.main-grid{grid-template-columns:1fr 1fr!important}}
      `}</style>
      <SettingsSidebar open={settingsOpen} onClose={() => setSettingsOpen(false)} aiConfig={aiConfig} setAiConfig={setAiConfig} />
      <header style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)", padding: "12px 24px", display: "flex", alignItems: "center", gap: "10px", position: "sticky", top: 0, zIndex: 10, transition: "background 0.3s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ color: "var(--accent)" }}><circle cx="12" cy="12" r="3" fill="currentColor"/><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 2a8 8 0 11-8 8c0-1.2.26-2.33.73-3.35" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg><span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.02em" }}>Dictune</span></div>
        <span style={{ flex: 1 }} />
        <button onClick={() => setSettingsOpen(true)} style={{ width: 34, height: 34, borderRadius: "50%", border: "1.5px solid var(--border)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-tertiary)", flexShrink: 0 }} title="AI Settings"><svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="2.5"/><path d="M13.3 10.2a1.2 1.2 0 00.2 1.3l.1.1a1.5 1.5 0 11-2.1 2.1l-.1-.1a1.2 1.2 0 00-1.3-.2 1.2 1.2 0 00-.7 1.1v.1a1.5 1.5 0 01-3 0v-.1a1.2 1.2 0 00-.8-1.1 1.2 1.2 0 00-1.3.2l-.1.1a1.5 1.5 0 11-2.1-2.1l.1-.1a1.2 1.2 0 00.2-1.3 1.2 1.2 0 00-1.1-.7h-.1a1.5 1.5 0 010-3h.1a1.2 1.2 0 001.1-.8 1.2 1.2 0 00-.2-1.3l-.1-.1a1.5 1.5 0 112.1-2.1l.1.1a1.2 1.2 0 001.3.2h.1a1.2 1.2 0 00.7-1.1v-.1a1.5 1.5 0 013 0v.1a1.2 1.2 0 00.7 1.1 1.2 1.2 0 001.3-.2l.1-.1a1.5 1.5 0 112.1 2.1l-.1.1a1.2 1.2 0 00-.2 1.3v.1a1.2 1.2 0 001.1.7h.1a1.5 1.5 0 010 3h-.1a1.2 1.2 0 00-1.1.7z"/></svg></button>
        <button onClick={() => setDark(!dark)} style={{ width: 34, height: 34, borderRadius: "50%", border: "1.5px solid var(--border)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-tertiary)", flexShrink: 0 }} title={dark ? "Light" : "Dark"}>{dark ? <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="3"/><path d="M8 1v2m0 10v2m-7-7h2m10 0h2m-2.5-4.5L11 4.5m-6 7L3.5 12.5m0-9L5 4.5m6 7l1.5 1.5"/></svg> : <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M13.5 10.8A6.5 6.5 0 015.2 2.5a6 6 0 108.3 8.3z"/></svg>}</button>
      </header>
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
        <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0", alignItems: "stretch" }}>
          <div style={{ background: "var(--surface)", borderRadius: "14px 14px 0 0", border: "1px solid var(--border)", borderBottom: "none", overflow: "visible", display: "flex", flexDirection: "column", transition: "background 0.3s" }}>
            <div style={pcs}><div style={pls}>{t.original}</div>
              {error && <div className="fade-in" style={{ padding: "12px 16px", background: "var(--diff-removed-bg)", borderRadius: "8px", color: "var(--diff-removed-text)", fontSize: "14px", marginBottom: "12px" }}>{error}</div>}
              {isGenerating && !originalText && <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, minHeight: "80px" }}><span className="loading-dots" style={{ fontSize: "20px", color: "var(--accent)" }}><span>●</span><span>●</span><span>●</span></span></div>}
              {!hasText && !isGenerating && <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, minHeight: "80px", color: "var(--text-tertiary)", fontSize: "14px", textAlign: "center", gap: "8px" }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.2 }}><path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>{t.welcome}</div>}
              {hasText && !isCompared && <div ref={origRef} className="fade-in" style={{ fontFamily: "var(--font-text)", fontSize: "16px", lineHeight: 2 }}>{originalText}</div>}
              {hasText && isCompared && <div className="fade-in"><DiffView diff={comparisonResult.diff} sep={comparisonResult.sep} side="original" /></div>}
            </div>
            <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border)", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", marginTop: "auto" }}>
              <Dropdown options={langOpts} value={lang} onChange={(v) => { setLang(v); handleReset(); }} renderTrigger={(v) => `${LANGUAGES[v].flag} ${LANGUAGES[v].native}`} renderOption={(o) => o.label} />
              <Dropdown options={LEVELS} value={level} onChange={setLevel} renderTrigger={(v) => v} />
              <Dropdown options={DURATIONS} value={duration} onChange={setDuration} renderTrigger={(v) => DURATIONS.find((d) => d.value === v)?.label} renderOption={(o) => o.label} />
              <span style={{ width: 1, height: 16, background: "var(--border)", flexShrink: 0, margin: "0 2px" }} />
              <input className="topic-input" type="text" placeholder={t.topicPlaceholder} value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !isGenerating) handleGenerate(); }} style={{ minWidth: "100px" }} />
              <button className="btn-accent" onClick={handleGenerate} disabled={isGenerating} style={{ padding: "7px 18px", fontSize: "13px", flexShrink: 0 }}>{isGenerating ? <span className="loading-dots"><span>●</span><span>●</span><span>●</span></span> : <><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M14.5 1.5l-5 14-3-6-6-3 14-5z"/></svg>{t.generate}</>}</button>
            </div>
          </div>
          <div style={{ background: "var(--surface)", borderRadius: "0 0 14px 14px", border: "1px solid var(--border)", opacity: hasText ? 1 : 0.4, transition: "all 0.3s ease", pointerEvents: hasText ? "auto" : "none", display: "flex", flexDirection: "column" }}>
            <div style={pcs}><div style={pls}>{t.dictation}</div>
              {isCompared ? <div className="fade-in"><DiffView diff={comparisonResult.diff} sep={comparisonResult.sep} side="transcription" /></div> : <AutoGrowTextarea textareaRef={textareaRef} placeholder={t.placeholder} value={transcription} onChange={(e) => setTranscription(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey && transcription.trim()) handleCompare(); }} minHeight={origHeight} />}
            </div>
            {isCompared && <DiffLegend lang={lang} />}
            {!isCompared && hasText && <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", marginTop: "auto" }}><button className="btn-accent" onClick={handleCompare} disabled={!transcription.trim()} style={{ padding: "7px 20px", fontSize: "13px" }}>{t.compare}</button></div>}
          </div>
        </div>
        {isCompared && (
          <div className="fade-in" style={{ marginTop: "20px" }}>
            <div style={{ background: "var(--surface)", borderRadius: "14px", border: "1px solid var(--border)", padding: "24px", transition: "background 0.3s" }}>
              <div style={{ marginBottom: "20px" }}><div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "10px" }}><span style={{ fontSize: "42px", fontWeight: 800, fontFamily: "var(--font-ui)", lineHeight: 1, color: scoreColor, fontVariantNumeric: "tabular-nums" }}>{comparisonResult.accuracy}%</span><span style={{ fontSize: "15px", fontWeight: 500, color: "var(--text-tertiary)" }}>{t.accuracy}</span></div><div style={{ width: "100%", height: "10px", borderRadius: "5px", background: "var(--bar-bg)", overflow: "hidden" }}><div className="progress-fill" style={{ width: `${comparisonResult.accuracy}%`, height: "100%", borderRadius: "5px", background: scoreColor }} /></div></div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px", marginBottom: "24px" }}>
                {[{ label: t.total, value: comparisonResult.total, color: "var(--text-primary)", dot: null },{ label: t.matched, value: comparisonResult.matched, color: "var(--color-correct)", dot: "var(--color-correct)" },{ label: t.wrong, value: comparisonResult.wrong, color: "var(--color-wrong)", dot: "var(--color-wrong)" },{ label: t.missing, value: comparisonResult.missing, color: "var(--color-missing)", dot: "var(--color-missing)" },{ label: t.extra, value: comparisonResult.extra, color: "var(--color-extra)", dot: "var(--color-extra)" }].map((s, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 6px", background: "var(--surface-elevated)", borderRadius: "10px" }}><div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "3px" }}>{s.dot && <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot }} />}<span style={{ fontSize: "20px", fontWeight: 700, color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.value}</span></div><span style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 500 }}>{s.label}</span></div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button className="btn-soft btn-lg" onClick={handleTryAgain}><svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 8a6 6 0 0111.5-2.4M14 2v3.6h-3.6"/><path d="M14 8a6 6 0 01-11.5 2.4M2 14v-3.6h3.6"/></svg>{t.tryAgain}</button>
                <button className="btn-accent btn-lg" onClick={handleGenerate} disabled={isGenerating}>{isGenerating ? <span className="loading-dots"><span>●</span><span>●</span><span>●</span></span> : <><svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor"><path d="M14.5 1.5l-5 14-3-6-6-3 14-5z"/></svg>{t.generateNew}</>}</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
