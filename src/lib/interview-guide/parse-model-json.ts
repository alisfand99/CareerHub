/**
 * Gemini sometimes returns malformed JSON (e.g. raw newlines inside "answer"),
 * so JSON.parse throws and callers must not fall back to showing the entire raw blob.
 * These helpers extract answer text and keywords defensively.
 */

export function stripJsonFences(text: string): string {
  const t = text.trim();
  if (!t.startsWith("```")) return t;
  return t.replace(/^```[a-z0-9]*\s*/i, "").replace(/\s*```$/i, "").trim();
}

function normalizeKeywords(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((k): k is string => typeof k === "string" && k.trim().length > 0)
    .map((k) => k.trim())
    .slice(0, 20);
}

const HIGHLIGHT_STOP = new Set(
  [
    "about",
    "after",
    "also",
    "been",
    "being",
    "both",
    "could",
    "each",
    "first",
    "from",
    "have",
    "help",
    "here",
    "into",
    "just",
    "like",
    "made",
    "make",
    "many",
    "more",
    "most",
    "much",
    "only",
    "other",
    "over",
    "same",
    "some",
    "such",
    "than",
    "that",
    "their",
    "them",
    "then",
    "there",
    "these",
    "they",
    "this",
    "through",
    "under",
    "very",
    "want",
    "well",
    "were",
    "what",
    "when",
    "where",
    "which",
    "while",
    "will",
    "with",
    "would",
    "your",
  ].map((w) => w.toLowerCase()),
);

function escapeRegExpToken(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function scanRegex(s: string, re: RegExp, fn: (m: RegExpExecArray) => void): void {
  const r = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
  let m: RegExpExecArray | null;
  while ((m = r.exec(s)) !== null) {
    fn(m);
    if (m[0].length === 0) r.lastIndex++;
  }
}

/**
 * When the model omits `keywords`, derive short phrases from the answer (and optionally the question)
 * so the UI can still highlight memorization targets (products, frameworks, acronyms).
 */
export function inferHighlightTerms(answer: string, question?: string): string[] {
  const terms = new Set<string>();
  const a = answer.trim();
  if (!a) return [];

  scanRegex(a, /`([^`]{2,60})`/g, (m) => {
    const t = m[1].trim();
    if (t) terms.add(t);
  });

  scanRegex(a, /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g, (m) => {
    const t = m[1].trim();
    if (t.length >= 4) terms.add(t);
  });

  scanRegex(a, /\b[A-Z][a-z]*[A-Z][a-zA-Z0-9]{1,40}\b/g, (m) => {
    terms.add(m[0]);
  });

  scanRegex(a, /\b[A-Z]{2,5}\b/g, (m) => {
    terms.add(m[0]);
  });

  scanRegex(a, /\b[a-z]{2,}(?:-[a-z0-9]{2,})+\b/gi, (m) => {
    const t = m[0];
    if (t.length >= 5) terms.add(t);
  });

  scanRegex(a, /\b\d+(?:\.\d+)?%/g, (m) => {
    terms.add(m[0]);
  });
  scanRegex(a, /\b\d+[–-]\d+\s*(?:years?|mos?|months?)\b/gi, (m) => {
    terms.add(m[0]);
  });

  if (question?.trim()) {
    const qwords =
      question
        .toLowerCase()
        .match(/\b[a-z][a-z0-9]{4,}\b/g) ?? [];
    for (const w of qwords) {
      if (HIGHLIGHT_STOP.has(w)) continue;
      const re = new RegExp(`\\b${escapeRegExpToken(w)}\\b`, "i");
      const hit = a.match(re);
      if (hit) terms.add(hit[0]);
    }
  }

  return Array.from(terms)
    .filter((t) => t.length >= 2 && t.length <= 72)
    .sort((x, y) => y.length - x.length)
    .slice(0, 18);
}

/** If the model double-encoded JSON into answer, unwrap once or twice. */
function unwrapNestedAnswerString(answer: string): string {
  let t = answer.trim();
  for (let d = 0; d < 3; d++) {
    if (!t.startsWith("{")) break;
    try {
      const j = JSON.parse(t) as { answer?: string };
      if (typeof j.answer === "string" && j.answer.length > 0) t = j.answer;
      else break;
    } catch {
      const inner = extractJsonStringField(t, "answer");
      if (inner !== null && inner.length > 0) t = inner;
      else break;
    }
  }
  return t.trim();
}

/**
 * Extract a JSON string value for "field" by scanning after `"field": "`
 * and handling escapes until closing quote (works when outer JSON is invalid).
 */
export function extractJsonStringField(raw: string, field: string): string | null {
  const needle = `"${field}"`;
  const idx = raw.indexOf(needle);
  if (idx === -1) return null;
  const afterKey = raw.slice(idx + needle.length);
  const colon = afterKey.indexOf(":");
  if (colon === -1) return null;
  const rest = afterKey.slice(colon + 1).trimStart();
  if (!rest.startsWith('"')) return null;

  let i = 1;
  let out = "";
  while (i < rest.length) {
    const c = rest[i];
    if (c === "\\") {
      if (i + 1 >= rest.length) break;
      const n = rest[i + 1];
      if (n === "n") {
        out += "\n";
        i += 2;
        continue;
      }
      if (n === "r") {
        out += "\r";
        i += 2;
        continue;
      }
      if (n === "t") {
        out += "\t";
        i += 2;
        continue;
      }
      if (n === "u" && i + 5 < rest.length) {
        const hex = rest.slice(i + 2, i + 6);
        const code = parseInt(hex, 16);
        if (!Number.isNaN(code)) out += String.fromCharCode(code);
        i += 6;
        continue;
      }
      out += n;
      i += 2;
      continue;
    }
    if (c === '"') return out;
    out += c;
    i++;
  }
  // Unterminated string (truncated model output): still return usable text.
  return out.length > 0 ? out : null;
}

function tryParseKeywordsBracket(raw: string): string[] {
  const key = '"keywords"';
  const i = raw.indexOf(key);
  if (i < 0) return [];
  const lb = raw.indexOf("[", i);
  if (lb < 0) return [];
  let depth = 0;
  for (let k = lb; k < raw.length; k++) {
    const c = raw[k];
    if (c === "[") depth++;
    else if (c === "]") {
      depth--;
      if (depth === 0) {
        const slice = raw.slice(lb, k + 1);
        try {
          return normalizeKeywords(JSON.parse(slice) as unknown);
        } catch {
          return [];
        }
      }
    }
  }
  return [];
}

export function parseAnswerQuestionResponse(raw: string): {
  answer: string;
  keywords: string[];
} {
  const cleaned = stripJsonFences(raw).trim();
  let keywords: string[] = [];

  const tryObject = (obj: Record<string, unknown>): string | null => {
    if (Array.isArray(obj.keywords)) {
      keywords = normalizeKeywords(obj.keywords);
    }
    const a = obj.answer;
    if (typeof a !== "string") return null;
    return unwrapNestedAnswerString(a);
  };

  try {
    const j = JSON.parse(cleaned) as Record<string, unknown>;
    const ans = tryObject(j);
    if (ans) return { answer: ans, keywords };
  } catch {
    /* continue */
  }

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      const j = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
      const ans = tryObject(j);
      if (ans) return { answer: ans, keywords };
    } catch {
      /* continue */
    }
  }

  const looseAnswer = extractJsonStringField(cleaned, "answer");
  if (looseAnswer !== null) {
    const looseKw = tryParseKeywordsBracket(cleaned);
    return {
      answer: unwrapNestedAnswerString(looseAnswer),
      keywords: looseKw.length ? looseKw : keywords,
    };
  }

  return { answer: cleaned, keywords: [] };
}

export function parseFollowupResponse(raw: string): {
  followup_question: string;
  followup_answer: string;
  keywords: string[];
} {
  const cleaned = stripJsonFences(raw).trim();
  let keywords: string[] = [];

  const applyObject = (obj: Record<string, unknown>) => {
    if (Array.isArray(obj.keywords)) {
      keywords = normalizeKeywords(obj.keywords);
    }
  };

  try {
    const j = JSON.parse(cleaned) as Record<string, unknown>;
    applyObject(j);
    const fq = j.followup_question;
    const fa = j.followup_answer;
    if (typeof fq === "string" && typeof fa === "string" && fq.trim() && fa.trim()) {
      return {
        followup_question: fq.trim(),
        followup_answer: unwrapNestedAnswerString(fa.trim()),
        keywords,
      };
    }
  } catch {
    /* continue */
  }

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      const j = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
      applyObject(j);
      const fq = j.followup_question;
      const fa = j.followup_answer;
      if (typeof fq === "string" && typeof fa === "string" && fq.trim() && fa.trim()) {
        return {
          followup_question: fq.trim(),
          followup_answer: unwrapNestedAnswerString(fa.trim()),
          keywords,
        };
      }
    } catch {
      /* continue */
    }
  }

  const qLoose = extractJsonStringField(cleaned, "followup_question");
  const aLoose = extractJsonStringField(cleaned, "followup_answer");
  if (qLoose !== null && aLoose !== null) {
    const looseKw = tryParseKeywordsBracket(cleaned);
    return {
      followup_question: qLoose.trim(),
      followup_answer: unwrapNestedAnswerString(aLoose.trim()),
      keywords: looseKw.length ? looseKw : keywords,
    };
  }

  return {
    followup_question: "",
    followup_answer: "",
    keywords: [],
  };
}

/** Client: recover plain answer + keywords if state still holds a raw JSON string. */
export function normalizeAnswerForDisplay(
  text: string,
  existingKeywords?: string[],
): { text: string; keywords: string[] } {
  const t = text.trim();
  if (!t.startsWith("{") || !t.includes('"answer"')) {
    return { text, keywords: existingKeywords ?? [] };
  }
  const { answer, keywords } = parseAnswerQuestionResponse(t);
  if (!answer || answer === t) {
    return { text, keywords: existingKeywords ?? [] };
  }
  const merged = Array.from(
    new Set([...(existingKeywords ?? []).filter(Boolean), ...keywords]),
  );
  return { text: answer, keywords: merged };
}

export function normalizeFollowupAnswerForDisplay(
  text: string,
  existingKeywords?: string[],
): { text: string; keywords: string[] } {
  const t = text.trim();
  if (!t.startsWith("{") || !t.includes('"followup_answer"')) {
    return { text, keywords: existingKeywords ?? [] };
  }
  const p = parseFollowupResponse(t);
  if (!p.followup_answer) {
    return { text, keywords: existingKeywords ?? [] };
  }
  const merged = Array.from(
    new Set([...(existingKeywords ?? []).filter(Boolean), ...p.keywords]),
  );
  return { text: p.followup_answer, keywords: merged };
}
