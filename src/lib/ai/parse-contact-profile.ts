import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { getGeminiApiKey } from "@/lib/ai/env";
import { generateContentWithModelFallback } from "@/lib/ai/gemini-run";

function stripJsonFences(text: string): string {
  const t = text.trim();
  if (!t.startsWith("```")) return t;
  return t
    .replace(/^```[a-z0-9]*\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export const ContactParsedSchema = z.object({
  full_name: z.string().min(1),
  company: z.string().nullable(),
  role_title: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  linkedin_url: z.string().nullable(),
  keywords: z.array(z.string()).default([]),
});

export type ParsedContactProfile = z.infer<typeof ContactParsedSchema>;

const SYSTEM = `You extract structured contact data for a recruiter CRM.
Input may be: a LinkedIn profile URL, pasted LinkedIn "About" or profile text, or a mix of both.
Return ONE JSON object only (no markdown):
- full_name: person's display name (required string; if unknown use "Unknown contact")
- company: current employer name or null
- role_title: current headline or title or null
- email: valid email if clearly present, else null
- phone: phone number if clearly present (digits + formatting), else null
- linkedin_url: full https URL if the input contains a LinkedIn profile URL or you can infer it; else null
- keywords: 3–8 short strings (skills, domains, seniority) — not full sentences

Use null for missing fields. Never invent email or phone.`;

export async function parseContactProfileFromRaw(
  raw: string,
): Promise<ParsedContactProfile> {
  const key = getGeminiApiKey();
  if (!key) {
    throw new Error("GEMINI_API_KEY_MISSING");
  }

  const genAI = new GoogleGenerativeAI(key);
  const result = await generateContentWithModelFallback(
    genAI,
    {
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    },
    {
      contents: [
        {
          role: "user",
          parts: [{ text: `${SYSTEM}\n\n---\nRAW INPUT:\n${raw.slice(0, 120_000)}` }],
        },
      ],
    },
  );

  const text = result.response.text();
  const cleaned = stripJsonFences(text);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("PARSE_JSON_FAILED");
  }

  const safe = ContactParsedSchema.safeParse(parsed);
  if (!safe.success) {
    throw new Error("PARSE_SCHEMA_FAILED");
  }

  const d = safe.data;
  return {
    ...d,
    keywords: (d.keywords ?? []).map((k) => k.trim()).filter(Boolean).slice(0, 12),
  };
}
