import {
  GoogleGenerativeAI,
  type GenerateContentResult,
  type GenerativeModel,
} from "@google/generative-ai";

/**
 * Tried in order until one succeeds. Google retires / gates model IDs over time;
 * 404 and “not available” errors advance to the next. No env needed for normal use.
 *
 * Optional: set GEMINI_MODEL to pin a single id (e.g. enterprise allowlist).
 */
const DEFAULT_MODEL_TRY_ORDER = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.5-pro",
] as const;

export function getGeminiModelCandidates(): string[] {
  const pinned = process.env.GEMINI_MODEL?.trim();
  if (pinned) return [pinned];
  return [...DEFAULT_MODEL_TRY_ORDER];
}

function isModelUnavailableError(e: unknown): boolean {
  const s = e instanceof Error ? e.message : String(e);
  return (
    s.includes("404") ||
    /not found/i.test(s) ||
    /no longer available/i.test(s) ||
    /not available to new users/i.test(s) ||
    /is not found for API version/i.test(s)
  );
}

type ModelInit = Omit<
  Parameters<GoogleGenerativeAI["getGenerativeModel"]>[0],
  "model"
>;

/**
 * Runs generateContent, trying each model name until one works.
 */
export async function generateContentWithModelFallback(
  genAI: GoogleGenerativeAI,
  initWithoutModel: ModelInit,
  request: Parameters<GenerativeModel["generateContent"]>[0],
): Promise<GenerateContentResult> {
  const candidates = getGeminiModelCandidates();
  let lastError: unknown;
  for (const model of candidates) {
    try {
      const m = genAI.getGenerativeModel({
        ...initWithoutModel,
        model,
      });
      return await m.generateContent(request);
    } catch (e) {
      lastError = e;
      if (isModelUnavailableError(e)) continue;
      throw e;
    }
  }
  throw lastError;
}
