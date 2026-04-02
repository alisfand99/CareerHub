export function getGeminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY;
}

export const missingGeminiEnvMessage =
  "GEMINI_API_KEY is not set. Add it to .env.local (server-only) to enable the AI orchestrator.";
