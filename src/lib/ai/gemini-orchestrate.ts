import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGeminiApiKey } from "@/lib/ai/env";
import { generateContentWithModelFallback } from "@/lib/ai/gemini-run";
import { buildOrchestratorSystemPrompt } from "@/lib/ai/orchestrator-prompt";
import {
  OrchestratorPlanSchema,
  type OrchestratorPlan,
} from "@/lib/ai/orchestrator-schema";

function stripJsonFences(text: string): string {
  const t = text.trim();
  if (!t.startsWith("```")) return t;
  return t
    .replace(/^```[a-z0-9]*\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export async function generateOrchestratorPlan(
  userMessage: string,
  context: {
    skillNames: string[];
    jobsSummary: { title: string; company: string }[];
  },
): Promise<OrchestratorPlan> {
  const key = getGeminiApiKey();
  if (!key) {
    throw new Error("GEMINI_API_KEY_MISSING");
  }

  const genAI = new GoogleGenerativeAI(key);

  const system = buildOrchestratorSystemPrompt(context);
  const result = await generateContentWithModelFallback(
    genAI,
    {
      generationConfig: {
        temperature: 0.25,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    },
    {
      contents: [
        {
          role: "user",
          parts: [{ text: `${system}\n\n---\nUSER MESSAGE:\n${userMessage}` }],
        },
      ],
    },
  );

  const raw = result.response.text();
  const cleaned = stripJsonFences(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return {
      intent: "general",
      assistant_message:
        "I could not parse a structured plan from the model. Try rephrasing, or paste a shorter JD chunk.",
    };
  }

  const safe = OrchestratorPlanSchema.safeParse(parsed);
  if (!safe.success) {
    return {
      intent: "general",
      assistant_message:
        "The model returned an unexpected shape. Please try again with a clearer request (JD, skill update, contact, or outreach).",
    };
  }

  return safe.data;
}
