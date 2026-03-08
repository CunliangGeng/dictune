import type { LangCode, DiffPart, ComparisonResult } from "./types";
import { LANGUAGES } from "./config";

// ─── Preprocessing ───────────────────────────────────────────

export function preprocess(text: string, lang: LangCode): string {
  let r = text.normalize("NFC").trim().replace(/\s+/g, " ");
  // Only strip punctuation for Chinese (char-level diff); keep for English/Dutch
  if (LANGUAGES[lang].diffMode === "char") {
    r = r.replace(/[\p{P}]/gu, "").replace(/\s+/g, " ").trim();
    r = r.replace(/[\uff01-\uff5e]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
    r = r.replace(/\u3000/g, " ");
  }
  r = r.toLowerCase();
  return r;
}

export function tokenize(text: string, lang: LangCode): string[] {
  return LANGUAGES[lang].diffMode === "word"
    ? text.split(/\s+/).filter(Boolean)
    : text.split("").filter((c) => c.trim());
}

// ─── LCS Diff ────────────────────────────────────────────────

interface RawDiffPart {
  type: "equal" | "removed" | "added";
  value: string[];
}

export function lcsArrays(a: string[], b: string[]): RawDiffPart[] {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);

  let i = m, j = n;
  const ops: { type: "equal" | "removed" | "added"; tok: string }[] = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      ops.push({ type: "equal", tok: a[i - 1] }); i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ type: "added", tok: b[j - 1] }); j--;
    } else {
      ops.push({ type: "removed", tok: a[i - 1] }); i--;
    }
  }
  ops.reverse();

  // Merge consecutive same-type ops
  const merged: RawDiffPart[] = [];
  for (const op of ops) {
    const last = merged[merged.length - 1];
    if (last && last.type === op.type) last.value.push(op.tok);
    else merged.push({ type: op.type, value: [op.tok] });
  }
  return merged;
}

// ─── Refine: pair removed+added into "wrong" ─────────────────

export function refineDiff(rawDiff: RawDiffPart[]): DiffPart[] {
  const result: DiffPart[] = [];
  for (let k = 0; k < rawDiff.length; k++) {
    const part = rawDiff[k];
    if (part.type === "equal") { result.push(part); continue; }
    if (part.type === "removed") {
      const next = rawDiff[k + 1];
      if (next && next.type === "added") {
        const pairs = Math.min(part.value.length, next.value.length);
        if (pairs > 0) result.push({ type: "wrong", original: part.value.slice(0, pairs), transcribed: next.value.slice(0, pairs) });
        if (part.value.length > pairs) result.push({ type: "removed", value: part.value.slice(pairs) });
        if (next.value.length > pairs) result.push({ type: "added", value: next.value.slice(pairs) });
        k++;
      } else result.push(part);
    } else result.push(part);
  }
  return result;
}

// ─── Chinese punctuation spacing ─────────────────────────────

export function getPuncSpacePositions(originalText: string): Set<number> {
  const positions = new Set<number>();
  let charIdx = -1;
  for (const ch of originalText) {
    if (/[\p{P}]/u.test(ch)) { if (charIdx >= 0) positions.add(charIdx); }
    else if (ch.trim()) charIdx++;
  }
  return positions;
}

export function insertPuncSpaces(diff: DiffPart[], spaceAfter: Set<number>): DiffPart[] {
  if (spaceAfter.size === 0) return diff;
  const result: DiffPart[] = [];
  let origPos = 0;

  for (const part of diff) {
    if (part.type === "added" || part.type === "space") { result.push(part); continue; }

    if (part.type === "equal") {
      let buf: string[] = [];
      for (const tok of part.value) {
        buf.push(tok);
        if (spaceAfter.has(origPos)) {
          result.push({ type: "equal", value: [...buf] });
          result.push({ type: "space" });
          buf = [];
        }
        origPos++;
      }
      if (buf.length) result.push({ type: "equal", value: buf });
    } else if (part.type === "wrong") {
      let oBuf: string[] = [], tBuf: string[] = [];
      for (let k = 0; k < part.original.length; k++) {
        oBuf.push(part.original[k]);
        tBuf.push(part.transcribed[k]);
        if (spaceAfter.has(origPos)) {
          result.push({ type: "wrong", original: [...oBuf], transcribed: [...tBuf] });
          result.push({ type: "space" });
          oBuf = []; tBuf = [];
        }
        origPos++;
      }
      if (oBuf.length) result.push({ type: "wrong", original: oBuf, transcribed: tBuf });
    } else if (part.type === "removed") {
      let buf: string[] = [];
      for (const tok of part.value) {
        buf.push(tok);
        if (spaceAfter.has(origPos)) {
          result.push({ type: "removed", value: [...buf] });
          result.push({ type: "space" });
          buf = [];
        }
        origPos++;
      }
      if (buf.length) result.push({ type: "removed", value: buf });
    }
  }
  return result;
}

// ─── Main comparison function ────────────────────────────────

export function compareTexts(original: string, transcription: string, lang: LangCode): ComparisonResult {
  const oT = tokenize(preprocess(original, lang), lang);
  const tT = tokenize(preprocess(transcription, lang), lang);
  let diff: DiffPart[] = refineDiff(lcsArrays(oT, tT));

  const isChar = LANGUAGES[lang].diffMode === "char";
  const sep = isChar ? "" : " ";
  if (isChar) diff = insertPuncSpaces(diff, getPuncSpacePositions(original));

  let matched = 0, wrong = 0, missing = 0, extra = 0;
  for (const p of diff) {
    if (p.type === "equal") matched += p.value.length;
    else if (p.type === "wrong") wrong += p.original.length;
    else if (p.type === "removed") missing += p.value.length;
    else if (p.type === "added") extra += p.value.length;
  }
  const total = oT.length;
  return { diff, accuracy: total > 0 ? Math.round((matched / total) * 100) : 100, total, matched, wrong, missing, extra, sep };
}
