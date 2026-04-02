export function getGeminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY;
}

/** Shown in the product UI when AI calls are blocked. */
export const missingGeminiEnvMessage =
  "The career assistant isn’t enabled on this deployment yet. Ask your administrator to turn on the AI service, or continue using manual forms.";
