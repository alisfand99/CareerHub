import { NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { getGeminiApiKey, missingGeminiEnvMessage } from "@/lib/ai/env";
import { generateContentWithModelFallback } from "@/lib/ai/gemini-run";
import { fetchSuperResumeBundle } from "@/lib/queries/super-resume";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({
  jobId: z.string().min(1),
  extraFocus: z.string().max(1000).nullable().optional(),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "jobId is required (string)" },
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

  const { jobId, extraFocus } = parsed.data;

  const { data: job, error: jobErr } = await supabase
    .from("jobs")
    .select("id, title, company, jd_text, ai_insights")
    .eq("id", jobId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (jobErr) {
    return NextResponse.json({ error: jobErr.message }, { status: 500 });
  }
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const { bundle } = await fetchSuperResumeBundle(supabase, user.id);

  const profile = bundle.profile
    ? {
        display_name: bundle.profile.display_name,
        headline: bundle.profile.headline,
        summary: bundle.profile.summary,
        location: bundle.profile.location,
        website: bundle.profile.website,
        public_email: bundle.profile.public_email,
      }
    : null;

  const experiences = bundle.experiences.map((e) => ({
    title: e.title,
    organization: e.organization,
    location: e.location,
    start_date: e.start_date,
    end_date: e.end_date,
    is_current: e.is_current,
    bullets: Array.isArray(e.bullets)
      ? e.bullets.filter((b): b is string => typeof b === "string")
      : [],
  }));

  const skills = bundle.skills.map((s) => ({
    name: s.name,
    category: s.category,
    proficiency: s.proficiency,
    tools: s.tools ?? [],
    evidence: s.evidence,
  }));

  const projects = bundle.projects.map((p) => ({
    name: p.name,
    summary: p.summary,
    tech_stack: p.tech_stack ?? [],
    url: p.url,
  }));

  const education = bundle.education.map((e) => ({
    school: e.school,
    degree: e.degree,
    field_of_study: e.field_of_study,
    start_date: e.start_date,
    end_date: e.end_date,
    is_current: e.is_current,
    description: e.description,
  }));

  const certifications = bundle.certifications.map((c) => ({
    name: c.name,
    issuing_org: c.issuing_org,
    issue_date: c.issue_date,
    expiration_date: c.expiration_date,
    credential_url: c.credential_url,
  }));

  const languages = bundle.languages.map((l) => ({
    name: l.name,
    proficiency: l.proficiency,
  }));

  const prompt = [
    "You are an expert resume writer.",
    "Generate a targeted resume in concise Markdown for the selected job.",
    "Use ONLY information from the provided profile/experience/skills/projects/education/certifications/languages.",
    "Do not invent companies, titles, dates, metrics, or tools that are not provided.",
    "If job description exists, prioritize matching keywords naturally.",
    "Output sections in this order:",
    "1) Name + headline",
    "2) Professional summary (4-6 lines)",
    "3) Core skills (comma-separated)",
    "4) Experience (most relevant first, bullet points with impact)",
    "5) Projects (if relevant)",
    "6) Education + Certifications",
    "7) Languages",
    "",
    "TARGET JOB:",
    JSON.stringify(
      {
        title: job.title,
        company: job.company,
        jd_text: job.jd_text,
        ai_insights: job.ai_insights,
      },
      null,
      2,
    ),
    "",
    extraFocus ? `EXTRA USER FOCUS: ${extraFocus}` : "",
    "",
    "CANDIDATE DATA:",
    JSON.stringify(
      {
        profile,
        experiences,
        skills,
        projects,
        education,
        certifications,
        languages,
      },
      null,
      2,
    ),
  ].join("\n");

  try {
    const genAI = new GoogleGenerativeAI(key);
    const result = await generateContentWithModelFallback(
      genAI,
      {
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
        },
      },
      {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      },
    );

    const resumeMarkdown = result.response.text().trim();
    if (!resumeMarkdown) {
      return NextResponse.json(
        { error: "AI returned an empty resume draft." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, resumeMarkdown });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Resume generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
