import { NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { generateContentWithModelFallback } from "@/lib/ai/gemini-run";
import { getGeminiApiKey, missingGeminiEnvMessage } from "@/lib/ai/env";

export const runtime = "nodejs";
export const maxDuration = 60;

const AnswerLengthSchema = z.enum(["short", "medium", "long"]);

const BodySchema = z.object({
  action: z.enum(["generate_questions", "answer_question", "followup"]),
  jobId: z.string().min(1),
  count: z.number().int().min(5).max(50).optional(),
  question: z.string().optional(),
  answer: z.string().optional(),
  answerLength: AnswerLengthSchema.optional(),
  history: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .optional(),
});

function answerLengthInstructions(length: "short" | "medium" | "long"): {
  text: string;
  maxTokens: number;
} {
  switch (length) {
    case "short":
      return {
        text: "Length: SHORT — about 80–130 words total. Tight bullets or 2 very short paragraphs. No filler.",
        maxTokens: 1200,
      };
    case "long":
      return {
        text: "Length: LONG — about 350–550 words. Rich detail, examples, and trade-offs where useful.",
        maxTokens: 4500,
      };
    default:
      return {
        text: "Length: MEDIUM — about 180–280 words. Clear structure (context → actions → impact).",
        maxTokens: 2500,
      };
  }
}

function stripJsonFences(text: string): string {
  const t = text.trim();
  if (!t.startsWith("```")) return t;
  return t.replace(/^```[a-z0-9]*\s*/i, "").replace(/\s*```$/i, "").trim();
}

function summarizeCandidate(data: {
  profile: {
    display_name: string | null;
    headline: string | null;
    summary: string | null;
  } | null;
  skills: Array<{ name: string; proficiency: number | null; category: string | null }>;
  experiences: Array<{
    title: string;
    organization: string | null;
    bullets: unknown;
  }>;
  projects: Array<{ name: string; summary: string | null; tech_stack: string[] | null }>;
}): string {
  const topSkills = data.skills
    .slice(0, 25)
    .map((s) => `${s.name}${s.proficiency ? ` (${s.proficiency}/5)` : ""}`)
    .join(", ");
  const topExperience = data.experiences
    .slice(0, 12)
    .map((e) => `${e.title}${e.organization ? ` @ ${e.organization}` : ""}`)
    .join("; ");
  const topProjects = data.projects
    .slice(0, 12)
    .map((p) => p.name)
    .join("; ");
  return JSON.stringify(
    {
      profile: data.profile,
      skills: topSkills || "(none)",
      experiences: topExperience || "(none)",
      projects: topProjects || "(none)",
    },
    null,
    2,
  );
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400 },
    );
  }

  const key = getGeminiApiKey();
  if (!key) {
    return NextResponse.json(
      { error: missingGeminiEnvMessage },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, jobId } = parsed.data;
  const { data: job, error: jobErr } = await supabase
    .from("jobs")
    .select("id, title, company, status, jd_text, ai_insights")
    .eq("id", jobId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (jobErr) {
    return NextResponse.json({ error: "Failed to load selected job." }, { status: 500 });
  }
  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const [{ data: profile }, { data: skills }, { data: experiences }, { data: projects }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, headline, summary")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("master_skills")
        .select("name, proficiency, category")
        .eq("user_id", user.id)
        .order("name"),
      supabase
        .from("experience_blocks")
        .select("title, organization, bullets")
        .eq("user_id", user.id)
        .order("start_date", { ascending: false, nullsFirst: false }),
      supabase
        .from("projects")
        .select("name, summary, tech_stack")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false }),
    ]);

  const candidate = summarizeCandidate({
    profile: profile ?? null,
    skills: skills ?? [],
    experiences: experiences ?? [],
    projects: projects ?? [],
  });

  const common = [
    "You are a senior interview coach for high-signal technical roles.",
    "Use ONLY the provided candidate snapshot and job details.",
    "Never invent candidate achievements beyond given context.",
    "",
    "JOB:",
    JSON.stringify(
      {
        title: job.title,
        company: job.company,
        status: job.status,
        jd_text: job.jd_text,
        ai_insights: job.ai_insights,
      },
      null,
      2,
    ),
    "",
    "CANDIDATE SNAPSHOT:",
    candidate,
  ].join("\n");

  const genAI = new GoogleGenerativeAI(key);

  try {
    if (action === "generate_questions") {
      const count = parsed.data.count ?? 20;
      const prompt = `${common}

TASK:
Create exactly ${count} interview questions tailored to this role and candidate.
Mix technical depth, architecture, behavioral, product/business impact, and role-specific decision-making.
Return strict JSON:
{
  "questions": [
    { "question": "string", "category": "Technical|System Design|Behavioral|Leadership|Product", "level": "Core|Advanced" }
  ]
}`;
      const result = await generateContentWithModelFallback(
        genAI,
        {
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
          },
        },
        {
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        },
      );
      const raw = stripJsonFences(result.response.text());
      const parsedJson = JSON.parse(raw) as {
        questions?: Array<{ question: string; category?: string; level?: string }>;
      };
      const questions = (parsedJson.questions ?? [])
        .filter((q) => typeof q.question === "string" && q.question.trim())
        .slice(0, count);
      return NextResponse.json({ ok: true, questions });
    }

    if (action === "answer_question") {
      const q = (parsed.data.question ?? "").trim();
      if (!q) {
        return NextResponse.json({ error: "Question is required." }, { status: 400 });
      }
      const len = parsed.data.answerLength ?? "medium";
      const { text: lenInstr, maxTokens } = answerLengthInstructions(len);
      const prompt = `${common}

QUESTION:
${q}

TASK:
Write a strong sample answer the candidate can practice.
${lenInstr}
- structured (context → actions → impact)
- technically credible; no invented facts beyond the candidate snapshot

Also extract 6–14 memorization keywords/phrases from YOUR answer (tools, metrics, patterns, frameworks) — short strings only, no full sentences.

Return strict JSON only:
{
  "answer": "string",
  "keywords": ["string", ...]
}`;
      const result = await generateContentWithModelFallback(
        genAI,
        {
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: maxTokens,
            responseMimeType: "application/json",
          },
        },
        {
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        },
      );
      const raw = stripJsonFences(result.response.text());
      let answerText = "";
      let keywords: string[] = [];
      try {
        const j = JSON.parse(raw) as { answer?: string; keywords?: unknown };
        answerText = (j.answer ?? "").trim();
        if (Array.isArray(j.keywords)) {
          keywords = j.keywords
            .filter((k): k is string => typeof k === "string" && k.trim().length > 0)
            .map((k) => k.trim())
            .slice(0, 20);
        }
      } catch {
        answerText = raw.trim();
      }
      if (!answerText) {
        return NextResponse.json(
          { error: "Couldn’t generate an answer. Please try again." },
          { status: 502 },
        );
      }
      return NextResponse.json({ ok: true, answer: answerText, keywords });
    }

    const q = (parsed.data.question ?? "").trim();
    if (!q) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }
    const a = (parsed.data.answer ?? "").trim();
    const len = parsed.data.answerLength ?? "medium";
    const { text: lenInstr, maxTokens } = answerLengthInstructions(len);
    const history =
      parsed.data.history?.map((h, i) => `${i + 1}) Q: ${h.question}\nA: ${h.answer}`).join("\n\n") ??
      "(none)";

    const prompt = `${common}

BASE QUESTION:
${q}

CURRENT ANSWER:
${a || "(no answer yet)"}

FOLLOW-UP HISTORY:
${history}

TASK:
Generate the next deeper follow-up question on the same topic and provide a model answer.
${lenInstr}

Also extract 6–14 memorization keywords/phrases from the follow-up answer only.

Return strict JSON:
{
  "followup_question": "string",
  "followup_answer": "string",
  "keywords": ["string", ...]
}`;
    const result = await generateContentWithModelFallback(
      genAI,
      {
        generationConfig: {
          temperature: 0.45,
          maxOutputTokens: Math.min(maxTokens + 800, 8192),
          responseMimeType: "application/json",
        },
      },
      {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      },
    );
    const raw = stripJsonFences(result.response.text());
    const parsedJson = JSON.parse(raw) as {
      followup_question?: string;
      followup_answer?: string;
      keywords?: unknown;
    };
    if (!parsedJson.followup_question || !parsedJson.followup_answer) {
      return NextResponse.json(
        { error: "Couldn’t generate a follow-up. Please try again." },
        { status: 502 },
      );
    }
    const kw = Array.isArray(parsedJson.keywords)
      ? parsedJson.keywords
          .filter((k): k is string => typeof k === "string" && k.trim().length > 0)
          .map((k) => k.trim())
          .slice(0, 20)
      : [];
    return NextResponse.json({
      ok: true,
      followup_question: parsedJson.followup_question.trim(),
      followup_answer: parsedJson.followup_answer.trim(),
      keywords: kw,
    });
  } catch {
    return NextResponse.json(
      { error: "Interview guide generation failed. Please try again." },
      { status: 500 },
    );
  }
}

